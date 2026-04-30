import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import crypto from "node:crypto"
import { db } from "@/db"
import {
  users,
  payments,
  orders,
  licenses,
  domains,
  webhookEvents,
  plans,
} from "@/db/schema"
import { eq, and, isNull, sql } from "drizzle-orm"
import { normalizeDomain, validateDomain } from "@/lib/domains"
import { enqueueEmailJob, enqueueLicenseMetadataExportJob } from "@/lib/queue"
import { createAuditLog } from "@/lib/audit"
import { getPostHog } from "@/lib/posthog-server"

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!)
}

// Best-effort customer email extraction from a Stripe event for display in
// the admin webhooks list. Different event types carry the email in
// different fields; subscription events only carry a customer ID, so fall
// back to looking up the user we've previously linked to that customer.
async function extractCustomerEmail(
  event: Stripe.Event
): Promise<string | null> {
  const obj = event.data.object as Record<string, any>

  const direct =
    obj?.customer_details?.email ||
    obj?.customer_email ||
    obj?.receipt_email ||
    obj?.billing_details?.email ||
    null
  if (direct && typeof direct === "string") {
    return direct.toLowerCase().trim()
  }

  const customerId =
    typeof obj?.customer === "string" ? obj.customer : obj?.customer?.id || null
  if (customerId) {
    try {
      const [user] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.stripeCustomerId, customerId))
        .limit(1)
      if (user?.email) return user.email.toLowerCase().trim()
    } catch {
      // Swallow — email is purely informational, never block processing.
    }
  }

  return null
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 })
  }

  const stripe = getStripe()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature"
    return NextResponse.json({ error: message }, { status: 400 })
  }
  if (process.env.NODE_ENV === "development") {
    console.log(`${Date.now()} event webhook Main=>`, JSON.stringify(event))
  }

  // Defense-in-depth event-age check. Stripe SDK already enforces a ~5min
  // signature timestamp tolerance in `constructEvent`, but a misconfigured
  // tolerance, leaked signing key, or replayed event still inside that
  // window could deliver stale events. Reject anything older than 10min.
  const eventAgeSeconds = Math.floor(Date.now() / 1000) - event.created
  if (eventAgeSeconds > 600) {
    console.warn(
      `[stripe-webhook] Rejecting stale event ${event.id} (${event.type}), age=${eventAgeSeconds}s`
    )
    return NextResponse.json({ error: "Event too old" }, { status: 400 })
  }

  const customerEmail = await extractCustomerEmail(event)

  // Atomic claim via the unique `eventId` constraint. Two concurrent
  // deliveries of the same event can't both insert; the loser falls
  // through to the existence check below. Without ON CONFLICT, both
  // racers pass the prior SELECT and both proceed to processing.
  const [claimed] = await db
    .insert(webhookEvents)
    .values({
      eventId: event.id,
      type: event.type,
      customerEmail,
      processed: false,
    })
    .onConflictDoNothing({ target: webhookEvents.eventId })
    .returning({ id: webhookEvents.id })

  let webhookRecordId: string
  if (claimed) {
    webhookRecordId = claimed.id
  } else {
    // Lost the race or this is a retry of a previously-attempted event.
    // If the prior attempt succeeded, treat as duplicate. If it failed
    // (processed=false, processingError set), allow this attempt to retry.
    const [existing] = await db
      .select({
        id: webhookEvents.id,
        processed: webhookEvents.processed,
      })
      .from(webhookEvents)
      .where(eq(webhookEvents.eventId, event.id))
      .limit(1)

    if (!existing) {
      return NextResponse.json(
        { error: "Webhook record missing" },
        { status: 500 }
      )
    }
    if (existing.processed) {
      return NextResponse.json({ received: true, duplicate: true })
    }
    webhookRecordId = existing.id
  }
  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session
        )
        break
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent
        )
        break
      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(
          event.data.object as Stripe.PaymentIntent
        )
        break
      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        )
        break
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        )
        break
      case "customer.subscription.trial_will_end":
        await handleSubscriptionTrialWillEnd(
          event.data.object as Stripe.Subscription
        )
        break
      case "customer.subscription.created":
        await handleSubscriptionCreated(
          event.data.object as Stripe.Subscription
        )
        break
      case "charge.refunded":
        await handleChargeRefunded(event.data.object as Stripe.Charge)
        break
      default:
        break
    }

    await db
      .update(webhookEvents)
      .set({ processed: true, processedAt: new Date() })
      .where(eq(webhookEvents.id, webhookRecordId))
  } catch (err) {
    // Drizzle wraps the underlying pg error; surface as much as we can so
    // operators can diagnose schema/connection issues from the logs.
    const cause = (err as any)?.cause
    const pgCode = cause?.code
    const pgDetail = cause?.detail || cause?.message
    const baseMessage =
      err instanceof Error ? err.message : "Unknown processing error"
    const errorMessage = pgDetail
      ? `${baseMessage} | pg ${pgCode || ""}: ${pgDetail}`
      : baseMessage

    await db
      .update(webhookEvents)
      .set({ processed: false, processingError: errorMessage })
      .where(eq(webhookEvents.id, webhookRecordId))

    console.error(
      `Webhook processing error for ${event.id} (${event.type}):`,
      errorMessage,
      err instanceof Error ? err.stack : undefined
    )
    return NextResponse.json({ error: "Processing failed" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function fulfillTrialSetup({
  email,
  name,
  planId,
  licenseQuantity,
  stripeSessionId,
  stripeSetupIntentId,
  stripeCustomerId,
  isYearly,
  finalAmount,
  promoCode,
}: {
  email: string
  name?: string
  planId: string
  licenseQuantity: number
  stripeSessionId: string
  stripeSetupIntentId: string
  stripeCustomerId: string
  isYearly?: boolean
  finalAmount?: number
  promoCode?: string
}) {
  const normalizedEmail = email.toLowerCase().trim()

  // Track domains that need R2 metadata refresh once the transaction
  // commits. A user upgrading from the free plan into a trial-paid plan
  // already has domains attached to their existing license — the upsert
  // below flips the license's planId, but R2 still holds the old (free)
  // plan_name JSON until we enqueue an upsert. Without this, the R2 file
  // lags behind the DB and external consumers never see the new plan.
  const exportJobsToEnqueue: {
    domainName: string
    userId: string
    action: string
  }[] = []

  await db.transaction(async (tx) => {
    // Find or create user
    let [user] = await tx
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1)

    if (!user) {
      ;[user] = await tx
        .insert(users)
        .values({
          id: crypto.randomUUID(),
          name: name || normalizedEmail.split("@")[0],
          email: normalizedEmail,
          emailVerified: true,
          stripeCustomerId: stripeCustomerId,
          hasUsedTrial: true,
        })
        .returning()
    } else {
      // Lock the per-user trial gate (and backfill stripeCustomerId if
      // missing) so a future cancel + re-signup can't re-claim a trial.
      await tx
        .update(users)
        .set({
          hasUsedTrial: true,
          ...(user.stripeCustomerId ? {} : { stripeCustomerId }),
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id))
    }

    // Get plan info to know trial days and slots
    const [plan] = await tx
      .select()
      .from(plans)
      .where(eq(plans.id, planId))
      .limit(1)

    if (!plan) throw new Error(`Plan ${planId} not found`)

    // Create a "pending" payment record for the future charge
    const [payment] = await tx
      .insert(payments)
      .values({
        userId: user.id,
        stripeSessionId: stripeSessionId,
        stripeCustomerId: stripeCustomerId,
        stripeSetupIntentId: stripeSetupIntentId,
        stripeSubscriptionId: null,
        amount: finalAmount || plan.finalPrice, // Use custom amount if provided
        currency: plan.currency || "usd",
        planId: planId,
        appliedPromoCode: promoCode || null,
        status: "trialing",
      })
      .returning()

    // Create order marked as trialing
    const [order] = await tx
      .insert(orders)
      .values({
        userId: user.id,
        paymentId: payment.id,
        planId,
        licenseQuantity,
        contactName: name || user.name || normalizedEmail.split("@")[0],
        status: "fulfilled", // Fulfilled in terms of granting trial access
      })
      .returning()

    // Create license with trial period (Upsert to ensure 1 license per user)
    const [license] = await tx
      .insert(licenses)
      .values({
        userId: user.id,
        planId,
        totalSlots: plan.slots,
        status: "trialing",
        sourceOrderId: order.id,
        isTrial: true,
        isLifetime: plan.mode === "lifetime",
        billingCycle: isYearly ? "yearly" : (plan.mode as any),
        trialEndsAt: new Date(Date.now() + plan.trialDays * 86400000),
        nextRenewalDate: new Date(Date.now() + plan.trialDays * 86400000),
        stripeSetupIntentId: stripeSetupIntentId,
        stripeSubscriptionId: null,
      })
      .onConflictDoUpdate({
        target: licenses.userId,
        set: {
          planId,
          totalSlots: plan.slots,
          status: "trialing",
          sourceOrderId: order.id,
          isTrial: true,
          isLifetime: plan.mode === "lifetime",
          billingCycle: isYearly ? "yearly" : (plan.mode as any),
          trialEndsAt: new Date(Date.now() + plan.trialDays * 86400000),
          nextRenewalDate: new Date(Date.now() + plan.trialDays * 86400000),
          stripeSetupIntentId: stripeSetupIntentId,
          stripeSubscriptionId: null,
          updatedAt: new Date(),
        },
      })
      .returning()

    // Refresh R2 metadata for any domains the user already had attached
    // (typical case: a free-plan user trialing into Pro). The license id
    // is preserved by the upsert, so those rows still link here — they
    // just need a fresh JSON snapshot reflecting the new plan_name and
    // is_trial / trial_ends_at fields.
    if (license) {
      const existingDomains = await tx
        .select({ domainName: domains.domainName })
        .from(domains)
        .where(
          and(eq(domains.licenseId, license.id), isNull(domains.deletedAt))
        )

      for (const d of existingDomains) {
        exportJobsToEnqueue.push({
          domainName: d.domainName,
          userId: user.id,
          action: "upsert",
        })
      }
    }

    await createAuditLog(
      user.id,
      "trial.setup_completed",
      "license",
      order.id,
      {
        userId: user.id,
        planId,
        setupIntentId: stripeSetupIntentId,
      },
      tx
    )
  })

  // Enqueue R2 jobs after the transaction commits — the worker reads
  // license/plan rows directly and would race the in-flight tx otherwise.
  for (const job of exportJobsToEnqueue) {
    await enqueueLicenseMetadataExportJob(job).catch((err) => {
      console.error(
        `[webhook] Failed to enqueue export for ${job.domainName} (trial setup):`,
        err
      )
    })
  }
}
async function fulfillOrder({
  email,
  name,
  planId,
  licenseId,
  licenseQuantity,
  domainsJson,
  stripeSessionId,
  stripePaymentIntentId,
  stripeCustomerId,
  amount,
  currency,
  isTrial,
  trialEndsAt,
  stripeSubscriptionId,
  stripeInvoiceId,
  stripeInvoiceUrl,
  stripePaymentMethodId,
  nextRenewalDate,
  promoCode,
}: {
  email: string
  name?: string
  planId: string
  licenseId?: string
  licenseQuantity: number
  domainsJson?: string
  stripeSessionId: string
  stripePaymentIntentId?: string | null
  stripeCustomerId?: string | null
  amount: number
  currency: string
  isTrial?: boolean
  trialEndsAt?: Date | null
  stripeSubscriptionId?: string | null
  stripeInvoiceId?: string | null
  stripeInvoiceUrl?: string | null
  stripePaymentMethodId?: string | null
  nextRenewalDate?: Date | null
  promoCode?: string
}) {
  const normalizedEmail = email.toLowerCase().trim()
  let submittedDomains: string[] = []
  try {
    if (domainsJson) submittedDomains = JSON.parse(domainsJson)
  } catch {
    submittedDomains = []
  }

  let exportJobsToEnqueue: {
    domainName: string
    userId: string
    action: string
  }[] = []
  let emailJobToEnqueue: any = null

  let user: any = null

  await db.transaction(async (tx) => {
    // 0. Find or create user
    const [existingUser] = await tx
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1)

    if (existingUser) {
      user = existingUser
    }

    if (!user) {
      const [newUser] = await tx
        .insert(users)
        .values({
          id: crypto.randomUUID(),
          name: name || normalizedEmail.split("@")[0],
          email: normalizedEmail,
          emailVerified: true,
          stripeCustomerId: stripeCustomerId || null,
          // Lock the per-user trial gate at user-creation time when this
          // fulfillment is for a trial. The earlier branch in
          // handleCheckoutCompleted only updates EXISTING users; without
          // setting it here, a fresh email going through the webhook
          // trial path would leave hasUsedTrial=false and the same email
          // could re-trial.
          hasUsedTrial: !!isTrial,
        })
        .returning()
      user = newUser
    } else if (stripeCustomerId && !user.stripeCustomerId) {
      await tx
        .update(users)
        .set({ stripeCustomerId })
        .where(eq(users.id, user.id))
    }

    const userRecord = user

    // 1. Create or Update Payment record using ON CONFLICT for atomicity
    const [payment] = await tx
      .insert(payments)
      .values({
        userId: userRecord.id,
        stripeSessionId: stripeSessionId,
        stripePaymentIntentId: stripePaymentIntentId || null,
        stripeCustomerId: stripeCustomerId || null,
        stripeSubscriptionId: stripeSubscriptionId || null,
        stripeInvoiceId: stripeInvoiceId || null,
        stripeInvoiceUrl: stripeInvoiceUrl || null,
        amount: amount,
        currency: currency,
        planId: planId,
        appliedPromoCode: promoCode || null,
        status: isTrial ? "pending" : "paid",
      })
      .onConflictDoUpdate({
        target: payments.stripeSessionId,
        set: {
          status: isTrial ? "pending" : "paid",
          stripePaymentIntentId: stripePaymentIntentId || null,
          stripeCustomerId: stripeCustomerId || null,
          stripeSubscriptionId: stripeSubscriptionId || null,
          stripeInvoiceId: stripeInvoiceId || null,
          stripeInvoiceUrl: stripeInvoiceUrl || null,
          planId: planId,
          appliedPromoCode: promoCode || null,
          updatedAt: new Date(),
        },
      })
      .returning()

    const paymentId = payment.id

    // 2. Check if an order already exists for this payment (Idempotency)
    const [existingOrder] = await tx
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.paymentId, paymentId))
      .limit(1)

    if (existingOrder) {
      return // Already fulfilled
    }

    // 3. Get plan info
    const [plan] = await tx
      .select()
      .from(plans)
      .where(eq(plans.id, planId))
      .limit(1)

    if (!plan) {
      throw new Error(`Plan ${planId} not found`)
    }

    // Defense against accidental clobber of an existing lifetime license.
    // The license upsert below is keyed on `userId` and replaces every
    // field — without this guard, any subsequent checkout (legit upgrade
    // attempt, reused-email signup, replayed event) would silently
    // overwrite the user's lifetime grant. Skip fulfillment unless the
    // new order is itself lifetime; lifetime → lifetime is a no-op since
    // the row is already correct.
    const [preexisting] = await tx
      .select({
        id: licenses.id,
        isLifetime: licenses.isLifetime,
        planId: licenses.planId,
      })
      .from(licenses)
      .where(eq(licenses.userId, userRecord.id))
      .limit(1)

    if (preexisting?.isLifetime && plan.mode !== "lifetime") {
      console.warn(
        `[webhook] Skipping fulfillment that would overwrite lifetime license ${preexisting.id} for user ${userRecord.id} (incoming plan ${planId}, mode ${plan.mode}).`
      )
      await createAuditLog(
        userRecord.id,
        "webhook.fulfillment_blocked_lifetime",
        "license",
        preexisting.id,
        {
          userId: userRecord.id,
          incomingPlanId: planId,
          incomingMode: plan.mode,
          paymentId,
        },
        tx
      )
      return
    }

    // Determine billing cycle and lifetime status
    const isLifetime = plan.mode === "lifetime"
    let billingCycle: "monthly" | "yearly" | "lifetime" = "monthly"
    if (isLifetime) {
      billingCycle = "lifetime"
    } else if (amount > 0) {
      const monthlyPrice = plan.finalPrice
      const discount = (plan.yearlyDiscountPercentage || 0) / 100
      const yearlyExpected = monthlyPrice * 12 * (1 - discount)
      if (Math.abs(amount - yearlyExpected) < 100) {
        billingCycle = "yearly"
      }
    }

    // 4. Create order record first to get sourceOrderId
    const [order] = await tx
      .insert(orders)
      .values({
        userId: userRecord.id,
        paymentId: paymentId,
        planId,
        licenseQuantity,
        contactName: name || userRecord.name || normalizedEmail.split("@")[0],
        status: "fulfilled",
      })
      .returning()

    const sourceOrderId = order.id

    // 5. Create or Update License (Atomic Upsert for 1 license per user)
    const [license] = await tx
      .insert(licenses)
      .values({
        userId: userRecord.id,
        planId,
        totalSlots: plan.slots * licenseQuantity,
        status: "active",
        sourceOrderId: sourceOrderId,
        isTrial: isTrial || false,
        isLifetime: isLifetime || false,
        billingCycle: billingCycle,
        trialEndsAt: trialEndsAt || null,
        nextRenewalDate:
          nextRenewalDate ||
          (billingCycle === "lifetime"
            ? null
            : new Date(
                Date.now() + (billingCycle === "yearly" ? 365 : 30) * 86400000
              )),
        stripeSubscriptionId: stripeSubscriptionId || null,
        stripeSetupIntentId: stripePaymentMethodId || null, // Tracking PM ID here too
      })
      .onConflictDoUpdate({
        target: licenses.userId,
        set: {
          planId,
          totalSlots: plan.slots * licenseQuantity,
          status: "active",
          sourceOrderId: sourceOrderId,
          isTrial: isTrial || false,
          isLifetime: isLifetime || false,
          billingCycle: billingCycle,
          trialEndsAt: trialEndsAt || null,
          nextRenewalDate:
            nextRenewalDate ||
            (billingCycle === "lifetime"
              ? null
              : new Date(
                  Date.now() + (billingCycle === "yearly" ? 365 : 30) * 86400000
                )),
          stripeSubscriptionId: stripeSubscriptionId || null,
          stripeSetupIntentId: stripePaymentMethodId || null,
          updatedAt: new Date(),
        },
      })
      .returning()

    const finalLicenseId = license.id

    // Fetch existing domains after update to enqueue their metadata export
    const existingDomains = await tx
      .select({ domainName: domains.domainName })
      .from(domains)
      .where(
        and(eq(domains.licenseId, finalLicenseId), isNull(domains.deletedAt))
      )

    for (const d of existingDomains) {
      exportJobsToEnqueue.push({
        domainName: d.domainName,
        userId: userRecord.id,
        action: "upsert",
      })
    }

    // Handle Domain Attachments from metadata
    for (const domainName of submittedDomains) {
      if (typeof domainName !== "string") continue
      const normalized = normalizeDomain(domainName)
      if (!normalized) continue
      // Reject malformed/non-Shopify input from checkout metadata. Without
      // this, anything passing the loose `z.array(z.string())` check at
      // the API layer would land in the `domains` table and propagate
      // into R2 metadata exports.
      const validation = validateDomain(normalized)
      if (!validation.valid) {
        console.warn(
          `[webhook] Skipping invalid domain in metadata: ${domainName} (${validation.error})`
        )
        continue
      }

      // Check if domain already exists for this license
      const [existingDomain] = await tx
        .select()
        .from(domains)
        .where(
          and(
            eq(domains.domainName, normalized),
            eq(domains.licenseId, finalLicenseId),
            isNull(domains.deletedAt)
          )
        )
        .limit(1)

      if (!existingDomain) {
        await tx.insert(domains).values({
          userId: userRecord.id,
          licenseId: finalLicenseId,
          domainName: normalized,
        })

        exportJobsToEnqueue.push({
          domainName: normalized,
          userId: userRecord.id,
          action: "upsert",
        })
      }
    }

    // Audit log — record per-user activity for proper tracking
    await createAuditLog(
      userRecord.id,
      "webhook.fulfillment_completed",
      "license",
      finalLicenseId,
      {
        userId: userRecord.id,
        paymentId: paymentId,
        licenseId: finalLicenseId,
        planId,
        billingCycle,
        isTrial: !!isTrial,
        isLifetime,
      },
      tx
    )

    emailJobToEnqueue = {
      template: licenseId ? "conversion-confirmation" : "order-confirmation",
      to: normalizedEmail,
      props: {
        contactName: name || userRecord.name || normalizedEmail.split("@")[0],
        email: normalizedEmail,
        planName: plan.name,
        licenseQuantity,
        totalAmount: amount,
        currency: currency,
        domains: submittedDomains.map(normalizeDomain),
      },
    }
  })

  // Enqueue jobs after transaction successfully commits
  for (const job of exportJobsToEnqueue) {
    await enqueueLicenseMetadataExportJob(job).catch((err) => {
      console.error(
        `[webhook] Failed to enqueue export for ${job.domainName}:`,
        err
      )
    })
  }

  if (emailJobToEnqueue) {
    await enqueueEmailJob(emailJobToEnqueue).catch((err) => {
      console.error(`[webhook] Failed to enqueue email job:`, err)
    })
  }

  // 3. PostHog Tracking (Server-side)
  const posthog = getPostHog()
  if (posthog) {
    posthog.capture({
      distinctId: normalizedEmail,
      event: "purchase_success",
      properties: {
        $set: {
          email: normalizedEmail,
          name: name || user?.name,
        },
        amount: amount / 100, // cents to dollars
        currency,
        planId,
        licenseQuantity,
        stripeSessionId,
      },
    })
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const metadata = session.metadata || {}
  const mode = session.mode

  // console.log(
  //   `[webhook] Processing checkout.session.completed. Mode: ${mode}, ID: ${session.id}`
  // )
  // console.log(`[webhook] Metadata: ${JSON.stringify(metadata)}`)

  const {
    plan_id: planId,
    license_quantity: licenseQuantityStr,
    contact_name: contactName,
    domains: domainsJson,
    promo_code: promoCodeFromMetadata,
  } = metadata

  // Native Stripe Promotion Code extraction
  let promoCode = promoCodeFromMetadata as string
  if (!promoCode && session.total_details?.breakdown?.discounts) {
    const discount = session.total_details.breakdown.discounts.find(
      (d) => (d as any).discount?.promotion_code
    )
    if (discount) {
      const d = (discount as any).discount
      promoCode = d.promotion_code?.code || d.coupon?.name || d.coupon?.id
    }
  }

  const customerEmail =
    session.customer_details?.email || session.customer_email
  if (!customerEmail) {
    throw new Error("No customer email found in session")
  }

  // Handle Trial Setup Flow (Setup Mode)
  if (mode === "setup" || metadata.type === "trial_setup") {
    let finalPlanId = planId
    let finalLicenseQuantity = parseInt(licenseQuantityStr || "1", 10)

    // Robustness: If metadata is missing during a setup mode session,
    // we attempt to find the first active plan with trial enabled as a fallback.
    if (!finalPlanId) {
      console.warn(
        `[webhook] Missing planId in setup mode session ${session.id}. Attempting fallback...`
      )
      const [defaultPlan] = await db
        .select({ id: plans.id })
        .from(plans)
        .where(eq(plans.isActive, true))
        .limit(1)

      if (defaultPlan) {
        finalPlanId = defaultPlan.id
        // console.log(`[webhook] Fallback plan found: ${finalPlanId}`)
      } else {
        throw new Error(
          `[webhook] Critical: Setup mode detected but no planId found and no active plan available for fallback.`
        )
      }
    }

    const stripeSetupIntentId =
      typeof session.setup_intent === "string"
        ? session.setup_intent
        : session.setup_intent?.id || ""

    await fulfillTrialSetup({
      email: customerEmail,
      name: contactName || session.customer_details?.name || undefined,
      planId: finalPlanId,
      licenseQuantity: finalLicenseQuantity,
      stripeSessionId: session.id,
      stripeSetupIntentId,
      stripeCustomerId:
        (typeof session.customer === "string"
          ? session.customer
          : session.customer?.id) || "",
      isYearly: metadata.is_yearly === "true",
      finalAmount: metadata.final_amount
        ? parseInt(metadata.final_amount, 10)
        : undefined,
      promoCode: promoCode as string,
    })
    return
  }

  // Payment Mode Fulfillment
  if (!planId || !licenseQuantityStr) {
    throw new Error("Missing required plan_id or license_quantity in metadata")
  }

  const isTrial = metadata.is_trial === "true"

  // Security Hardening: Fetch plan early and verify it
  const [plan] = await db
    .select()
    .from(plans)
    .where(and(eq(plans.id, planId as string), eq(plans.isActive, true)))
    .limit(1)

  if (!plan) {
    throw new Error(
      `[webhook] Security Alert: Plan ${planId} not found or inactive. Potential tampering detected for session ${session.id}.`
    )
  }

  // Amount Verification: Ensure they paid what was expected (considering promo codes)
  // We allow amount_total to be less than finalPrice if promotion codes are allowed.
  // For yearly plans we use the yearly base (monthly × 12) as the cap.
  const isYearlyMeta = metadata.is_yearly === "true"
  const baseMonthly = plan.mode === "yearly" ? plan.finalPrice : plan.finalPrice
  const maxExpected = isYearlyMeta ? baseMonthly * 12 : plan.finalPrice

  if (session.amount_total !== null && session.amount_total > maxExpected) {
    throw new Error(
      `[webhook] Security Alert: Amount exceeds plan price for session ${session.id}. ` +
        `Max expected ${maxExpected}, received ${session.amount_total}. fulfillment aborted.`
    )
  }

  // Floor check: a paid (non-trial) checkout that comes through with $0
  // is suspicious unless we explicitly attached a 100%-off promo (which
  // would arrive on the session as a discount we recognize). Since we
  // can't fully reason about every coupon configuration, we require at
  // minimum that one of the following is true for amount_total === 0:
  //   - the metadata says this is a trial (trial subscriptions legitimately
  //     have $0 today, charged later), OR
  //   - the plan itself is free (handled in the API, not here, but defensive), OR
  //   - the session carries an explicit discount line.
  if (
    !isTrial &&
    plan.mode !== "free" &&
    session.amount_total === 0 &&
    !(session.total_details?.breakdown?.discounts?.length ?? 0)
  ) {
    throw new Error(
      `[webhook] Security Alert: Paid plan ${planId} fulfilled at $0 with no recognized discount for session ${session.id}.`
    )
  }

  const licenseQuantity = parseInt(licenseQuantityStr, 10)

  // Expand session to get invoice info
  const stripe = getStripe()
  const expandedSession = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ["invoice", "subscription", "payment_intent", "setup_intent"],
  })

  const stripePaymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id || null

  // For trial subscriptions, prefer Stripe's authoritative `trial_end`
  // over `Date.now() + trialDays`. This avoids server-clock drift and
  // matches what Stripe will use to fire the first invoice.
  const subscriptionObj =
    expandedSession.subscription &&
    typeof expandedSession.subscription !== "string"
      ? (expandedSession.subscription as Stripe.Subscription)
      : null

  const stripeTrialEnd = subscriptionObj?.trial_end
    ? new Date(subscriptionObj.trial_end * 1000)
    : null

  // Lock the per-user trial gate so cancel + re-signup can't re-trial.
  if (isTrial) {
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, customerEmail.toLowerCase().trim()))
      .limit(1)
    if (existingUser) {
      await db
        .update(users)
        .set({ hasUsedTrial: true, updatedAt: new Date() })
        .where(eq(users.id, existingUser.id))
    }
  }

  await fulfillOrder({
    email: customerEmail,
    name: contactName || session.customer_details?.name || undefined,
    planId: planId as string,
    licenseQuantity,
    domainsJson,
    stripeSessionId: session.id,
    stripePaymentIntentId,
    stripeCustomerId:
      (typeof session.customer === "string"
        ? session.customer
        : session.customer?.id) || null,
    amount: session.amount_total || 0,
    currency: session.currency || "usd",
    isTrial: isTrial,
    trialEndsAt:
      stripeTrialEnd ||
      (isTrial ? new Date(Date.now() + plan.trialDays * 86400000) : undefined),
    nextRenewalDate: subscriptionObj
      ? stripeTrialEnd ||
        new Date((subscriptionObj as any).current_period_end * 1000)
      : null,
    stripeSubscriptionId:
      typeof expandedSession.subscription === "string"
        ? expandedSession.subscription
        : expandedSession.subscription?.id || null,
    stripeInvoiceId:
      typeof expandedSession.invoice === "string"
        ? expandedSession.invoice
        : (expandedSession.invoice as Stripe.Invoice)?.id || null,
    stripeInvoiceUrl:
      typeof expandedSession.invoice === "string"
        ? null
        : (expandedSession.invoice as Stripe.Invoice)?.hosted_invoice_url ||
          null,
    stripePaymentMethodId:
      expandedSession.setup_intent &&
      typeof expandedSession.setup_intent !== "string"
        ? ((expandedSession.setup_intent as Stripe.SetupIntent)
            .payment_method as string)
        : expandedSession.payment_intent &&
            typeof expandedSession.payment_intent !== "string"
          ? ((expandedSession.payment_intent as Stripe.PaymentIntent)
              .payment_method as string)
          : null,
    promoCode: promoCode as string,
  })
}

