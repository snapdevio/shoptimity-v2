import { PgBoss, Job } from "pg-boss"
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3"
import { db } from "../db"
import {
  licenses,
  plans,
  domains,
  users,
  payments,
} from "../db/schema"
import { eq, and, isNull, lt, gt, isNotNull, sql } from "drizzle-orm"
import { getStripe } from "../lib/stripe"
import { enqueueEmailJob } from "../lib/queue"
import { createAuditLog } from "../lib/audit"

// ============================================================================
// Type Definitions
// ============================================================================

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
  features?: string[]
}

interface TrialExpiredResult {
  success: boolean
  licensesExpired: number
  licensesFailed: number
  domainsUpdated: number
  errors: Array<{ licenseId: string; error: string }>
}

const QUEUE_NAME = "license-metadata-export"
const CRON_TRIAL_SYNC = "cron-trial-sync"
const CRON_INTERVAL = "0 * * * *" // Every hour

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
  return `shoptimity-v2/license/${domainName}.json`
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

  const [plan] = await db
    .select()
    .from(plans)
    .where(eq(plans.id, license.planId))
    .limit(1)

  if (!plan) {
    throw new Error(`Plan ${license.planId} not found`)
  }

  // // Fetch enabled features for this plan
  // const planFeaturesList = await db
  //   .select({
  //     slug: features.slug,
  //   })
  //   .from(planFeatures)
  //   .innerJoin(features, eq(planFeatures.featureId, features.id))
  //   .where(
  //     and(
  //       eq(planFeatures.planId, license.planId),
  //       eq(planFeatures.isEnabled, true)
  //     )
  //   )

  // const featureSlugs = planFeaturesList.map((f) => f.slug)
  // // console.log(`[metadata-worker] Found ${featureSlugs.length} features for plan ${plan.name}`)

  const metadata: LicenseMetadata = {
    license: true,
    is_trial: license.isTrial,
    trial_ends_at:
      license.isTrial && license.trialEndsAt
        ? license.trialEndsAt.toISOString()
        : null,
    plan_name: plan.name,
    // features: featureSlugs,
  }

  // console.log(`[metadata-worker] 🚀 Exporting Metadata for ${domainName}:`, JSON.stringify(metadata, null, 2))

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

async function syncExpiredTrials(): Promise<TrialExpiredResult> {
  const now = new Date()
  const result: TrialExpiredResult = {
    success: true,
    licensesExpired: 0,
    licensesFailed: 0,
    domainsUpdated: 0,
    errors: [],
  }

  try {
    if (process.env.NODE_ENV === "development") {
      console.log("[metadata-worker] Starting expired trial sync...")
    }
    // Find licenses where isTrial is true and trial end date has passed
    // Status can be 'active', 'trialing', or 'expired' but NOT 'revoked'
    const expiredLicenses = await db
      .select()
      .from(licenses)
      .where(
        and(
          eq(licenses.isTrial, true),
          lt(licenses.trialEndsAt!, now),
          sql`${licenses.status} IN ('active', 'trialing', 'expired', 'past_due')`
        )
      )

    if (expiredLicenses.length === 0) {
      if (process.env.NODE_ENV === "development") {
        console.log("[metadata-worker] No expired trials found")
      }
      return result
    }

    // console.log(
    //   `[metadata-worker] Found ${expiredLicenses.length} expired trials to sync`
    // )

    for (const license of expiredLicenses) {
      try {
        // Mark as expired if not already
        if (license.status !== "expired") {
          await db
            .update(licenses)
            .set({
              status: "expired",
              updatedAt: now,
            })
            .where(eq(licenses.id, license.id))

          result.licensesExpired++

          await createAuditLog(
            null,
            "license.trial_expired",
            "license",
            license.id,
            {
              trialEndsAt: license.trialEndsAt,
              expiredAt: now,
            }
          )
          if (process.env.NODE_ENV === "development") {
            console.log(
              `[metadata-worker] Marked license ${license.id} as expired`
            )
          }
        }

        // Find all active domains for this license
        const licenseDomains = await db
          .select()
          .from(domains)
          .where(
            and(eq(domains.licenseId, license.id), isNull(domains.deletedAt))
          )

        if (licenseDomains.length === 0) {
          continue
        }

        // Update metadata for each domain to reflect they're no longer valid
        // (will be deleted from R2)
        for (const dom of licenseDomains) {
          try {
            await upsertMetadata(dom.domainName, license.userId)
            result.domainsUpdated++
          } catch (domainErr: any) {
            result.success = false
            result.licensesFailed++

            const errorMsg =
              domainErr instanceof Error ? domainErr.message : String(domainErr)
            result.errors.push({
              licenseId: license.id,
              error: `Failed to sync domain ${dom.domainName}: ${errorMsg}`,
            })

            console.error(
              `[metadata-worker] Failed to sync metadata for domain ${dom.domainName}:`,
              domainErr
            )
          }
        }
      } catch (err: any) {
        result.success = false
        result.licensesFailed++

        const errorMsg = err instanceof Error ? err.message : String(err)
        result.errors.push({
          licenseId: license.id,
          error: errorMsg,
        })

        console.error(
          `[metadata-worker] Failed to process expired license ${license.id}:`,
          errorMsg
        )
      }
    }
    if (process.env.NODE_ENV === "development") {
      console.log(`[metadata-worker] Expired trial sync complete:`, {
        licensesExpired: result.licensesExpired,
        domainsUpdated: result.domainsUpdated,
        licensesFailed: result.licensesFailed,
      })
    }

    return result
  } catch (err: any) {
    console.error("[metadata-worker] Fatal error in expired trial sync:", err)
    result.success = false
    return result
  }
}

