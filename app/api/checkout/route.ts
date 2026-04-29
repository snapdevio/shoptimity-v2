import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { db } from "@/db"
import { licenses, plans, users, payments, orders } from "@/db/schema"
import { and, eq } from "drizzle-orm"
import { z } from "zod"
import { createAuditLog } from "@/lib/audit"
import { getAppSession } from "@/lib/auth-session"

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
    type: isTrial
      ? "trial_setup"
      : plan.mode === "monthly" || plan.mode === "yearly"
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

  return await stripe.checkout.sessions.create({
    customer: stripeCustomerId || undefined,
    customer_email: stripeCustomerId ? undefined : userEmail || undefined,
    ...(!stripeCustomerId && plan.mode === "lifetime" && !isTrial
      ? { customer_creation: "always" }
      : {}),
    metadata,
    ...(isTrial
      ? {
          mode: "setup",
          currency: plan.currency || "usd",
          setup_intent_data: {
            metadata,
          },
          custom_text: {
            submit: {
              message: `You're starting a ${plan.trialDays}-day free trial for the ${plan.name} plan. Your card will NOT be charged today. You will be automatically charged $${(finalAmount / 100).toFixed(2)} after ${plan.trialDays} days unless you cancel.`,
            },
          },
        }
      : isSubscription
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
              ...(stripePaymentMethodId
                ? { default_payment_method: stripePaymentMethodId }
                : {}),
            },
            ...(discount
              ? { discounts: [discount] }
              : { allow_promotion_codes: true }),
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

  // Check trial eligibility if logged in
  let isTrialEligible = plan.trialDays > 0

  if (session && isTrialEligible) {
    const existingLicenses = await db
      .select({ id: licenses.id, isTrial: licenses.isTrial })
      .from(licenses)
      .where(
        and(eq(licenses.userId, session.userId), eq(licenses.planId, planId))
      )
      .limit(1)

    if (existingLicenses.length > 0) {
      // User already had/has a license for this plan
      isTrialEligible = false
    }
  }

  const domain = searchParams.get("domain")
  const domains = domain ? [domain] : undefined

  try {
    // Free plan — skip Stripe, fulfill directly and redirect to /licenses
    if (plan.finalPrice === 0) {
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

      return NextResponse.redirect(new URL("/licenses", request.url))
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

export async function POST(request: NextRequest) {
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
    email,
    contactName,
    planId,
    licenseQuantity,
    domains,
    isYearly,
    paymentCardId,
    address,
    promoCode,
  } = parsed.data

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

  // Find user by email if possible to check trial history
  let isTrialEligible = plan.trialDays > 0
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (existingUser && isTrialEligible) {
    const existingLicenses = await db
      .select({ id: licenses.id })
      .from(licenses)
      .where(
        and(eq(licenses.userId, existingUser.id), eq(licenses.planId, planId))
      )
      .limit(1)

    if (existingLicenses.length > 0) {
      isTrialEligible = false
    }
  }

  // Resolve session + stripeCustomerId up front
  const session = await getAppSession()
  let stripeCustomerId: string | undefined
  if (session) {
    const [user] = await db
      .select({ stripeCustomerId: users.stripeCustomerId })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1)
    stripeCustomerId = user?.stripeCustomerId || undefined
  }

  // Handle Free Plan Fulfillment FIRST — no Stripe calls required.
  // Doing this before stripe.customers.update() avoids Stripe errors
  // (e.g. test/live customer mismatches) blocking free activation.
  if (plan.finalPrice === 0) {
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

    // Sync address to Stripe Customer if possible
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
      type: isTrial
        ? "trial_setup"
        : plan.mode === "monthly" || plan.mode === "yearly"
          ? "subscription"
          : "lifetime_purchase",
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
      // 1. Handle Trial Case (No immediate charge)
      if (isTrial) {
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
                name: contactName || normalizedEmail.split("@")[0],
                email: normalizedEmail,
                emailVerified: true,
                stripeCustomerId: stripeCustomerId,
              })
              .returning()
          }

          // Create trialing payment record
          const [payment] = await tx
            .insert(payments)
            .values({
              userId: user.id,
              stripeSessionId: `direct_trial_${Date.now()}`,
              stripeCustomerId: stripeCustomerId,
              amount: finalAmount,
              currency: plan.currency || "usd",
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

          // Create license
          await tx
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
              trialEndsAt: new Date(Date.now() + plan.trialDays * 86400000),
              stripeSubscriptionId: stripePaymentMethodId, // Store the payment method for the worker
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
                trialEndsAt: new Date(Date.now() + plan.trialDays * 86400000),
                stripeSubscriptionId: stripePaymentMethodId,
                updatedAt: new Date(),
              },
            })

          await createAuditLog(
            user.id,
            "checkout.direct_trial_activated",
            "license",
            plan.id,
            { email: normalizedEmail, planId: plan.id },
            tx
          )
        })

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