async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent
) {
  const metadata = paymentIntent.metadata || {}
  const {
    plan_id: planId,
    license_quantity: licenseQuantityStr,
    license_id: licenseId,
    contact_name: contactName,
    domains: domainsJson,
  } = metadata

  const piAny = paymentIntent as any
  const associatedInvoiceId =
    typeof piAny.invoice === "string"
      ? piAny.invoice
      : piAny.invoice?.id || piAny.payment_details?.order_reference

  // Subscription-driven PIs are paid via an invoice — invoice.payment_succeeded
  // is the authoritative source of truth for those. Just sync payment status here
  // and exit to avoid duplicate fulfillment + spurious "no email" warnings.
  if (
    associatedInvoiceId &&
    typeof associatedInvoiceId === "string" &&
    associatedInvoiceId.startsWith("in_") &&
    metadata.conversion !== "trial_to_lifetime"
  ) {
    await db
      .update(payments)
      .set({ status: "paid", updatedAt: new Date() })
      .where(eq(payments.stripePaymentIntentId, paymentIntent.id))
    return
  }

  // Only attempt fulfillment if we have the necessary metadata
  // If it has a checkout session ID, let checkout.session.completed handle fulfillment to avoid duplicates
  let finalPlanId = planId
  let finalLicenseQuantityStr = licenseQuantityStr
  let finalEmail = metadata.email || paymentIntent.receipt_email || ""
  let finalContactName = contactName
  let finalDomainsJson = domainsJson
  let finalSubscriptionId: string | null = null

  const orderRef = piAny.payment_details?.order_reference

  if (!finalPlanId && orderRef && orderRef.startsWith("in_")) {
    // If metadata is missing but this is an invoice payment, fetch the invoice to get metadata
    try {
      const stripe = getStripe()
      const invoice = await stripe.invoices.retrieve(orderRef)
      const invAny = invoice as any

      // Extract metadata from invoice
      let invMetadata = invoice.metadata || {}
      if (!invMetadata.plan_id && invoice.lines?.data?.length > 0) {
        invMetadata = { ...invMetadata, ...invoice.lines.data[0].metadata }
      }
      if (!invMetadata.plan_id && invAny.subscription_details?.metadata) {
        invMetadata = {
          ...invMetadata,
          ...invAny.subscription_details.metadata,
        }
      }
      if (
        !invMetadata.plan_id &&
        invAny.parent?.subscription_details?.metadata
      ) {
        invMetadata = {
          ...invMetadata,
          ...invAny.parent.subscription_details.metadata,
        }
      }

      finalPlanId = invMetadata.plan_id
      finalLicenseQuantityStr = invMetadata.license_quantity
      finalEmail = invMetadata.email || invoice.customer_email || finalEmail
      finalContactName = invMetadata.contact_name || finalContactName
      finalDomainsJson = invMetadata.domains || finalDomainsJson
      finalSubscriptionId =
        invAny.subscription ||
        invAny.subscription_details?.subscription ||
        invAny.parent?.subscription_details?.subscription ||
        null
    } catch (err) {
      console.error(
        `[webhook] Failed to retrieve invoice ${orderRef} for PI ${paymentIntent.id}:`,
        err
      )
    }
  }

  if (metadata.session_id || !finalPlanId || !finalLicenseQuantityStr) {
    await db
      .update(payments)
      .set({ status: "paid", updatedAt: new Date() })
      .where(eq(payments.stripePaymentIntentId, paymentIntent.id))
    return
  }

  // Use the resolved finalEmail (may have been pulled from invoice metadata above)
  if (!finalEmail) {
    console.warn(
      `PaymentIntent ${paymentIntent.id} succeeded but no email found.`
    )
    return
  }

  // Handle Manual Invoicing for Trial-to-Lifetime Conversions
  const isConversion = metadata.conversion === "trial_to_lifetime"
  let stripeInvoiceId: string | null = null
  let stripeInvoiceUrl: string | null = null
  // console.log(`743 [${paymentIntent.id}] isConversion=>`, isConversion)
  if (isConversion && planId) {
    const stripe = getStripe()
    const customerId =
      typeof paymentIntent.customer === "string"
        ? paymentIntent.customer
        : paymentIntent.customer?.id

    if (customerId) {
      // 1. Get plan for description (and confirm price match if needed, though PI is already succeeded)
      const [plan] = await db
        .select()
        .from(plans)
        .where(eq(plans.id, planId as string))
        .limit(1)

      if (plan) {
        try {
          // 2. Create Invoice
          const invoice = await stripe.invoices.create({
            customer: customerId,
            currency: paymentIntent.currency,
            // description: `Conversion from Trial to Lifetime: ${plan.name}`,
            metadata: {
              payment_intent_id: paymentIntent.id,
              license_id: licenseId as string,
              plan_id: plan.id,
            },
          })
          // console.log(`772 [${paymentIntent.id}] invoice=>`, JSON.stringify(invoice, null, 2))
          // 3. Create Invoice Item (linked to the invoice)
          await stripe.invoiceItems.create({
            customer: customerId,
            invoice: invoice.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            description: plan.name,
          })
          // 4. Mark Invoice as Paid (using paid_out_of_band because PI already charged the money)
          // This avoids "double charging" the customer while still generating a valid paid receipt.
          const paidInvoice = await stripe.invoices.pay(invoice.id, {
            paid_out_of_band: true,
          })
          // console.log(`786 [${paymentIntent.id}] paidInvoice=>`, JSON.stringify(paidInvoice, null, 2))

          stripeInvoiceId = paidInvoice.id
          stripeInvoiceUrl = paidInvoice.hosted_invoice_url ?? null
        } catch (invoiceErr) {
          console.error(
            "[webhook] Failed to generate manual invoice for conversion:",
            invoiceErr
          )
          // We continue to fulfill the order even if invoice creation fails
        }
      }
    }
  }

  await fulfillOrder({
    email: finalEmail,
    name: finalContactName || undefined,
    planId: finalPlanId as string,
    licenseId: licenseId as string,
    licenseQuantity: parseInt(finalLicenseQuantityStr || "1", 10),
    domainsJson: finalDomainsJson,
    stripeSessionId:
      finalSubscriptionId || metadata.session_id || paymentIntent.id, // Use sub ID if available
    stripePaymentIntentId: paymentIntent.id,
    stripeCustomerId:
      (typeof paymentIntent.customer === "string"
        ? paymentIntent.customer
        : paymentIntent.customer?.id) || null,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    isTrial: false,
    trialEndsAt: null,
    stripeInvoiceId,
    stripeInvoiceUrl,
  })
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const metadata = paymentIntent.metadata || {}
  const licenseId = metadata.license_id as string

  // 1. Update the payment record status
  await db
    .update(payments)
    .set({
      status: "failed",
      updatedAt: new Date(),
    })
    .where(eq(payments.stripePaymentIntentId, paymentIntent.id))

  // 2. If this was a conversion attempt for an existing license, handle revocation
  if (licenseId) {
    await db.transaction(async (tx) => {
      // Mark license as past_due
      await tx
        .update(licenses)
        .set({
          status: "past_due",
          updatedAt: new Date(),
        })
        .where(eq(licenses.id, licenseId))

      // Get all active domains for this license to revoke them
      const activeDomains = await tx
        .select()
        .from(domains)
        .where(and(eq(domains.licenseId, licenseId), isNull(domains.deletedAt)))

      for (const dom of activeDomains) {
        await db
          .update(domains)
          .set({ deletedAt: new Date(), updatedAt: new Date() })
          .where(eq(domains.id, dom.id))

        await enqueueLicenseMetadataExportJob({
          domainName: dom.domainName,
          userId: dom.userId,
          action: "delete", // Revoke access immediately
        }).catch((err) => {
          console.error(
            `[webhook] Failed to enqueue revocation for ${dom.domainName}:`,
            err
          )
        })
      }
    })
  }

  let actorUserId: string | null = null
  if (licenseId) {
    const [lic] = await db
      .select({ userId: licenses.userId })
      .from(licenses)
      .where(eq(licenses.id, licenseId))
      .limit(1)
    actorUserId = lic?.userId || null
  }

  await createAuditLog(
    actorUserId,
    "payment.failed",
    "payment",
    paymentIntent.id,
    {
      userId: actorUserId,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      error:
        paymentIntent.last_payment_error?.message || "Unknown payment error",
      licenseId: licenseId || null,
    }
  )
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  let subscriptionId =
    typeof (invoice as any).subscription === "string"
      ? (invoice as any).subscription
      : (invoice as any).subscription?.id

  // Fallback for nested subscription details (seen in some API versions)
  const invAny = invoice as any
  if (!subscriptionId) {
    subscriptionId =
      invAny.subscription_details?.subscription ||
      invAny.parent?.subscription_details?.subscription
  }

  if (!subscriptionId) return

  // Find the license associated with this subscription
  const [license] = await db
    .select()
    .from(licenses)
    .where(eq(licenses.stripeSubscriptionId, subscriptionId))
    .limit(1)

  // Update original payment with invoice info if possible
  const pi =
    typeof (invoice as any).payment_intent === "string"
      ? (invoice as any).payment_intent
      : (invoice as any).payment_intent?.id

  if (pi || subscriptionId) {
    const conditions = []
    if (pi) conditions.push(eq(payments.stripePaymentIntentId, pi))
    if (subscriptionId)
      conditions.push(eq(payments.stripeSubscriptionId, subscriptionId))

    // Sync amount + currency from the invoice too. When a trial converts
    // (or after an in-trial upgrade), the original `trialing` payment row
    // may have a stale amount; this brings it in line with what was
    // actually charged.
    await db
      .update(payments)
      .set({
        status: invoice.status || "paid",
        amount: invoice.amount_paid || invoice.amount_due,
        currency: invoice.currency,
        stripeInvoiceId: invoice.id,
        stripeInvoiceUrl: invoice.hosted_invoice_url,
        updatedAt: new Date(),
      })
      .where(sql`${sql.join(conditions, sql` OR `)}`)
  }

  // Determine next renewal date from the invoice line items
  const nextRenewalDate =
    invoice.lines?.data?.length > 0
      ? new Date(invoice.lines.data[0].period.end * 1000)
      : null

  if (license) {
    // Determine whether the invoice that just paid is itself a trial
    // invoice (Stripe occasionally fires payment_succeeded for the $0
    // trial-period invoice). If so, the subscription is still trialing
    // and we must NOT clobber `status: "trialing"` with `"active"` —
    // that would make the public license JSON look post-trial while the
    // user is mid-trial.
    const trialEndUnix =
      (invoice as any).subscription_details?.trial_end ||
      (invoice as any).parent?.subscription_details?.trial_end ||
      null
    const invoiceTrialEnd = trialEndUnix ? new Date(trialEndUnix * 1000) : null
    const isStillTrialing =
      invoice.amount_paid === 0 &&
      !!invoiceTrialEnd &&
      invoiceTrialEnd.getTime() > Date.now()

    await db
      .update(licenses)
      .set({
        status: isStillTrialing ? "trialing" : "active",
        nextRenewalDate: nextRenewalDate,
        updatedAt: new Date(),
      })
      .where(eq(licenses.id, license.id))
  } else {
    // If no license exists, this might be a direct subscription creation from the API
    // We need to fulfill the order now
    const stripe = getStripe()

    // Retrieve the full invoice if the payment_intent is missing from the payload
    let finalPi = pi
    if (!finalPi) {
      try {
        const retrievedInvoice = (await stripe.invoices.retrieve(
          invoice.id
        )) as any
        finalPi =
          typeof retrievedInvoice.payment_intent === "string"
            ? retrievedInvoice.payment_intent
            : retrievedInvoice.payment_intent?.id
      } catch (err) {
        console.error(
          `[webhook] Failed to retrieve invoice ${invoice.id} for PI lookup:`,
          err
        )
      }
    }

    // Extract metadata from multiple possible locations
    let metadata = invoice.metadata || {}
    if (!metadata.plan_id && invoice.lines?.data?.length > 0) {
      metadata = { ...metadata, ...invoice.lines.data[0].metadata }
    }
    if (!metadata.plan_id && invAny.subscription_details?.metadata) {
      metadata = { ...metadata, ...invAny.subscription_details.metadata }
    }
    if (!metadata.plan_id && invAny.parent?.subscription_details?.metadata) {
      metadata = { ...metadata, ...invAny.parent.subscription_details.metadata }
    }

    // If still no plan_id, try fetching the subscription as a last resort
    let promoCode = metadata.promo_code as string
    if (!metadata.plan_id || !promoCode) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      if (!metadata.plan_id)
        metadata = { ...metadata, ...(subscription.metadata || {}) }
      if (!promoCode) {
        // Try to get promo code from subscription discounts
        const discount = subscription.discounts?.find(
          (d) => typeof d !== "string" && (d as any).promotion_code
        )
        if (discount) {
          const d = discount as any
          promoCode = d.promotion_code?.code || d.coupon?.name || d.coupon?.id
        }
      }
    }

    if (metadata.plan_id) {
      // Detect trial state from the invoice. If `subscription_details.
      // trial_end` is in the future, the subscription is currently
      // trialing and the license must reflect that — otherwise
      // fulfillOrder defaults `isTrial` to false and the public R2 JSON
      // ends up with `is_trial: false` / `trial_ends_at: null` for what
      // is really a live trial.
      const trialEndUnix =
        (invoice as any).subscription_details?.trial_end ||
        (invoice as any).parent?.subscription_details?.trial_end ||
        null
      const trialEndsAt = trialEndUnix ? new Date(trialEndUnix * 1000) : null
      const isTrialActive = !!(
        trialEndsAt && trialEndsAt.getTime() > Date.now()
      )

      await fulfillOrder({
        email:
          invoice.customer_email ||
          ((await stripe.customers.retrieve(invoice.customer as string)) as any)
            .email,
        name: metadata.contact_name || undefined,
        planId: metadata.plan_id,
        licenseQuantity: parseInt(metadata.license_quantity || "1", 10),
        domainsJson: metadata.domains,
        stripeSessionId: subscriptionId,
        stripeSubscriptionId: subscriptionId,
        stripePaymentIntentId: finalPi || null,
        stripeCustomerId:
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id || null,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        isTrial: isTrialActive,
        trialEndsAt,
        stripeInvoiceId: invoice.id,
        stripeInvoiceUrl: invoice.hosted_invoice_url,
        nextRenewalDate: nextRenewalDate,
        promoCode: promoCode,
      })
    }
    return
  }

  if (!license.isTrial) return

  // Trial payment succeeded — the trial just converted into a paid
  // subscription. Clear the trial flags. The earlier `if (license)` block
  // already updated status + nextRenewalDate from the invoice, and the
  // payments-row sync block above marked the row paid.
  if (invoice.amount_paid > 0) {
    await db
      .update(licenses)
      .set({
        isTrial: false,
        trialEndsAt: null,
        updatedAt: new Date(),
      })
      .where(eq(licenses.id, license.id))

    // Lifetime trial only: a lifetime product is one-time, so once the
    // trial pays out we cancel the recurring subscription. Monthly/yearly
    // trials must KEEP the subscription alive — cancelling it here was a
    // bug that left users with a ghost license and no future billing.
    if (license.billingCycle === "lifetime") {
      await db
        .update(licenses)
        .set({ isLifetime: true, updatedAt: new Date() })
        .where(eq(licenses.id, license.id))

      const stripe = getStripe()
      await stripe.subscriptions.cancel(subscriptionId).catch((err) => {
        console.error(
          `[webhook] Failed to cancel lifetime trial subscription ${subscriptionId}:`,
          err
        )
      })
    }
  }

  // Trigger R2 update for all domains on this license
  const licenseDomains = await db
    .select()
    .from(domains)
    .where(and(eq(domains.licenseId, license.id), isNull(domains.deletedAt)))

  for (const dom of licenseDomains) {
    await enqueueLicenseMetadataExportJob({
      domainName: dom.domainName,
      userId: license.userId,
      action: "upsert",
    })
  }

  await createAuditLog(
    license.userId,
    license.billingCycle === "lifetime"
      ? "license.trial_to_lifetime"
      : "license.trial_converted",
    "license",
    license.id,
    {
      userId: license.userId,
      subscriptionId,
      invoiceId: invoice.id,
      billingCycle: license.billingCycle,
    }
  )
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId =
    typeof (invoice as any).subscription === "string"
      ? (invoice as any).subscription
      : (invoice as any).subscription?.id
  if (!subscriptionId) return

  // Find the license associated with this subscription
  const [license] = await db
    .select()
    .from(licenses)
    .where(eq(licenses.stripeSubscriptionId, subscriptionId))
    .limit(1)

  if (!license) return

  // Update license status to past_due/expired
  await db
    .update(licenses)
    .set({
      status: "past_due",
      updatedAt: new Date(),
    })
    .where(eq(licenses.id, license.id))

  // Trigger R2 update for all domains on this license to deactivate them
  const licenseDomains = await db
    .select()
    .from(domains)
    .where(and(eq(domains.licenseId, license.id), isNull(domains.deletedAt)))

  for (const dom of licenseDomains) {
    await enqueueLicenseMetadataExportJob({
      domainName: dom.domainName,
      userId: license.userId,
      action: "upsert",
    })
  }

  await createAuditLog(
    license.userId,
    "license.payment_failed",
    "license",
    license.id,
    {
      userId: license.userId,
      subscriptionId,
      invoiceId: invoice.id,
      amountDue: invoice.amount_due,
    }
  )
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // Find the license
  const [license] = await db
    .select()
    .from(licenses)
    .where(eq(licenses.stripeSubscriptionId, subscription.id))
    .limit(1)

  if (!license) return

  // Protection: If it's a lifetime license, don't revoke access when subscription is deleted
  if (license.isLifetime) {
    // console.log(
    //   `[webhook] Skipping subscription deletion for Lifetime license: ${license.id}`
    // )
    return
  }

  // Check if it was during trial
  const isTrialCancellation =
    subscription.trial_end && subscription.status === "canceled"

  // Track domains that need an R2 refresh after the license flips to free.
  // The worker reads the current license/plan state, so a single `upsert`
  // job per domain is enough to overwrite the old pro-plan JSON. We collect
  // here, enqueue after commit (avoid racing the in-flight tx).
  const domainsToRefresh: { domainName: string }[] = []

  // Transition to Free Plan instead of revoking
  await db.transaction(async (tx) => {
    // 1. Find the Starter (Free) plan
    const [freePlan] = await tx
      .select()
      .from(plans)
      .where(eq(plans.mode, "free"))
      .limit(1)

    if (!freePlan) {
      // Fallback to revoke if no free plan exists
      await tx
        .update(licenses)
        .set({
          status: "revoked",
          revokedReason: isTrialCancellation
            ? "trial_canceled"
            : "subscription_deleted",
          updatedAt: new Date(),
        })
        .where(eq(licenses.id, license.id))
      return
    }

    // 2. Update license to Free Plan
    await tx
      .update(licenses)
      .set({
        planId: freePlan.id,
        status: "active",
        totalSlots: freePlan.slots,
        isTrial: false,
        isLifetime: false,
        billingCycle: "monthly",
        trialEndsAt: null,
        nextRenewalDate: null,
        stripeSubscriptionId: null,
        cancelAtPeriodEnd: false,
        updatedAt: new Date(),
      })
      .where(eq(licenses.id, license.id))

    // 3. Collect active domains for post-commit R2 refresh. Domains stay
    //    attached on downgrade; we just need the JSON to reflect the new
    //    free plan_name and cleared trial fields.
    const activeDomains = await tx
      .select({ domainName: domains.domainName })
      .from(domains)
      .where(and(eq(domains.licenseId, license.id), isNull(domains.deletedAt)))

    for (const dom of activeDomains) {
      domainsToRefresh.push({ domainName: dom.domainName })
    }
  })

  // Enqueue R2 upsert jobs after the transaction commits so the worker
  // reads the just-saved free-plan state. Without this, the cancel-to-free
  // auto-conversion at period end leaves stale pro-plan JSON in R2.
  for (const { domainName } of domainsToRefresh) {
    await enqueueLicenseMetadataExportJob({
      domainName,
      userId: license.userId,
      action: "upsert",
    }).catch((err) => {
      console.error(
        `[webhook] Failed to enqueue R2 refresh for ${domainName} (sub deleted):`,
        err
      )
    })
  }

  await createAuditLog(
    license.userId,
    isTrialCancellation
      ? "license.trial_converted_to_free"
      : "license.subscription_converted_to_free",
    "license",
    license.id,
    {
      userId: license.userId,
      previousPlanId: license.planId,
      subscriptionId: subscription.id,
      isTrial: !!subscription.trial_end,
    }
  )
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  // Find the license
  const [license] = await db
    .select()
    .from(licenses)
    .where(eq(licenses.stripeSubscriptionId, subscription.id))
    .limit(1)

  if (!license) return

  // Sync state if trial status changed
  const trialEndsAt = subscription.trial_end
    ? new Date(subscription.trial_end * 1000)
    : null

  // Protection: If it's a lifetime license, don't allow Stripe to set it to canceled/past_due
  const isCanceledOrFailed = ["canceled", "past_due", "unpaid"].includes(
    subscription.status
  )
  if (license.isLifetime && isCanceledOrFailed) {
    // console.log(
    //   `[webhook] Ignoring Stripe status ${subscription.status} for Lifetime license: ${license.id}`
    // )
    return
  }

  const newIsTrial = subscription.status === "trialing"
  const oldTrialEndIso = license.trialEndsAt
    ? license.trialEndsAt.toISOString()
    : null
  const newTrialEndIso = trialEndsAt ? trialEndsAt.toISOString() : null

  // Anything that affects the public license JSON should trigger an R2
  // refresh: trial flag flipping, trial-end date moving, or the
  // subscription transitioning to canceled/past_due. Without this, a
  // trialing→active conversion (or an in-trial date change) updates the
  // DB but the public `<domain>.json` keeps the old `is_trial` /
  // `trial_ends_at` values.
  const r2NeedsRefresh =
    license.isTrial !== newIsTrial ||
    oldTrialEndIso !== newTrialEndIso ||
    subscription.status === "canceled" ||
    subscription.status === "past_due"

  await db
    .update(licenses)
    .set({
      isTrial: newIsTrial,
      trialEndsAt: trialEndsAt,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      updatedAt: new Date(),
    })
    .where(eq(licenses.id, license.id))

  if (r2NeedsRefresh) {
    const licenseDomains = await db
      .select()
      .from(domains)
      .where(and(eq(domains.licenseId, license.id), isNull(domains.deletedAt)))

    for (const dom of licenseDomains) {
      await enqueueLicenseMetadataExportJob({
        domainName: dom.domainName,
        userId: license.userId,
        action: "upsert", // The worker re-reads the license and writes
        // either the fresh JSON (active/trialing) or deletes the file
        // (canceled/past_due/revoked).
      })
    }
  }

  await createAuditLog(
    license.userId,
    "license.subscription_updated",
    "license",
    license.id,
    {
      userId: license.userId,
      subscriptionStatus: subscription.status,
      isTrial: subscription.status === "trialing",
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    }
  )
}

