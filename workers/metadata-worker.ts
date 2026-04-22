import { PgBoss, Job } from "pg-boss"
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3"
import { db } from "../db"
import { licenses, plans, domains, users, payments } from "../db/schema"
import { eq, and, isNull, lt, isNotNull, sql } from "drizzle-orm"
import { getStripe } from "../lib/stripe"
import { enqueueEmailJob } from "../lib/queue"
import { createAuditLog } from "../lib/audit"

interface MetadataJobData {
  domainName: string
  userId: string
  action: "upsert" | "delete"
}

interface LicenseMetadata {
  license: boolean
  is_trial?: boolean
  trial_ends_at?: string | null
  total_slots?: number
  plan_name?: string
}

const QUEUE_NAME = "license-metadata-export"
const CRON_TRIAL_SYNC = "cron-trial-sync"

function getR2Client(): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT!,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })
}

function getR2Bucket(): string {
  return process.env.R2_BUCKET_NAME!
}

function metadataKey(domainName: string): string {
  return `license/${domainName}.json`
}

async function upsertMetadata(domainName: string, userId: string) {
  // Fetch license info from DB
  const [domainRecord] = await db
    .select()
    .from(domains)
    .where(and(eq(domains.domainName, domainName), isNull(domains.deletedAt)))
    .limit(1)

  if (!domainRecord) {
    throw new Error(`Domain ${domainName} not found in DB`)
  }

  const [license] = await db
    .select()
    .from(licenses)
    .where(eq(licenses.id, domainRecord.licenseId))
    .limit(1)

  if (!license) {
    throw new Error(`License for domain ${domainName} not found`)
  }

  // const [plan] = await db
  //   .select()
  //   .from(plans)
  //   .where(eq(plans.id, license.planId))
  //   .limit(1)

  const now = new Date()
  const isStripeActive = ["active", "trialing"].includes(license.status)
  const isTrialExpired =
    license.isTrial && license.trialEndsAt && license.trialEndsAt < now
  const isRevoked = license.status === "revoked"

  // 1. Must NOT be revoked
  // 2. Either Stripe is active (including canceled/pending) AND not expired, OR it's a Lifetime license
  const isValid =
    !isRevoked && (license.isLifetime || (isStripeActive && !isTrialExpired))

  const r2 = getR2Client()
  const bucket = getR2Bucket()
  const key = metadataKey(domainName)

  // If NOT valid, the "Proper Fix" is to DELETE the domain file from R2
  // rather than uploading a file that says license: false.
  if (!isValid) {
    try {
      await r2.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: key,
        })
      )
      // console.log(`[metadata-worker] Successfully revoked (deleted) metadata for domain: ${domainName}`)
      return
    } catch (err) {
      // It's okay if it fails because the file doesn't exist, but we log other errors
      console.error(
        `[metadata-worker] Failed to delete metadata for revoked domain ${domainName}:`,
        err
      )
      throw err
    }
  }

  const metadata: LicenseMetadata = {
    license: true,
    is_trial: license.isTrial,
    trial_ends_at:
      license.isTrial && license.trialEndsAt
        ? license.trialEndsAt.toISOString()
        : null,
  }

  try {
    await r2.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: JSON.stringify(metadata, null, 2),
        ContentType: "application/json",
      })
    )
  } catch (err) {
    console.error(
      `[metadata-worker] ❌ R2 Upload Failed for ${domainName}:`,
      err
    )
    throw err
  }
}

async function deleteMetadata(domainName: string) {
  const r2 = getR2Client()
  const key = metadataKey(domainName)

  await r2.send(
    new DeleteObjectCommand({
      Bucket: getR2Bucket(),
      Key: key,
    })
  )

  // console.log(`[metadata-worker] Deleted metadata for domain: ${domainName}`)
}

