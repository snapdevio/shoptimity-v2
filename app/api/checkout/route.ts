import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { db } from "@/db"
import { licenses, plans, users, payments, orders } from "@/db/schema"
import { and, eq, or, isNotNull } from "drizzle-orm"
import { z } from "zod"
import { createAuditLog } from "@/lib/audit"
import { getAppSession } from "@/lib/auth-session"
import { domains as domainsTable } from "@/db/schema/domains"
import { isNull } from "drizzle-orm"
import { enqueueLicenseMetadataExportJob } from "@/lib/queue"
import { getAllowedOriginHosts } from "@/lib/allowed-origins"

async function activateFreePlan(opts: {
  stripe: Stripe
  userId: string
  email: string
  contactName: string
  plan: typeof plans.$inferSelect
  stripeCustomerId?: string | null
}) {
  const { stripe, userId, email, contactName, plan } = opts
  const normalizedEmail = email.toLowerCase().trim()

  // Domains to refresh in R2 after the transaction commits. The license
  // upsert below changes `planId` (e.g. Pro → Free); without re-exporting
  // metadata, the public `<domain>.json` keeps the old plan_name.
  const domainsToRefresh: { domainName: string; userId: string }[] = []

  await db.transaction(async (tx) => {
    // Resolve user (prefer authenticated session userId, fallback to email)
    let [user] = userId
      ? await tx.select().from(users).where(eq(users.id, userId)).limit(1)
      : []

    if (!user) {
      ;[user] = await tx
        .select()
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1)
    }

    if (!user) {
      ;[user] = await tx
        .insert(users)
        .values({
          id: userId || crypto.randomUUID(),
          name: contactName || normalizedEmail.split("@")[0],
          email: normalizedEmail,
          emailVerified: true,
          stripeCustomerId: opts.stripeCustomerId || null,
        })
        .returning()
    }

    // Find existing license (preserve license.id and existing domains)
    const [existingLicense] = await tx
      .select()
      .from(licenses)
      .where(eq(licenses.userId, user.id))
      .limit(1)

    // If user is downgrading from a paid subscription, cancel it in Stripe
    if (existingLicense?.stripeSubscriptionId) {
      try {
        await stripe.subscriptions.cancel(existingLicense.stripeSubscriptionId)
      } catch (err) {
        console.error(
          "[checkout] Failed to cancel existing subscription on free downgrade:",
          err
        )
      }
    }

    // Upsert license — does NOT touch domains, preserves license.id
    await tx
      .insert(licenses)
      .values({
        userId: user.id,
        planId: plan.id,
        totalSlots: plan.slots,
        status: "active",
        isTrial: false,
        isLifetime: false,
        billingCycle: "monthly",
        stripeSubscriptionId: null,
        stripeSetupIntentId: null,
        trialEndsAt: null,
        nextRenewalDate: null,
        cancelAtPeriodEnd: false,
      })
      .onConflictDoUpdate({
        target: licenses.userId,
        set: {
          planId: plan.id,
          totalSlots: plan.slots,
          status: "active",
          isTrial: false,
          isLifetime: false,
          billingCycle: "monthly",
          stripeSubscriptionId: null,
          stripeSetupIntentId: null,
          trialEndsAt: null,
          nextRenewalDate: null,
          cancelAtPeriodEnd: false,
          updatedAt: new Date(),
        },
      })

    // Collect existing domains for post-commit R2 refresh. The license id
    // is preserved by the upsert, so domain rows still link here — they
    // just need a fresh JSON snapshot reflecting the new (free) plan_name.
    if (existingLicense) {
      const existingDomains = await tx
        .select({ domainName: domainsTable.domainName })
        .from(domainsTable)
        .where(
          and(
            eq(domainsTable.licenseId, existingLicense.id),
            isNull(domainsTable.deletedAt)
          )
        )
      for (const d of existingDomains) {
        domainsToRefresh.push({ domainName: d.domainName, userId: user.id })
      }
    }

    await createAuditLog(
      user.id,
      existingLicense
        ? "license.changed_to_free_plan"
        : "license.free_plan_activated",
      "license",
      plan.id,
      {
        userId: user.id,
        email: normalizedEmail,
        planId: plan.id,
        previousPlanId: existingLicense?.planId || null,
        previousLicenseId: existingLicense?.id || null,
      },
      tx
    )
  })

  // Enqueue R2 refresh after commit so the worker reads the just-saved
  // free-plan state. Without this, the public license JSON keeps showing
  // the previous plan_name (Pro / Trial / etc).
  for (const job of domainsToRefresh) {
    await enqueueLicenseMetadataExportJob({
      domainName: job.domainName,
      userId: job.userId,
      action: "upsert",
    }).catch((err) => {
      console.error(
        `[checkout] Failed to enqueue R2 refresh for ${job.domainName} (free activation):`,
        err
      )
    })
  }
}