async function syncTrialReminders(): Promise<{
  remindersSent: number
  remindersSkipped: number
  errors: Array<{ email: string; error: string }>
}> {
  // console.log("[metadata-worker] Starting trial reminder check...")

  const now = new Date()
  const result = {
    remindersSent: 0,
    remindersSkipped: 0,
    errors: [] as Array<{ email: string; error: string }>,
  }

  try {
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

    if (trialingLicenses.length === 0) {
      if (process.env.NODE_ENV === "development") {
        console.log("[metadata-worker] No active trials to remind")
      }
      return result
    }

    // console.log(
    //   `[metadata-worker] Checking ${trialingLicenses.length} active trials for reminders...`
    // )

    for (const row of trialingLicenses) {
      const { license, user } = row

      try {
        if (!license.trialEndsAt) {
          result.remindersSkipped++
          continue
        }

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

        if (!reminderType) {
          result.remindersSkipped++
          continue
        }

        // Send reminder email
        await enqueueEmailJob({
          template: "trial-ending",
          to: user.email,
          props: {
            contactName: user.name || user.email.split("@")[0],
            trialEndsAt: license.trialEndsAt.toLocaleDateString(),
            daysRemaining: reminderType === "24-hour" ? "24 hours" : "3 days",
          },
        })

        // Update license to mark reminder as sent
        await db
          .update(licenses)
          .set({
            lastTrialReminderSent: reminderType,
            updatedAt: new Date(),
          })
          .where(eq(licenses.id, license.id))

        // Log audit trail
        await createAuditLog(
          null,
          "license.trial_reminder_sent",
          "license",
          license.id,
          {
            reminderType,
            trialEndsAt: license.trialEndsAt,
            hoursRemaining: Math.floor(hoursUntilExpiry),
          }
        )

        result.remindersSent++
        // console.log(
        //   `[metadata-worker] Sent ${reminderType} reminder to ${user.email}`
        // )
      } catch (err: any) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        result.errors.push({
          email: user.email,
          error: errorMsg,
        })

        console.error(
          `[metadata-worker] Failed to send trial reminder to ${user.email}:`,
          errorMsg
        )
      }
    }
    if (process.env.NODE_ENV === "development") {
      console.log(`[metadata-worker] Trial reminder sync complete:`, {
        remindersSent: result.remindersSent,
        remindersSkipped: result.remindersSkipped,
        errors: result.errors.length,
      })
    }
    return result
  } catch (err: any) {
    console.error("[metadata-worker] Fatal error in trial reminders:", err)
    return result
  }
}

