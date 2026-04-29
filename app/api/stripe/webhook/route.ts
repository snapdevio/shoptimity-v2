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
  if (process.env.NODE_ENV === "development") {
    console.log("event webhook Main=>", JSON.stringify(event))
  }
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
        })
        .returning()
    } else if (!user.stripeCustomerId) {
      await tx
        .update(users)
        .set({ stripeCustomerId })
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
        stripeSubscriptionId: stripeSetupIntentId,
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
    await tx
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
        stripeSubscriptionId: stripeSetupIntentId, // HACK: Reusing field for setup intent ID
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
          stripeSubscriptionId: stripeSetupIntentId,
          updatedAt: new Date(),
        },
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

    // 4. Create or Update License (Atomic Upsert for 1 license per user)
    const [license] = await tx
      .insert(licenses)
      .values({
        userId: userRecord.id,
        planId,
        totalSlots: plan.slots * licenseQuantity,
        status: "active",
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
      })
      .onConflictDoUpdate({
        target: licenses.userId,
        set: {
          planId,
          totalSlots: plan.slots * licenseQuantity,
          status: "active",
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
          updatedAt: new Date(),
        },
      })
      .returning()

    const finalLicenseId = license.id

    // 5. Create order record
    await tx.insert(orders).values({
      userId: userRecord.id,
      paymentId: paymentId,
      planId,
      licenseQuantity,
      contactName: name || userRecord.name || normalizedEmail.split("@")[0],
      status: "fulfilled",
    })

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
      const normalized = normalizeDomain(domainName)
      if (!normalized) continue

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

    // Audit log
    await createAuditLog(
      null,
      "webhook.fulfillment_completed",
      "license",
      finalLicenseId,
      {
        userId: userRecord.id,
        paymentId: paymentId,
        licenseId: finalLicenseId,
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
    promo_code: promoCode,
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
    expand: ["invoice", "subscription", "payment_intent", "setup_intent"],
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
    trialEndsAt: isTrial
      ? new Date(Date.now() + plan.trialDays * 86400000)
      : undefined,
    nextRenewalDate:
      expandedSession.subscription &&
      typeof expandedSession.subscription !== "string"
        ? new Date(
            (expandedSession.subscription as any).current_period_end * 1000
          )
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
  // console.log(`719 [${paymentIntent.id}]metadata=>`, JSON.stringify(metadata, null, 2))

  // Only attempt fulfillment if we have the necessary metadata
  // If it has a checkout session ID, let checkout.session.completed handle fulfillment to avoid duplicates
  let finalPlanId = planId
  let finalLicenseQuantityStr = licenseQuantityStr
  let finalEmail = metadata.email || paymentIntent.receipt_email || ""
  let finalContactName = contactName
  let finalDomainsJson = domainsJson
  let finalSubscriptionId: string | null = null

  const piAny = paymentIntent as any
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

  await createAuditLog(null, "payment.failed", "payment", paymentIntent.id, {
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    error: paymentIntent.last_payment_error?.message || "Unknown payment error",
    licenseId: licenseId || null,
  })
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

  // Determine next renewal date from the invoice line items
  const nextRenewalDate =
    invoice.lines?.data?.length > 0
      ? new Date(invoice.lines.data[0].period.end * 1000)
      : null

  if (license) {
    // If license exists, update its renewal date and ensure it's active
    await db
      .update(licenses)
      .set({
        status: "active",
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
    if (!metadata.plan_id) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      metadata = { ...metadata, ...(subscription.metadata || {}) }
    }

    if (metadata.plan_id) {
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
        trialEndsAt: (invoice as any).subscription_details?.trial_end
          ? new Date((invoice as any).subscription_details.trial_end * 1000)
          : null,
        stripeInvoiceId: invoice.id,
        stripeInvoiceUrl: invoice.hosted_invoice_url,
        nextRenewalDate: nextRenewalDate,
      })
    }
    return
  }

  if (!license.isTrial) return

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
      // Fix: lookup the payment record via the order
      if (license.sourceOrderId) {
        const [order] = await tx
          .select({ paymentId: orders.paymentId })
          .from(orders)
          .where(eq(orders.id, license.sourceOrderId))
          .limit(1)

        if (order?.paymentId) {
          await tx
            .update(payments)
            .set({
              status: "paid",
              stripeInvoiceId: invoice.id || null,
              stripeInvoiceUrl: invoice.hosted_invoice_url || null,
              stripePaymentIntentId: pi || null,
              updatedAt: new Date(),
            })
            .where(eq(payments.id, order.paymentId))
        }
      }

      // 3. Cancel the subscription so they aren't charged again (Lifetime requirement)
      const stripe = getStripe()
      await stripe.subscriptions.cancel(subscriptionId).catch((err) => {
        console.error(
          `[webhook] Failed to cancel subscription ${subscriptionId}:`,
          err
        )
      })
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

  // Check if it was during trial
  const isTrialCancellation =
    subscription.trial_end && subscription.status === "canceled"

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

    // 3. Keep existing domains but they might be limited by slots if necessary
    // (Here we assume they stay, but since slots might be 1, if they had more they might need to manage them)
  })

  await createAuditLog(
    null,
    isTrialCancellation
      ? "license.trial_converted_to_free"
      : "license.subscription_converted_to_free",
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

  await db
    .update(licenses)
    .set({
      isTrial: subscription.status === "trialing",
      trialEndsAt: trialEndsAt,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      updatedAt: new Date(),
    })
    .where(eq(licenses.id, license.id))

  // If status changed to canceled (immediate) or past_due, we should update R2 to revoke access
  if (
    subscription.status === "canceled" ||
    subscription.status === "past_due"
  ) {
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

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  // Log subscription creation for tracking
  const metadata = subscription.metadata || {}

  await createAuditLog(
    null,
    "subscription.created",
    "subscription",
    subscription.id,
    {
      customerId: subscription.customer,
      status: subscription.status,
      trialEnd: subscription.trial_end,
      metadata: metadata,
    }
  )

  // If this is the first subscription and we don't have it recorded yet,
  // log it for investigation
  const [license] = await db
    .select()
    .from(licenses)
    .where(eq(licenses.stripeSubscriptionId, subscription.id))
    .limit(1)

  if (!license && metadata.plan_id) {
    console.warn(
      `[webhook] New subscription ${subscription.id} created but license not found. ` +
        `Plan: ${metadata.plan_id}. Awaiting checkout.session.completed...`
    )
  }
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

  // Update payment status
  await db
    .update(payments)
    .set({
      status: "refunded",
      updatedAt: new Date(),
    })
    .where(eq(payments.id, payment.id))

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

  await createAuditLog(null, "payment.refunded", "payment", charge.id, {
    paymentId: payment.id,
    amount: charge.amount_refunded,
    reason: (charge as any).reason || "unknown",
    licenseId: license.id,
  })

  // console.log(
  //   `[webhook] Refunded payment ${payment.id} and revoked license ${license.id}`
  // )
}