const checkoutSchema = z.object({
  email: z
    .string()
    .email()
    .transform((v) => v.toLowerCase().trim()),
  contactName: z.string().min(1).max(200),
  planId: z.string().uuid(),
  licenseQuantity: z.number().int().min(1).max(100).optional().default(1),
  domains: z.array(z.string()).max(300).optional(),
  isYearly: z.boolean().optional(),
  paymentCardId: z.string().nullable().optional(),
  address: z
    .object({
      line1: z.string().optional(),
      line2: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postal_code: z.string().optional(),
      country: z.string().optional(),
      company: z.string().optional(),
    })
    .optional(),
  promoCode: z.string().nullable().optional(),
})

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!)
}

async function getOrCreateProduct(stripe: Stripe, name: string) {
  const products = await stripe.products.list({ limit: 100 })
  const existing = products.data.find((p) => p.name === name)
  if (existing) return existing.id

  const product = await stripe.products.create({ name })
  return product.id
}

async function resolvePromoCode(
  stripe: Stripe,
  promoCode: string | null | undefined
) {
  if (!promoCode) return undefined

  if (promoCode.startsWith("promo_")) {
    return { promotion_code: promoCode }
  }

  try {
    const promos = await stripe.promotionCodes.list({
      code: promoCode.trim(),
      active: true,
      limit: 1,
    })

    if (promos.data.length > 0) {
      return { promotion_code: promos.data[0].id }
    }

    // Fallback to coupon
    return { coupon: promoCode.trim() }
  } catch (err) {
    console.error("[resolvePromoCode] Error:", err)
    return { coupon: promoCode.trim() }
  }
}