async function processTrialToLifetimeConversion() {
  const stripe = getStripe()
  const now = new Date()

  // Find all active trial licenses that have expired
  const expiredTrials = await db
    .select({
      id: licenses.id,
      userId: licenses.userId,
      planId: licenses.planId,
      setupIntentId: licenses.stripeSubscriptionId,
    })
    .from(licenses)
    .where(
      and(
        eq(licenses.isTrial, true),
        eq(licenses.status, "active"),
        lt(licenses.trialEndsAt, now)
      )
    )

  if (expiredTrials.length === 0) return

  for (const trial of expiredTrials) {
    try {
      if (!trial.setupIntentId) throw new Error("No setup intent ID found")

      // 1. Get the payment method from the SetupIntent
      const setupIntent = await stripe.setupIntents.retrieve(
        trial.setupIntentId
      )
      const paymentMethodId = setupIntent.payment_method as string
      if (!paymentMethodId)
        throw new Error("No payment method found on setup intent")

      // 2. Get plan price info
      const [plan] = await db
        .select()
        .from(plans)
        .where(eq(plans.id, trial.planId))
        .limit(1)

      if (!plan) throw new Error("Plan not found")

      // 3. Get user customer ID
      const stripeCustomerId =
        (setupIntent.customer as string) ||
        (await db
          .select({ stripeCustomerId: payments.stripeCustomerId })
          .from(payments)
          .where(
            and(
              eq(payments.userId, trial.userId),
              sql`${payments.stripeCustomerId} IS NOT NULL`
            )
          )
          .limit(1)
          .then((res) => res[0]?.stripeCustomerId))

      if (!stripeCustomerId) throw new Error("Stripe customer ID not found")

      // 4. Create and confirm PaymentIntent (OFF-SESSION)
      await stripe.paymentIntents.create({
        amount: plan.finalPrice,
        currency: plan.currency || "usd",
        customer: stripeCustomerId,
        payment_method: paymentMethodId,
        confirm: true,
        off_session: true,
        description: `Conversion from Trial to Lifetime: ${plan.name}`,
        metadata: {
          license_id: trial.id,
          plan_id: plan.id,
          conversion: "trial_to_lifetime",
          license_quantity: "1",
          is_lifetime: "true",
        },
      })

      // We don't update the license status here.
      // The Stripe Webhook will handle the conversion upon successful payment.
    } catch (err: any) {
      console.error(
        `[metadata-worker] Failed to process trial conversion for license ${trial.id}:`,
        err.message
      )

      // Mark as past_due if payment setup failed
      await db
        .update(licenses)
        .set({ status: "past_due", updatedAt: new Date() })
        .where(eq(licenses.id, trial.id))
    }
  }
}

async function syncExpiredTrials() {
  // console.log("[metadata-worker] Starting expired trial sync...")

  const now = new Date()

  // Find licenses where isTrial is true and status is 'expired' or 'past_due' (already processed)
  // or trials that were trialing/active but are now past their date.
  // CRITICAL: We only sync metadata for ones that are TRULY expired and not paid.
  const expiredLicenses = await db
    .select()
    .from(licenses)
    .where(
      and(
        eq(licenses.isTrial, true),
        lt(licenses.trialEndsAt, now),
        sql`${licenses.status} IN ('active', 'trialing', 'expired', 'past_due') AND ${licenses.status} != 'revoked'`
      )
    )

  for (const license of expiredLicenses) {
    // If it's still trialing/active but should be expired, mark it.
    if (license.status === "active" || license.status === "trialing") {
      await db
        .update(licenses)
        .set({
          status: "expired",
          updatedAt: now,
        })
        .where(eq(licenses.id, license.id))
    }

    // Find all domains for this license and update metadata to 'revoked' (delete from R2)
    const licenseDomains = await db
      .select()
      .from(domains)
      .where(and(eq(domains.licenseId, license.id), isNull(domains.deletedAt)))

    for (const dom of licenseDomains) {
      try {
        await upsertMetadata(dom.domainName, license.userId)
      } catch (error) {
        console.error(
          `[metadata-worker] Failed to sync metadata for expired trial domain ${dom.domainName}:`,
          error
        )
      }
    }
  }
}

