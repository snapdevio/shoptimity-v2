import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import crypto from "node:crypto"
import { db } from "@/db"
import {
  users,
  payments,
  orders,
  orderDomains,
  licenses,
  domains,
  webhookEvents,
  plans,
} from "@/db/schema"
import { eq, and, isNull, sql } from "drizzle-orm"
import { normalizeDomain } from "@/lib/domains"
import { enqueueEmailJob, enqueueLicenseMetadataExportJob } from "@/lib/queue"
import { createAuditLog } from "@/lib/audit"
import { getPostHog } from "@/lib/posthog-server"

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!)
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
  // console.log("event webhook Main=>", JSON.stringify(event))
  // Idempotency check
  const existing = await db
    .select({ id: webhookEvents.id, processed: webhookEvents.processed })
    .from(webhookEvents)
    .where(eq(webhookEvents.eventId, event.id))
    .limit(1)

  if (existing.length > 0 && existing[0].processed) {
    return NextResponse.json({ received: true, duplicate: true })
  }
  // console.log("event webhook existing=>", JSON.stringify(existing))
  // Insert or update webhook event record (idempotency support)
  let webhookRecordId: string
  if (existing.length > 0) {
    webhookRecordId = existing[0].id
  } else {
    const [record] = await db
      .insert(webhookEvents)
      .values({
        eventId: event.id,
        type: event.type,
        processed: false,
      })
      .returning()
    webhookRecordId = record.id
  }
  // console.log("event webhook webhookRecord=>", JSON.stringify(webhookRecord))
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
      default:
        break
    }

    await db
      .update(webhookEvents)
      .set({ processed: true, processedAt: new Date() })
      .where(eq(webhookEvents.id, webhookRecordId))
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown processing error"
    await db
      .update(webhookEvents)
      .set({ processed: false, processingError: errorMessage })
      .where(eq(webhookEvents.id, webhookRecordId))

    console.error(`Webhook processing error for ${event.id}:`, errorMessage)
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
}: {
  email: string
  name?: string
  planId: string
  licenseQuantity: number
  stripeSessionId: string
  stripeSetupIntentId: string
  stripeCustomerId: string
}) {
  const normalizedEmail = email.toLowerCase().trim()

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
        })
        .returning()
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
        amount: plan.finalPrice, // Future amount
        currency: plan.currency || "usd",
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

    // Create license with trial period
    await tx.insert(licenses).values({
      userId: user.id,
      planId,
      totalSlots: plan.slots,
      status: "active",
      sourceOrderId: order.id,
      isTrial: true,
      isLifetime: true, // Marker for conversion to lifetime
      trialEndsAt: new Date(Date.now() + plan.trialDays * 86400000),
      stripeSubscriptionId: stripeSetupIntentId, // HACK: Reusing field for setup intent ID
    })

    await createAuditLog(
      null,
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
}

