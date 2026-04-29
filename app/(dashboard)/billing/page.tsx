import { getAppSession } from "@/lib/auth-session"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { licenses, plans, users } from "@/db/schema"
import { and, eq, desc, or, count } from "drizzle-orm"
import { BillingClient } from "./billing-client"
import { getStripe } from "@/lib/stripe"
import { payments as paymentsTable } from "@/db/schema"

const BILLING_HISTORY_PAGE_SIZE = 10

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const session = await getAppSession()
  if (!session) {
    redirect("/login?redirect=/billing")
  }

  const params = await searchParams
  const requestedPage = Math.max(1, parseInt(params.page ?? "1", 10) || 1)

  // Fetch user to get stripeCustomerId
  const [userRecord] = await db
    .select({ stripeCustomerId: users.stripeCustomerId })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1)

  let cards: any[] = []
  let defaultPaymentMethodId: string | null = null
  let initialBillingInfo = {
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    company: "",
  }

  if (userRecord?.stripeCustomerId) {
    const stripe = getStripe()
    const [customer, paymentMethods] = await Promise.all([
      stripe.customers.retrieve(userRecord.stripeCustomerId),
      stripe.paymentMethods.list({
        customer: userRecord.stripeCustomerId,
        type: "card",
      }),
    ])

    if (!customer.deleted) {
      const c = customer as any
      defaultPaymentMethodId =
        (c.invoice_settings?.default_payment_method as string) || null
      initialBillingInfo = {
        line1: c.address?.line1 || "",
        line2: c.address?.line2 || "",
        city: c.address?.city || "",
        state: c.address?.state || "",
        postalCode: c.address?.postal_code || "",
        country: c.address?.country || "",
        company: c.metadata?.company || "",
      }
    }

    cards = paymentMethods.data.map((pm) => ({
      id: pm.id,
      last4: pm.card?.last4 || "****",
      brand: pm.card?.brand || "unknown",
      cardExpMonth: pm.card?.exp_month || 0,
      cardExpYear: pm.card?.exp_year || 0,
      cardholderName: pm.billing_details.name,
      isDefault: pm.id === defaultPaymentMethodId,
    }))
  }

  // Fetch active license and plan
  const [activeLicense] = await db
    .select({
      id: licenses.id,
      status: licenses.status,
      plan: {
        name: plans.name,
        finalPrice: plans.finalPrice,
        mode: plans.mode,
        yearlyDiscountPercentage: plans.yearlyDiscountPercentage,
      },
      billingCycle: licenses.billingCycle,
      stripeSubscriptionId: licenses.stripeSubscriptionId,
      trialEndsAt: licenses.trialEndsAt,
      nextRenewalDate: licenses.nextRenewalDate,
      cancelAtPeriodEnd: licenses.cancelAtPeriodEnd,
    })
    .from(licenses)
    .leftJoin(plans, eq(licenses.planId, plans.id))
    .where(
      and(
        eq(licenses.userId, session.userId),
        or(eq(licenses.status, "active"), eq(licenses.status, "trialing"))
      )
    )
    .limit(1)

  // Total payment count for pagination
  const [{ value: totalPayments }] = await db
    .select({ value: count() })
    .from(paymentsTable)
    .where(eq(paymentsTable.userId, session.userId))

  const totalPages = Math.max(
    1,
    Math.ceil(totalPayments / BILLING_HISTORY_PAGE_SIZE)
  )
  const currentPage = Math.min(requestedPage, totalPages)

  // Fetch the requested page of payment history with plan details
  const userPayments = await db
    .select({
      id: paymentsTable.id,
      amount: paymentsTable.amount,
      currency: paymentsTable.currency,
      status: paymentsTable.status,
      stripeInvoiceUrl: paymentsTable.stripeInvoiceUrl,
      createdAt: paymentsTable.createdAt,
      appliedPromoCode: paymentsTable.appliedPromoCode,
      planName: plans.name,
    })
    .from(paymentsTable)
    .leftJoin(plans, eq(paymentsTable.planId, plans.id))
    .where(eq(paymentsTable.userId, session.userId))
    .orderBy(desc(paymentsTable.createdAt))
    .limit(BILLING_HISTORY_PAGE_SIZE)
    .offset((currentPage - 1) * BILLING_HISTORY_PAGE_SIZE)

  // Fetch Next Payment Date. Stripe is the source of truth for active
  // subscriptions; we only fall back to the DB column when no subscription
  // is queryable (e.g., free plans, or Stripe call failed).
  let nextPaymentDate: number | null = null

  if (activeLicense?.status === "trialing" && activeLicense.trialEndsAt) {
    nextPaymentDate = Math.floor(
      new Date(activeLicense.trialEndsAt).getTime() / 1000
    )
  }

  // Pull live data from Stripe (subscription) for the renewal date AND
  // the currently-applied retention discount so the Plan Details card can
  // show "50% off for next N months" with an accurate next-charge amount.
  let activeDiscount: {
    percentOff: number | null
    amountOff: number | null
    durationType: string | null
    durationInMonths: number | null
    endsAt: number | null
    remainingCycles: number | null
    discountedNextAmount: number | null
  } | null = null

  if (activeLicense?.stripeSubscriptionId) {
    const stripe = getStripe()
    try {
      const subscription = await stripe.subscriptions.retrieve(
        activeLicense.stripeSubscriptionId,
        { expand: ["discounts.coupon"] }
      )

      // For non-trial subs, prefer Stripe's period end over the DB value —
      // the DB column can drift if the subscription is changed via Stripe
      // dashboard or external flows.
      if (activeLicense.status !== "trialing") {
        const subAny = subscription as any
        const periodEnd =
          subscription.items.data[0]?.current_period_end ??
          subAny.current_period_end
        if (periodEnd) nextPaymentDate = periodEnd as number
      }

      // Discount lookup: prefer `subscription.discounts` (newer API), fall
      // back to the legacy singular `subscription.discount`. Each entry can
      // be a string ID (when expand didn't materialize the object) or a
      // full Discount with the coupon expanded.
      const subAnyForDisc = subscription as any
      const discountsRaw: any[] = Array.isArray(subAnyForDisc.discounts)
        ? subAnyForDisc.discounts
        : subAnyForDisc.discount
          ? [subAnyForDisc.discount]
          : []
      const activeDiscountRaw = discountsRaw.find(
        (d) => typeof d !== "string" && d?.coupon
      )

      if (activeDiscountRaw) {
        const coupon = activeDiscountRaw.coupon
        const endsAt = (activeDiscountRaw.end as number | null) ?? null
        const isYearly = activeLicense.billingCycle === "yearly"
        const cycleSeconds = isYearly ? 365 * 86400 : 30 * 86400

        let remainingCycles: number | null = null
        if (coupon.duration === "forever") {
          remainingCycles = null // unbounded
        } else if (coupon.duration === "once") {
          remainingCycles = 1
        } else if (coupon.duration === "repeating") {
          if (endsAt) {
            const secondsLeft = endsAt - Math.floor(Date.now() / 1000)
            remainingCycles = Math.max(0, Math.ceil(secondsLeft / cycleSeconds))
          } else if (coupon.duration_in_months) {
            // Fallback: derive from the coupon's configured months
            remainingCycles = isYearly
              ? Math.max(1, Math.ceil(coupon.duration_in_months / 12))
              : coupon.duration_in_months
          }
        }

        // Compute the discounted next payment amount based on the unit_amount
        const unitAmount = subscription.items.data[0]?.price?.unit_amount ?? 0
        let discountedNextAmount: number | null = null
        if (coupon.percent_off != null) {
          discountedNextAmount = Math.round(
            unitAmount * (1 - coupon.percent_off / 100)
          )
        } else if (coupon.amount_off != null) {
          discountedNextAmount = Math.max(0, unitAmount - coupon.amount_off)
        }

        activeDiscount = {
          percentOff: coupon.percent_off ?? null,
          amountOff: coupon.amount_off ?? null,
          durationType: coupon.duration ?? null,
          durationInMonths: coupon.duration_in_months ?? null,
          endsAt,
          remainingCycles,
          discountedNextAmount,
        }
      }
    } catch (err) {
      console.error(
        "[billing/page] Failed to fetch subscription for renewal/discount:",
        err
      )
    }
  }

  // Fall back to the DB-stored renewal date when Stripe didn't give us one
  // (no subscription, or the retrieve call failed above).
  if (!nextPaymentDate && activeLicense?.nextRenewalDate) {
    nextPaymentDate = Math.floor(
      new Date(activeLicense.nextRenewalDate).getTime() / 1000
    )
  }

  return (
    <BillingClient
      initialCards={cards}
      activeLicense={activeLicense}
      initialBillingInfo={initialBillingInfo}
      userPayments={userPayments}
      nextPaymentDate={nextPaymentDate}
      activeDiscount={activeDiscount}
      paymentsPagination={{
        currentPage,
        totalPages,
        totalCount: totalPayments,
        pageSize: BILLING_HISTORY_PAGE_SIZE,
      }}
    />
  )
}