async function syncTrialReminders() {
  // console.log("[metadata-worker] Starting trial reminder check...")

  const now = new Date()

  // Find users whose trial is ending in the next 3 days or 24 hours
  // and haven't received the corresponding reminder yet
  const trialingLicenses = await db
    .select({
      license: licenses,
      user: users,
    })
    .from(licenses)
    .innerJoin(users, eq(licenses.userId, users.id))
    .where(
      and(
        eq(licenses.isTrial, true),
        eq(licenses.status, "trialing"),
        isNotNull(licenses.trialEndsAt)
      )
    )

  for (const row of trialingLicenses) {
    const { license, user } = row
    if (!license.trialEndsAt) continue

    const timeUntilExpiry = license.trialEndsAt.getTime() - now.getTime()
    const hoursUntilExpiry = timeUntilExpiry / (60 * 60 * 1000)

    let reminderType: "3-day" | "24-hour" | null = null

    // Logic:
    // If < 24h away and '24-hour' reminder not sent
    if (
      hoursUntilExpiry > 0 &&
      hoursUntilExpiry <= 24 &&
      license.lastTrialReminderSent !== "24-hour"
    ) {
      reminderType = "24-hour"
    }
    // If < 72h away and '3-day' reminder not sent (and not already in 24h window)
    else if (
      hoursUntilExpiry > 24 &&
      hoursUntilExpiry <= 72 &&
      !license.lastTrialReminderSent
    ) {
      reminderType = "3-day"
    }

    if (reminderType) {
      try {
        await enqueueEmailJob({
          template: "trial-ending",
          to: user.email,
          props: {
            contactName: user.name || user.email.split("@")[0],
            trialEndsAt: license.trialEndsAt.toLocaleDateString(),
            daysRemaining: reminderType === "24-hour" ? "24 hours" : "3 days",
          },
        })

        await db
          .update(licenses)
          .set({
            lastTrialReminderSent: reminderType,
            updatedAt: new Date(),
          })
          .where(eq(licenses.id, license.id))

        await createAuditLog(
          null,
          "license.trial_reminder_sent",
          "license",
          license.id,
          { reminderType, trialEndsAt: license.trialEndsAt }
        )

        // console.log(`[metadata-worker] Sent ${reminderType} reminder to user ${user.email}`)
      } catch (error) {
        console.error(
          `[metadata-worker] Failed to send trial reminder to ${user.email}:`,
          error
        )
      }
    }
  }
}

export async function registerMetadataWorker(boss: PgBoss) {
  await boss.createQueue(QUEUE_NAME)
  await boss.work<MetadataJobData>(
    QUEUE_NAME,
    { batchSize: 1 },
    async (jobs: Job<MetadataJobData>[]) => {
      for (const job of jobs) {
        const { domainName, userId, action } = job.data

        try {
          if (action === "upsert") {
            await upsertMetadata(domainName, userId)
          } else if (action === "delete") {
            await deleteMetadata(domainName)
          } else {
            throw new Error(`Unknown action: ${action}`)
          }
        } catch (error) {
          console.error(
            `[metadata-worker] Failed job ${job.id} (${action} ${domainName}):`,
            error
          )
          throw error
        }
      }
    }
  )

  await boss.createQueue(CRON_TRIAL_SYNC)
  await boss.work(CRON_TRIAL_SYNC, async () => {
    await processTrialToLifetimeConversion()
    await syncExpiredTrials()
    await syncTrialReminders()
  })

  // Schedule trial sync & reminders every hour
  await boss.schedule(CRON_TRIAL_SYNC, "0 * * * *")

  // console.log(`[metadata-worker] Subscribed to "${QUEUE_NAME}" & "${CRON_TRIAL_SYNC}" queue`)
}