export async function registerMetadataWorker(boss: PgBoss): Promise<void> {
  // Create and register the metadata export queue
  await boss.createQueue(QUEUE_NAME)
  await boss.work<MetadataJobData>(
    QUEUE_NAME,
    { batchSize: 1 },
    async (jobs: Job<MetadataJobData>[]) => {
      for (const job of jobs) {
        const { domainName, userId, action } = job.data

        try {
          // console.log(
          //   `[metadata-worker] Processing ${action} for domain ${domainName}`
          // )

          if (action === "upsert") {
            await upsertMetadata(domainName, userId)
          } else if (action === "delete") {
            await deleteMetadata(domainName)
          } else {
            throw new Error(`Unknown action: ${action}`)
          }

          // console.log(
          //   `[metadata-worker] ✓ Completed ${action} for domain ${domainName}`
          // )
        } catch (error: any) {
          const errorMsg =
            error instanceof Error ? error.message : String(error)
          console.error(
            `[metadata-worker] ✗ Failed job ${job.id} (${action} ${domainName}): ${errorMsg}`
          )

          // Re-throw to trigger pg-boss retry mechanism
          throw error
        }
      }
    }
  )

  // Create and register the trial sync cron queue
  await boss.createQueue(CRON_TRIAL_SYNC)
  await boss.work(CRON_TRIAL_SYNC, async () => {
    const startTime = Date.now()
    // console.log("[metadata-worker] ========================================")
    // console.log("[metadata-worker] Starting Trial Sync Cron Job")
    // console.log("[metadata-worker] ========================================")

    try {
      // Process 2: Sync R2 metadata for expired trials
      const expiredResult = await syncExpiredTrials()

      // Process 3: Send trial ending reminders
      const reminderResult = await syncTrialReminders()

      const duration = Date.now() - startTime
      if (process.env.NODE_ENV === "development") {
        console.log(
          "[metadata-worker] ========================================"
        )
        console.log("[metadata-worker] Trial Sync Cron Job Complete")
        console.log(
          "[metadata-worker] ----------------------------------------"
        )
        console.log("Expired Trial Sync Summary:", {
          licensesExpired: expiredResult.licensesExpired,
          domainsUpdated: expiredResult.domainsUpdated,
          licensesFailed: expiredResult.licensesFailed,
        })
        console.log("Trial Reminder Summary:", {
          remindersSent: reminderResult.remindersSent,
          remindersSkipped: reminderResult.remindersSkipped,
          errors: reminderResult.errors.length,
        })
        console.log(`Duration: ${duration}ms`)
        console.log(
          "[metadata-worker] ========================================"
        )
      }
      // Log overall result to audit trail
      if (
        expiredResult.success
      ) {
        await createAuditLog(
          null,
          "metadata_worker.trial_sync_completed",
          "metadata_worker",
          "cron-job",
          {
            expiredMarked: expiredResult.licensesExpired,
            domainsUpdated: expiredResult.domainsUpdated,
            remindersSent: reminderResult.remindersSent,
            duration,
          }
        )
      } else {
        console.error("[metadata-worker] Cron job completed with errors")
        await createAuditLog(
          null,
          "metadata_worker.trial_sync_failed",
          "metadata_worker",
          "cron-job",
          {
            expiredErrors: expiredResult.errors,
            reminderErrors: reminderResult.errors,
          }
        )
      }
    } catch (err: any) {
      const duration = Date.now() - startTime
      console.error("[metadata-worker] Fatal error in cron job:", err)
      if (process.env.NODE_ENV === "development") {
        console.log(`Duration: ${duration}ms`)
      }

      await createAuditLog(
        null,
        "metadata_worker.trial_sync_fatal_error",
        "metadata_worker",
        "cron-job",
        {
          error: err instanceof Error ? err.message : String(err),
          duration,
        }
      ).catch((logErr) => {
        console.error("[metadata-worker] Failed to log fatal error:", logErr)
      })
    }
  })

  // Schedule the cron job to run every hour
  await boss.schedule(CRON_TRIAL_SYNC, CRON_INTERVAL)
  if (process.env.NODE_ENV === "development") {
    console.log(
      `[metadata-worker] ✓ Scheduled trial sync cron job: "${CRON_INTERVAL}"`
    )
  }
}