async function createCheckoutSession(props: {
  stripe: Stripe
  plan: any
  isTrial: boolean
  userEmail?: string
  contactName?: string
  licenseQuantity: number
  domains?: string[]
  appUrl: string
  isYearlyPlan?: boolean
  stripePaymentMethodId?: string
  stripeCustomerId?: string
  finalAmount: number
  address?: {
    line1?: string
    line2?: string
    city?: string
    state?: string
    postal_code?: string
    country?: string
    company?: string
  }
  promoCode?: string
}) {
  const {
    stripe,
    plan,
    isTrial,
    userEmail,
    contactName,
    licenseQuantity,
    domains,
    appUrl,
    isYearlyPlan,
    stripePaymentMethodId,
    stripeCustomerId,
    finalAmount,
    address,
    promoCode,
  } = props

  console.log("[createCheckoutSession] Props:", JSON.stringify(props, null, 2))

  // Direct Check: Use all domains if they fit in 300 chars, otherwise fallback to first 3
  const domainsJson = domains ? JSON.stringify(domains) : ""
  const domainsMetadata =
    domainsJson.length <= 300
      ? domainsJson
      : JSON.stringify(domains!.slice(0, 3))

  const metadata = {
    plan_id: plan.id,
    license_quantity: String(licenseQuantity || 1),
    contact_name: contactName || "",
    domains: domainsMetadata,
    is_trial: isTrial ? "true" : "false",
    is_yearly: isYearlyPlan ? "true" : "false",
    is_lifetime: plan.mode === "lifetime" ? "true" : "false",
    final_amount: String(finalAmount),
    // Store app_url for webhook domain validation
    app_url: appUrl,
    // Trials are real Stripe subscriptions in the new flow, so they
    // route through the same `fulfillOrder` webhook path. Keeping
    // `is_trial: "true"` is enough for the webhook to set trial state
    // on the license — the legacy `trial_setup` type is only used for
    // pre-existing setup-mode sessions still in flight.
    type:
      plan.mode === "monthly" || plan.mode === "yearly" || isTrial
        ? "subscription"
        : "lifetime_purchase",
    address_line1: address?.line1 || "",
    address_line2: address?.line2 || "",
    address_city: address?.city || "",
    address_state: address?.state || "",
    address_zip: address?.postal_code || "",
    address_country: address?.country || "",
    company_name: address?.company || "",
    promo_code: promoCode || "",
  }

  const isSubscription = plan.mode === "monthly" || plan.mode === "yearly"

  // Resolve promo code to either promotion_code ID or coupon ID
  const discount = await resolvePromoCode(stripe, promoCode)

  // Trial signups are now real Stripe subscriptions with
  // `trial_period_days`, so the only difference between trial and paid
  // is the trial-period setting. Both use mode=subscription. Setup-mode
  // is gone — it left a `pm_*` placeholder that the rest of the app
  // had to special-case (cancel, upgrade, retention discount all
  // tripped on it).
  return await stripe.checkout.sessions.create({
    customer: stripeCustomerId || undefined,
    customer_email: stripeCustomerId ? undefined : userEmail || undefined,
    ...(!stripeCustomerId && plan.mode === "lifetime" && !isTrial
      ? { customer_creation: "always" }
      : {}),
    metadata,
    ...(isSubscription || isTrial
      ? {
          mode: "subscription",
          line_items: [
            {
              price_data: {
                currency: plan.currency || "usd",
                product_data: {
                  name: `${plan.name} (${isYearlyPlan ? "Yearly" : "Monthly"})`,
                  description: `${isYearlyPlan ? "Yearly" : "Monthly"} subscription for ${plan.slots} domain${plan.slots > 1 ? "s" : ""}.`,
                },
                unit_amount: finalAmount,
                recurring: {
                  interval: isYearlyPlan ? "year" : "month",
                },
              },
              quantity: 1,
            },
          ],
          subscription_data: {
            metadata,
            ...(isTrial ? { trial_period_days: plan.trialDays } : {}),
            ...(stripePaymentMethodId
              ? { default_payment_method: stripePaymentMethodId }
              : {}),
          },
          ...(discount
            ? { discounts: [discount] }
            : { allow_promotion_codes: true }),
          ...(isTrial
            ? {
                custom_text: {
                  submit: {
                    message: `You're starting a ${plan.trialDays}-day free trial for the ${plan.name} plan. Your card will NOT be charged today. You will be automatically charged $${(finalAmount / 100).toFixed(2)} after ${plan.trialDays} days unless you cancel.`,
                  },
                },
              }
            : {}),
        }
      : {
          mode: "payment",
          line_items: [
            {
              price_data: {
                currency: plan.currency || "usd",
                product_data: {
                  name: `${plan.name} (Lifetime ${plan.slots > 1 ? "Licenses" : "License"})`,
                  description: `Lifetime access for ${plan.slots} domain${plan.slots > 1 ? "s" : ""}.`,
                },
                unit_amount: finalAmount,
              },
              quantity: 1,
            },
          ],
          payment_intent_data: {
            metadata: {
              ...metadata,
              email: userEmail || "",
            },
          },
          ...(discount
            ? { discounts: [discount] }
            : { allow_promotion_codes: true }),
        }),
    success_url: `${appUrl}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/pricing`,
  })
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const planId = searchParams.get("planId")
  const quantityStr = searchParams.get("quantity") || "1"
  const quantity = parseInt(quantityStr, 10)
  const isYearly =
    searchParams.get("isYearly") === "true" ||
    searchParams.get("isyearly") === "true"

  if (!planId) {
    return NextResponse.redirect(new URL("/pricing", request.url))
  }

  // Get plan details
  const [initialPlan] = await db
    .select()
    .from(plans)
    .where(and(eq(plans.id, planId), eq(plans.isActive, true)))
    .limit(1)

  if (!initialPlan) {
    return NextResponse.redirect(new URL("/pricing", request.url))
  }

  let plan = initialPlan

  // If isYearly is requested, try to find the yearly version of this plan
  if (isYearly && plan.mode === "monthly") {
    const [yearlyVersion] = await db
      .select()
      .from(plans)
      .where(and(eq(plans.name, plan.name), eq(plans.mode, "yearly")))
      .limit(1)
    if (yearlyVersion) {
      plan = yearlyVersion
    }
  }

  // Calculate base price before coupons
  const baseMonthly =
    plan.mode === "yearly"
      ? (
          await db
            .select()
            .from(plans)
            .where(and(eq(plans.name, plan.name), eq(plans.mode, "monthly")))
            .limit(1)
        )[0]?.finalPrice || plan.finalPrice
      : plan.finalPrice

  let finalAmount = isYearly ? baseMonthly * 12 : plan.finalPrice

  // Get user session for pre-filling and security
  const session = await getAppSession()

  if (!session) {
    return NextResponse.redirect(
      new URL("/login?redirect=/pricing", request.url)
    )
  }

  let contactName = ""
  let userEmail = session.email
  const [userRecord] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1)
  contactName = userRecord?.name || ""

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://shoptimity.com"
  const stripe = getStripe()

  // Check trial eligibility if logged in. The per-user `hasUsedTrial`
  // flag is the source of truth — checking the licenses row alone is
  // bypassable because cancellation overwrites the row to the free
  // plan, leaving no record of the prior trial.
  let isTrialEligible = plan.trialDays > 0

  if (session && isTrialEligible) {
    const [userTrialState] = await db
      .select({ hasUsedTrial: users.hasUsedTrial })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1)

    if (userTrialState?.hasUsedTrial) {
      isTrialEligible = false
    }
  }

  const domain = searchParams.get("domain")
  const domains = domain ? [domain] : undefined

  try {
    // Free plan — skip Stripe, fulfill directly and redirect to /thank-you
    if (plan.finalPrice === 0) {
      // Guard: active paid subscribers must use the billing cancel flow
      const [activePaidLicense] = await db
        .select({ id: licenses.id })
        .from(licenses)
        .where(
          and(
            eq(licenses.userId, session.userId),
            or(eq(licenses.status, "active"), eq(licenses.status, "trialing")),
            isNotNull(licenses.stripeSubscriptionId)
          )
        )
        .limit(1)

      if (activePaidLicense) {
        return NextResponse.redirect(new URL("/billing", request.url))
      }

      const [user] = await db
        .select({ stripeCustomerId: users.stripeCustomerId })
        .from(users)
        .where(eq(users.id, session.userId))
        .limit(1)

      await activateFreePlan({
        stripe,
        userId: session.userId,
        email: userEmail || "",
        contactName,
        plan,
        stripeCustomerId: user?.stripeCustomerId,
      })

      return NextResponse.redirect(
        new URL(`/thank-you?planId=${plan.id}`, request.url)
      )
    }

    const isTrial = isTrialEligible
    const stripeSession = await createCheckoutSession({
      stripe,
      plan,
      isTrial,
      userEmail: userEmail || undefined,
      contactName,
      licenseQuantity: quantity,
      domains,
      appUrl,
      isYearlyPlan: isYearly,
      finalAmount,
      promoCode: isYearly
        ? plan.yearlyDiscountCouponCode || undefined
        : plan.couponCode || undefined,
    })

    return NextResponse.redirect(new URL(stripeSession.url!, request.url))
  } catch (err) {
    console.error("Stripe direct checkout error:", err)
    return NextResponse.redirect(new URL("/pricing", request.url))
  }
}