async function fulfillOrder({
  email,
  name,
  planId,
  licenseId: customLicenseId,
  licenseQuantity,
  domains: domainsJson,
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
}: {
  email: string
  name?: string
  planId: string
  licenseId?: string
  licenseQuantity: number
  domains?: string
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
}) {
  // 1. Idempotency Check: See if we already have a fulfilled payment for this Intent ID or Session ID
  const conditions = []
  if (stripePaymentIntentId)
    conditions.push(eq(payments.stripePaymentIntentId, stripePaymentIntentId))
  if (stripeSessionId)
    conditions.push(eq(payments.stripeSessionId, stripeSessionId))

  const [existingPayment] = await db
    .select({ id: payments.id, status: payments.status })
    .from(payments)
    .where(sql`${sql.join(conditions, sql` OR `)}`)
    .limit(1)

  if (existingPayment) {
    // Check if an order already exists for this payment
    const [existingOrder] = await db
      .select({ id: orders.id })
      .from(orders)
      .where(eq(orders.paymentId, existingPayment.id))
      .limit(1)

    if (existingOrder) {
      return
    }
  }

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
    // Find or create user
    const [existingUser] = await tx
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1)

    user = existingUser

    if (!user) {
      ;[user] = await tx
        .insert(users)
        .values({
          id: crypto.randomUUID(),
          name: name || normalizedEmail.split("@")[0],
          email: normalizedEmail,
          emailVerified: true,
        })
        .returning()
    }

    // Create or Update payment record
    let paymentId: string
    if (existingPayment) {
      paymentId = existingPayment.id
      await tx
        .update(payments)
        .set({
          status: "paid",
          stripeSessionId: stripeSessionId || existingPayment.id, // fallback
          ...(stripeSubscriptionId && { stripeSubscriptionId }),
          stripeInvoiceId: stripeInvoiceId || null,
          stripeInvoiceUrl: stripeInvoiceUrl || null,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, paymentId))
    } else {
      // If we have a customLicenseId, try to find an existing trialing/pending payment
      let existingTrialPayment: any = null
      if (customLicenseId) {
        const [license] = await tx
          .select({ sourceOrderId: licenses.sourceOrderId })
          .from(licenses)
          .where(eq(licenses.id, customLicenseId))
          .limit(1)

        if (license?.sourceOrderId) {
          const [order] = await tx
            .select({ paymentId: orders.paymentId })
            .from(orders)
            .where(eq(orders.id, license.sourceOrderId))
            .limit(1)

          if (order?.paymentId) {
            const [pay] = await tx
              .select()
              .from(payments)
              .where(eq(payments.id, order.paymentId))
              .limit(1)
            existingTrialPayment = pay
          }
        }
      }

      if (existingTrialPayment) {
        paymentId = existingTrialPayment.id
        await tx
          .update(payments)
          .set({
            status: "paid",
            stripePaymentIntentId: stripePaymentIntentId || null,
            stripeCustomerId: stripeCustomerId || null,
            stripeInvoiceId: stripeInvoiceId || null,
            stripeInvoiceUrl: stripeInvoiceUrl || null,
            amount: amount, // record the actual paid amount
            updatedAt: new Date(),
          })
          .where(eq(payments.id, paymentId))
      } else {
        const [payment] = await tx
          .insert(payments)
          .values({
            userId: user.id,
            stripeSessionId: stripeSessionId,
            stripePaymentIntentId: stripePaymentIntentId || null,
            stripeCustomerId: stripeCustomerId || null,
            stripeSubscriptionId: stripeSubscriptionId || null,
            stripeInvoiceId: stripeInvoiceId || null,
            stripeInvoiceUrl: stripeInvoiceUrl || null,
            amount: amount,
            currency: currency,
            status: isTrial ? "pending" : "paid", // Pending for trials until first invoice paid
          })
          .returning()
        paymentId = payment.id
      }
    }

    // Determine if this should be a lifetime license immediately
    // If it's a paid checkout (no trial), it's lifetime
    const isLifetime = !isTrial && amount > 0

    // Get plan info
    const [plan] = await tx
      .select()
      .from(plans)
      .where(eq(plans.id, planId))
      .limit(1)

    if (!plan) {
      throw new Error(`Plan ${planId} not found`)
    }

    // Create or Update License
    let finalLicenseId: string
    if (customLicenseId) {
      const [license] = await tx
        .update(licenses)
        .set({
          status: "active",
          isTrial: isTrial || false,
          isLifetime: isLifetime || false,
          trialEndsAt: trialEndsAt || null,
          stripeSubscriptionId: stripeSubscriptionId || null,
          updatedAt: new Date(),
        })
        .where(eq(licenses.id, customLicenseId))
        .returning()

      if (!license) {
        // Fallback: This shouldn't happen if customLicenseId is valid
        const [newLicense] = await tx
          .insert(licenses)
          .values({
            userId: user.id,
            planId,
            totalSlots: plan.slots,
            status: "active",
            isTrial: isTrial || false,
            isLifetime: isLifetime || false,
            trialEndsAt: trialEndsAt || null,
            stripeSubscriptionId: stripeSubscriptionId || null,
          })
          .returning()
        finalLicenseId = newLicense.id
      } else {
        finalLicenseId = license.id
      }
    } else {
      // Standard flow: Create order and new license
      const [order] = await tx
        .insert(orders)
        .values({
          userId: user.id,
          paymentId: paymentId,
          planId,
          licenseQuantity,
          contactName: name || user.name || normalizedEmail.split("@")[0],
          status: "fulfilled",
        })
        .returning()

      const [license] = await tx
        .insert(licenses)
        .values({
          userId: user.id,
          planId,
          totalSlots: plan.slots,
          status: "active",
          sourceOrderId: order.id,
          isTrial: isTrial || false,
          isLifetime: isLifetime || false,
          trialEndsAt: trialEndsAt || null,
          stripeSubscriptionId: stripeSubscriptionId || null,
        })
        .returning()
      finalLicenseId = license.id
    }

    // Audit log
    await createAuditLog(
      null,
      customLicenseId
        ? "webhook.conversion_completed"
        : "webhook.fulfillment_completed",
      customLicenseId ? "license" : "order",
      customLicenseId || paymentId,
      {
        userId: user.id,
        paymentId: paymentId,
        licenseId: finalLicenseId,
        isConversion: !!customLicenseId,
      },
      tx
    )

    emailJobToEnqueue = {
      template: customLicenseId
        ? "conversion-confirmation"
        : "order-confirmation",
      to: normalizedEmail,
      props: {
        contactName: name || user.name || normalizedEmail.split("@")[0],
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
  } = metadata

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
  // We allow amount_total to be less than finalPrice if promotion codes are allowed
  if (session.amount_total !== null && session.amount_total > plan.finalPrice) {
    throw new Error(
      `[webhook] Security Alert: Amount exceeds plan price for session ${session.id}. ` +
        `Max expected ${plan.finalPrice}, received ${session.amount_total}. fulfillment aborted.`
    )
  }

  const licenseQuantity = parseInt(licenseQuantityStr, 10)

  // Expand session to get invoice info
  const stripe = getStripe()
  const expandedSession = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ["invoice", "subscription"],
  })

  const stripePaymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id || null

  await fulfillOrder({
    email: customerEmail,
    name: contactName || session.customer_details?.name || undefined,
    planId: planId as string,
    licenseQuantity,
    domains: domainsJson,
    stripeSessionId: session.id,
    stripePaymentIntentId,
    stripeCustomerId:
      (typeof session.customer === "string"
        ? session.customer
        : session.customer?.id) || null,
    amount: session.amount_total || 0,
    currency: session.currency || "usd",
    isTrial: isTrial,
    trialEndsAt: isTrial
      ? new Date(Date.now() + plan.trialDays * 86400000)
      : undefined,
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
  // console.log(`719 [${paymentIntent.id}]metadata=>`, JSON.stringify(metadata, null, 2))

  // Only attempt fulfillment if we have the necessary metadata
  // If it has a checkout session ID, let checkout.session.completed handle fulfillment to avoid duplicates
  if (metadata.session_id || !planId || !licenseQuantityStr) {
    await db
      .update(payments)
      .set({ status: "paid", updatedAt: new Date() })
      .where(eq(payments.stripePaymentIntentId, paymentIntent.id))
    return
  }

  const email = metadata.email || paymentIntent.receipt_email || ""
  if (!email) {
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
    email,
    name: contactName || undefined,
    planId: planId as string,
    licenseId: licenseId as string,
    licenseQuantity: parseInt(licenseQuantityStr, 10),
    domains: domainsJson,
    stripeSessionId: metadata.session_id || paymentIntent.id, // Fallback to PI ID if no session ID in meta
    stripePaymentIntentId: paymentIntent.id,
    stripeCustomerId:
      (typeof paymentIntent.customer === "string"
        ? paymentIntent.customer
        : paymentIntent.customer?.id) || null,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
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

  await createAuditLog(null, "payment.failed", "payment", paymentIntent.id, {
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    error: paymentIntent.last_payment_error?.message || "Unknown payment error",
    licenseId: licenseId || null,
  })
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
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

    await db
      .update(payments)
      .set({
        status: invoice.status || "paid",
        stripeInvoiceId: invoice.id,
        stripeInvoiceUrl: invoice.hosted_invoice_url,
        updatedAt: new Date(),
      })
      .where(sql`${sql.join(conditions, sql` OR `)}`)
  }

  if (!license || !license.isTrial) return

  // Trial payment succeeded! Convert to lifetime if amount is > 0
  if (invoice.amount_paid > 0) {
    await db.transaction(async (tx) => {
      // 1. Mark license as no longer trial and set as Lifetime
      await tx
        .update(licenses)
        .set({
          status: "active",
          isTrial: false,
          isLifetime: true,
          trialEndsAt: null,
          updatedAt: new Date(),
        })
        .where(eq(licenses.id, license.id))

      // 2. Mark payment as paid and store invoice info
      await tx
        .update(payments)
        .set({
          status: "paid",
          stripeInvoiceId: invoice.id || null,
          stripeInvoiceUrl: invoice.hosted_invoice_url || null,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, license.sourceOrderId as string))

      // 3. Cancel the subscription so they aren't charged again (Lifetime requirement)
      // const stripe = getStripe()
      // await stripe.subscriptions.cancel(subscriptionId)
    })
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
    null,
    "license.trial_to_lifetime",
    "license",
    license.id,
    {
      subscriptionId,
      invoiceId: invoice.id,
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

  await createAuditLog(null, "license.payment_failed", "license", license.id, {
    subscriptionId,
    invoiceId: invoice.id,
    amountDue: invoice.amount_due,
  })
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

  // Check if it was during trial (as requested by user)
  const isTrialCancellation =
    subscription.trial_end && subscription.status === "canceled"

  // Revoke the license since the subscription is gone
  await db.transaction(async (tx) => {
    // 1. Update license status
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

    // 2. Fetch active domains and deactivate them
    const activeDomains = await tx
      .select()
      .from(domains)
      .where(and(eq(domains.licenseId, license.id), isNull(domains.deletedAt)))

    for (const dom of activeDomains) {
      // console.log(`[webhook] Revoking access for domain: ${dom.domainName} (License: ${license.id})`)
      await db
        .update(domains)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(eq(domains.id, dom.id))
      await enqueueLicenseMetadataExportJob({
        domainName: dom.domainName,
        userId: license.userId,
        action: "delete", // Remove from active set
      })
    }
  })

  await createAuditLog(
    null,
    isTrialCancellation
      ? "license.trial_canceled"
      : "license.subscription_deleted",
    "license",
    license.id,
    {
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

  // Determine our internal status
  // If Stripe says it's trialing/active but will cancel at end of period, we show it as "canceled"
  let ourStatus = subscription.status
  if (subscription.cancel_at_period_end) {
    ourStatus = "canceled"
  }

  await db
    .update(licenses)
    .set({
      isTrial: subscription.status === "trialing",
      trialEndsAt: trialEndsAt,
      status: ourStatus,
      updatedAt: new Date(),
    })
    .where(eq(licenses.id, license.id))

  // If status changed to canceled or past_due, we should update R2 to revoke access immediately
  if (ourStatus === "canceled" || ourStatus === "past_due") {
    const licenseDomains = await db
      .select()
      .from(domains)
      .where(and(eq(domains.licenseId, license.id), isNull(domains.deletedAt)))

    for (const dom of licenseDomains) {
      await enqueueLicenseMetadataExportJob({
        domainName: dom.domainName,
        userId: license.userId,
        action: "upsert", // The worker will detect the status and delete the R2 file
      })
    }
  }

  await createAuditLog(
    null,
    "license.subscription_updated",
    "license",
    license.id,
    {
      subscriptionStatus: subscription.status,
      isTrial: subscription.status === "trialing",
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
    null,
    "license.trial_will_end_webhook",
    "license",
    license.id,
    {
      subscriptionId: subscription.id,
      trialEndsAt: subscription.trial_end,
    }
  )
}