async function handleSubscriptionTrialWillEnd(
  subscription: Stripe.Subscription
) {
  // Find the license associated with this subscription
  const [license] = await db
    .select()
    .from(licenses)
    .where(eq(licenses.stripeSubscriptionId, subscription.id))
    .limit(1)

  if (!license) return

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, license.userId))
    .limit(1)

  if (!user) return

  // Enqueue notification email job
  // await enqueueEmailJob({
  //   template: "trial-ending",
  //   to: user.email,
  //   props: {
  //     contactName: user.name || user.email.split("@")[0],
  //     trialEndsAt: subscription.trial_end
  //       ? new Date(subscription.trial_end * 1000).toLocaleDateString()
  //       : "soon",
  //   },
  // })

  // await createAuditLog(null, "license.trial_ending_soon", "license", license.id, {
  //   subscriptionId: subscription.id,
  //   trialEndsAt: subscription.trial_end,
  // })

  await createAuditLog(
    user.id,
    "license.trial_will_end_webhook",
    "license",
    license.id,
    {
      userId: user.id,
      subscriptionId: subscription.id,
      trialEndsAt: subscription.trial_end,
    }
  )
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  // Log subscription creation for tracking
  const metadata = subscription.metadata || {}

  // Resolve actor user via stripeCustomerId for proper per-user activity logging
  let actorUserId: string | null = null
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer?.id
  if (customerId) {
    const [u] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.stripeCustomerId, customerId))
      .limit(1)
    actorUserId = u?.id || null
  }

  await createAuditLog(
    actorUserId,
    "subscription.created",
    "subscription",
    subscription.id,
    {
      userId: actorUserId,
      customerId: subscription.customer,
      status: subscription.status,
      trialEnd: subscription.trial_end,
      metadata: metadata,
    }
  )

  // Note: It's normal for the license to not exist yet here — Stripe fires
  // customer.subscription.created BEFORE checkout.session.completed.
  // The license is created by the checkout.session.completed / invoice.payment_succeeded
  // handlers, so we don't poll/warn for that expected race.
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  // Find payment record by payment intent
  const paymentIntentId = charge.payment_intent as string
  if (!paymentIntentId) {
    console.warn(`[webhook] Refund with no payment intent: ${charge.id}`)
    return
  }

  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.stripePaymentIntentId, paymentIntentId))
    .limit(1)

  if (!payment) {
    console.warn(
      `[webhook] Refund for unknown payment intent: ${paymentIntentId}`
    )
    return
  }

  // Distinguish full vs partial refunds. A partial refund (support credit,
  // dispute reduction) should NOT revoke the license — only mark the
  // payment row so it surfaces in billing history. Stripe sets
  // `charge.refunded === true` only when the entire amount has been
  // refunded; we double-check `amount_refunded >= amount` to be safe
  // across API versions.
  const isFullRefund =
    charge.refunded === true || charge.amount_refunded >= charge.amount

  // Update payment status
  await db
    .update(payments)
    .set({
      status: isFullRefund ? "refunded" : "partially_refunded",
      updatedAt: new Date(),
    })
    .where(eq(payments.id, payment.id))

  if (!isFullRefund) {
    // Partial refund: log and stop. No license revocation, no domain
    // teardown — the user is still entitled.
    console.log(
      `[webhook] Partial refund for payment ${payment.id} (refunded ${charge.amount_refunded} of ${charge.amount}); license retained.`
    )
    return
  }

  // Find order associated with this payment
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.paymentId, payment.id))
    .limit(1)

  if (!order) {
    console.warn(`[webhook] No order found for payment ${payment.id}`)
    return
  }

  // Find license via sourceOrderId
  const [license] = await db
    .select()
    .from(licenses)
    .where(eq(licenses.sourceOrderId, order.id))
    .limit(1)

  if (!license) {
    console.warn(`[webhook] No license found for order ${order.id}`)
    return
  }

  // Revoke license and its domains
  await db.transaction(async (tx) => {
    // Revoke license
    await tx
      .update(licenses)
      .set({
        status: "revoked",
        revokedReason: "refunded",
        updatedAt: new Date(),
      })
      .where(eq(licenses.id, license.id))

    // Revoke domains
    const licenseDomains = await tx
      .select()
      .from(domains)
      .where(and(eq(domains.licenseId, license.id), isNull(domains.deletedAt)))

    for (const dom of licenseDomains) {
      await enqueueLicenseMetadataExportJob({
        domainName: dom.domainName,
        userId: dom.userId,
        action: "delete",
      }).catch((err) => {
        console.error(
          `[webhook] Failed to enqueue revocation for ${dom.domainName}:`,
          err
        )
      })
    }
  })

  await createAuditLog(
    license.userId,
    "payment.refunded",
    "payment",
    charge.id,
    {
      userId: license.userId,
      paymentId: payment.id,
      amount: charge.amount_refunded,
      reason: (charge as any).reason || "unknown",
      licenseId: license.id,
    }
  )

  // console.log(
  //   `[webhook] Refunded payment ${payment.id} and revoked license ${license.id}`
  // )
}