// Hosts allowed to POST to this checkout endpoint. Driven by the shared
// ALLOWED_ORIGINS env var so it stays aligned with `auth.trustedOrigins`.
// Anything else gets a 403 — without this guard a malicious site could
// submit a cross-origin form to start a Stripe subscription on the victim's
// saved card (the route reads the better-auth cookie, which browsers will
// send on cross-origin POSTs).
function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin")
  const referer = request.headers.get("referer")
  // Prefer Origin (set on POSTs by all modern browsers). Fall back to
  // Referer for older clients. If neither is present we err on the side
  // of denial — legitimate browser flows always set at least one.
  let host: string | null = null
  if (origin) {
    try {
      host = new URL(origin).host
    } catch {
      return false
    }
  } else if (referer) {
    try {
      host = new URL(referer).host
    } catch {
      return false
    }
  }
  if (!host) return false
  if (getAllowedOriginHosts().has(host)) return true
  // Allow the caller's own host (covers preview / staging deployments
  // without having to enumerate them here).
  if (host === request.nextUrl.host) return true
  return false
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json(
      { error: "Forbidden: origin not allowed" },
      { status: 403 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
  // console.log("[Checkout API] Received body:", JSON.stringify(body, null, 2))

  const parsed = checkoutSchema.safeParse(body)
  if (!parsed.success) {
    console.error(
      "[Checkout API] Validation failed:",
      JSON.stringify(parsed.error.flatten(), null, 2)
    )
    return NextResponse.json(
      { error: "Invalid checkout data", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const {
    email: bodyEmail,
    contactName,
    planId,
    licenseQuantity,
    domains,
    isYearly,
    paymentCardId,
    address,
    promoCode,
  } = parsed.data

  // Resolve session up front. When a session is present the body email is
  // overridden with the session email so an authenticated user can't
  // register a checkout (and especially a trial) under a different email
  // than their account — that was the trial-abuse vector: same user, same
  // card, fresh email each time → infinite trials.
  const session = await getAppSession()
  const email = session?.email ? session.email.toLowerCase().trim() : bodyEmail

  // Get plan
  const [initialPlan] = await db
    .select()
    .from(plans)
    .where(eq(plans.id, planId))
    .limit(1)

  if (!initialPlan || !initialPlan.isActive) {
    return NextResponse.json(
      { error: "Plan not found or inactive" },
      { status: 404 }
    )
  }

  let plan = initialPlan

  // If isYearly is requested, try to find the yearly version of this plan
  if (isYearly && plan.mode === "monthly") {
    const [yearlyVersion] = await db
      .select()
      .from(plans)
      .where(and(eq(plans.name, plan.name), eq(plans.mode, "yearly")))
      .limit(1)
    if (yearlyVersion) {
      plan = yearlyVersion
    }
  }

  // Calculate base price before coupons
  const baseMonthly =
    plan.mode === "yearly"
      ? (
          await db
            .select()
            .from(plans)
            .where(and(eq(plans.name, plan.name), eq(plans.mode, "monthly")))
            .limit(1)
        )[0]?.finalPrice || plan.finalPrice
      : plan.finalPrice

  let finalAmount = isYearly ? baseMonthly * 12 : plan.finalPrice

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://shoptimity.com"
  const stripe = getStripe()

  // Trial eligibility: gate on the SESSION user when authenticated, falling
  // back to email lookup only for unauthenticated checkout. Gating purely
  // on the body-supplied email lets a logged-in user cycle through fresh
  // emails with the same card to claim trials repeatedly.
  let isTrialEligible = plan.trialDays > 0
  let stripeCustomerId: string | undefined

  if (session) {
    const [user] = await db
      .select({
        stripeCustomerId: users.stripeCustomerId,
        hasUsedTrial: users.hasUsedTrial,
      })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1)
    stripeCustomerId = user?.stripeCustomerId || undefined
    if (user?.hasUsedTrial) isTrialEligible = false
  } else {
    const [existingUser] = await db
      .select({ id: users.id, hasUsedTrial: users.hasUsedTrial })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)
    if (existingUser?.hasUsedTrial) isTrialEligible = false
  }

  // Handle Free Plan Fulfillment FIRST — no Stripe calls required.
  // Doing this before stripe.customers.update() avoids Stripe errors
  // (e.g. test/live customer mismatches) blocking free activation.
  if (plan.finalPrice === 0) {
    // Guard: block users who already have an active paid subscription from
    // downgrading to free via a direct URL. They must go through the proper
    // cancel flow on the billing page.
    if (session) {
      const [activePaidLicense] = await db
        .select({ id: licenses.id })
        .from(licenses)
        .where(
          and(
            eq(licenses.userId, session.userId),
            or(eq(licenses.status, "active"), eq(licenses.status, "trialing")),
            isNotNull(licenses.stripeSubscriptionId)
          )
        )
        .limit(1)

      if (activePaidLicense) {
        return NextResponse.json(
          {
            error:
              "You already have an active paid subscription. To change your plan, please visit the billing page.",
          },
          { status: 400 }
        )
      }
    }

    try {
      await activateFreePlan({
        stripe,
        userId: session?.userId || "",
        email,
        contactName,
        plan,
        stripeCustomerId,
      })
      return NextResponse.json({ success: true })
    } catch (err) {
      console.error("[checkout] Free plan activation failed:", err)
      return NextResponse.json(
        { error: "Failed to activate free plan" },
        { status: 500 }
      )
    }
  }

  try {
    let stripePaymentMethodId: string | undefined
    if (paymentCardId) {
      // paymentCardId is now just the Stripe PaymentMethod ID passed from the client
      stripePaymentMethodId = paymentCardId
    }

    // Sync address and selected payment method default to Stripe Customer.
    // Setting invoice_settings.default_payment_method here ensures the
    // customer-level default stays in sync with whichever card the user
    // chose at checkout, so Stripe uses the right card for renewals and
    // the billing page reflects the correct default.
    if (stripeCustomerId && address) {
      try {
        await stripe.customers.update(stripeCustomerId, {
          address: {
            line1: address.line1,
            line2: address.line2,
            city: address.city,
            state: address.state,
            postal_code: address.postal_code,
            country: address.country,
          },
          name: contactName,
          metadata: {
            company: address.company || "",
          },
          ...(stripePaymentMethodId
            ? {
                invoice_settings: {
                  default_payment_method: stripePaymentMethodId,
                },
              }
            : {}),
        })
      } catch (err) {
        // Non-fatal: a stale/invalid customer should not block checkout
        console.error("[checkout] stripe.customers.update failed:", err)
      }
    }

    const isTrial = isTrialEligible
    const domainsMetadata = JSON.stringify(domains || [])
    const isSubscription = plan.mode === "monthly" || plan.mode === "yearly"
    const metadata = {
      plan_id: plan.id,
      license_quantity: String(licenseQuantity || 1),
      contact_name: contactName || "",
      domains: domainsMetadata,
      is_trial: isTrial ? "true" : "false",
      is_yearly: isYearly ? "true" : "false",
      is_lifetime: plan.mode === "lifetime" ? "true" : "false",
      final_amount: String(finalAmount),
      // Trials are real Stripe subscriptions in the new flow — same
      // type as paid subs. `is_trial: "true"` carries the trial-state
      // signal for downstream code; the legacy `trial_setup` value is
      // only relevant for old setup-mode sessions.
      type:
        plan.mode === "monthly" || plan.mode === "yearly" || isTrial
          ? "subscription"
          : "lifetime_purchase",
      // Required for webhook domain validation: Stripe copies subscription
      // metadata into invoice.parent.subscription_details.metadata, so
      // app_url must be present here for invoice.* events to pass validation.
      app_url: appUrl,
      // Address Metadata
      address_line1: address?.line1 || "",
      address_line2: address?.line2 || "",
      address_city: address?.city || "",
      address_state: address?.state || "",
      address_zip: address?.postal_code || "",
      address_country: address?.country || "",
      company_name: address?.company || "",
      promo_code: promoCode || "",
    }

    // Direct Payment Flow (if saved card and customer exist)
    if (stripePaymentMethodId && stripeCustomerId) {
      // 1. Handle Trial Case — create a real Stripe subscription with
      //    `trial_period_days` so Stripe handles the auto-charge at trial
      //    end (no cron needed). The subscription's `sub_*` ID is what we
      //    store in `licenses.stripeSubscriptionId`, so the upgrade,
      //    cancel, and retention-discount flows all just work without
      //    the special-case `pm_*` placeholder handling.
      if (isTrial) {
        const normalizedEmail = email.toLowerCase().trim()

        const productId = await getOrCreateProduct(stripe, plan.name)
        const discount = await resolvePromoCode(stripe, promoCode)

        // Stripe creates this in `trialing` status — no charge today.
        // The first invoice fires at `trial_end` and the webhook
        // (`invoice.payment_succeeded` / `customer.subscription.updated`)
        // will flip the license to active.
        const subscription = await stripe.subscriptions.create({
          customer: stripeCustomerId,
          items: [
            {
              price_data: {
                currency: plan.currency || "usd",
                product: productId,
                unit_amount: finalAmount,
                recurring: {
                  interval: isYearly ? "year" : "month",
                },
              },
            },
          ],
          default_payment_method: stripePaymentMethodId,
          trial_period_days: plan.trialDays,
          // Coupons attach cleanly here — they apply to the first invoice
          // (post-trial), matching the "$X charged when trial ends" UX.
          ...(discount ? { discounts: [discount as any] } : {}),
          metadata,
        })

        const trialEndsAt = subscription.trial_end
          ? new Date(subscription.trial_end * 1000)
          : new Date(Date.now() + plan.trialDays * 86400000)

        // Domains attached to the user's existing license (typical case:
        // free-plan user starting a Pro trial). The license upsert below
        // changes planId / isTrial in place, so the public R2 JSON needs
        // to be re-exported with the new plan_name + trial fields.
        const directTrialDomainsToRefresh: {
          domainName: string
          userId: string
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
                name: contactName || normalizedEmail.split("@")[0],
                email: normalizedEmail,
                emailVerified: true,
                stripeCustomerId: stripeCustomerId,
                hasUsedTrial: true,
              })
              .returning()
          } else {
            // Lock the per-user trial gate. Idempotent — re-runs of the
            // same trial signup just rewrite the same `true` value.
            await tx
              .update(users)
              .set({ hasUsedTrial: true, updatedAt: new Date() })
              .where(eq(users.id, user.id))
          }

          // Create trialing payment record. `stripeSessionId` must be
          // unique — using the subscription ID is stable and lets us
          // reconcile with the webhook later.
          const [payment] = await tx
            .insert(payments)
            .values({
              userId: user.id,
              stripeSessionId: `trial_sub_${subscription.id}`,
              stripeCustomerId: stripeCustomerId,
              stripeSubscriptionId: subscription.id,
              planId: plan.id,
              amount: finalAmount,
              currency: plan.currency || "usd",
              appliedPromoCode: promoCode || null,
              status: "trialing",
            })
            .returning()

          // Create order
          const [order] = await tx
            .insert(orders)
            .values({
              userId: user.id,
              paymentId: payment.id,
              planId: plan.id,
              licenseQuantity: licenseQuantity || 1,
              contactName:
                contactName || user.name || normalizedEmail.split("@")[0],
              status: "fulfilled",
            })
            .returning()

          // Create license — now backed by the real Stripe subscription.
          // Capture the returned id so we can fetch attached domains for
          // R2 refresh (a free-plan upgrade keeps the same license row).
          const [trialLicense] = await tx
            .insert(licenses)
            .values({
              userId: user.id,
              planId: plan.id,
              totalSlots: plan.slots * (licenseQuantity || 1),
              status: "trialing",
              sourceOrderId: order.id,
              isTrial: true,
              isLifetime: plan.mode === "lifetime",
              billingCycle: isYearly ? "yearly" : (plan.mode as any),
              trialEndsAt,
              nextRenewalDate: trialEndsAt,
              stripeSubscriptionId: subscription.id,
            })
            .onConflictDoUpdate({
              target: licenses.userId,
              set: {
                planId: plan.id,
                totalSlots: plan.slots * (licenseQuantity || 1),
                status: "trialing",
                sourceOrderId: order.id,
                isTrial: true,
                isLifetime: plan.mode === "lifetime",
                billingCycle: isYearly ? "yearly" : (plan.mode as any),
                trialEndsAt,
                nextRenewalDate: trialEndsAt,
                stripeSubscriptionId: subscription.id,
                cancelAtPeriodEnd: false,
                updatedAt: new Date(),
              },
            })
            .returning({ id: licenses.id })

          if (trialLicense) {
            const existingDomains = await tx
              .select({ domainName: domainsTable.domainName })
              .from(domainsTable)
              .where(
                and(
                  eq(domainsTable.licenseId, trialLicense.id),
                  isNull(domainsTable.deletedAt)
                )
              )
            for (const d of existingDomains) {
              directTrialDomainsToRefresh.push({
                domainName: d.domainName,
                userId: user.id,
              })
            }
          }

          await createAuditLog(
            user.id,
            "checkout.direct_trial_activated",
            "license",
            plan.id,
            {
              email: normalizedEmail,
              planId: plan.id,
              subscriptionId: subscription.id,
              trialEnd: subscription.trial_end,
            },
            tx
          )
        })

        // Refresh R2 JSON for any pre-existing domains so the public
        // license file reflects the new (Pro/trial) plan name. Without
        // this, a free-plan user starting a Pro trial keeps seeing
        // `plan_name: "Free"` at the public URL.
        for (const job of directTrialDomainsToRefresh) {
          await enqueueLicenseMetadataExportJob({
            domainName: job.domainName,
            userId: job.userId,
            action: "upsert",
          }).catch((err) => {
            console.error(
              `[checkout] Failed to enqueue R2 refresh for ${job.domainName} (direct trial):`,
              err
            )
          })
        }

        return NextResponse.json({ success: true })
      }

      // 2. Handle Paid Subscription Case
      if (isSubscription) {
        const productId = await getOrCreateProduct(stripe, plan.name)
        const discount = await resolvePromoCode(stripe, promoCode)
        const subscription = await stripe.subscriptions.create({
          customer: stripeCustomerId,
          items: [
            {
              price_data: {
                currency: plan.currency || "usd",
                product: productId,
                unit_amount: finalAmount,
                recurring: {
                  interval: isYearly ? "year" : "month",
                },
              },
            },
          ],
          default_payment_method: stripePaymentMethodId,
          payment_behavior: "allow_incomplete",
          expand: ["latest_invoice.payment_intent"],
          metadata,
          ...(discount ? { discounts: [discount as any] } : {}),
        })

        if (
          subscription.status === "active" ||
          subscription.status === "trialing"
        ) {
          return NextResponse.json({ success: true })
        } else {
          const paymentIntent = (subscription.latest_invoice as any)
            .payment_intent as any
          if (paymentIntent && paymentIntent.status === "requires_action") {
            return NextResponse.json({
              requiresAction: true,
              paymentIntentClientSecret: paymentIntent.client_secret,
            })
          }
          throw new Error(`Subscription failed: ${subscription.status}`)
        }
      } else {
        // Lifetime purchase
        const paymentIntent = await stripe.paymentIntents.create({
          amount: finalAmount,
          currency: plan.currency || "usd",
          customer: stripeCustomerId,
          payment_method: stripePaymentMethodId,
          confirm: true,
          off_session: true,
          metadata,
        })

        if (paymentIntent.status === "succeeded") {
          return NextResponse.json({ success: true })
        } else if (paymentIntent.status === "requires_action") {
          return NextResponse.json({
            requiresAction: true,
            paymentIntentClientSecret: paymentIntent.client_secret,
          })
        }
        throw new Error(`Payment failed: ${paymentIntent.status}`)
      }
    }

    const stripeSession = await createCheckoutSession({
      stripe,
      plan,
      isTrial,
      userEmail: email,
      contactName,
      licenseQuantity,
      domains,
      appUrl,
      isYearlyPlan: isYearly,
      stripePaymentMethodId,
      stripeCustomerId,
      finalAmount,
      address,
      promoCode: promoCode ?? undefined,
    })

    return NextResponse.json({ url: stripeSession.url })
  } catch (err) {
    console.error("Stripe checkout error:", err)
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    )
  }
}
