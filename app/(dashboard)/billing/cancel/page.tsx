import { getAppSession } from "@/lib/auth-session"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { licenses, plans } from "@/db/schema"
import { and, eq, or } from "drizzle-orm"
import { CancelClient } from "./cancel-client"
import { getSettings } from "@/actions/admin-settings"
import { getStripe, resolveCouponDetails } from "@/lib/stripe"

export default async function CancelPlanPage() {
  const session = await getAppSession()
  if (!session) {
    redirect("/login?redirect=/billing/cancel")
  }

  // Fetch global settings for general config (timeout only)
  const { cancel_offer_timeout } = (await getSettings()) as any

  // Fetch active or trialing license and plan
  const [activeLicense] = await db
    .select({
      id: licenses.id,
      billingCycle: licenses.billingCycle,
      retentionDiscountUsed: licenses.retentionDiscountUsed,
      plan: {
        id: plans.id,
        name: plans.name,
        mode: plans.mode,
        finalPrice: plans.finalPrice,
        monthlyCancelDiscount: plans.monthlyCancelDiscount,
        yearlyCancelDiscount: plans.yearlyCancelDiscount,
        cancelApplyDiscount: plans.cancelApplyDiscount,
        monthlyCancelDuration: plans.monthlyCancelDuration,
        yearlyCancelDuration: plans.yearlyCancelDuration,
        monthlyCancelCouponCode: plans.monthlyCancelCouponCode,
        yearlyCancelCouponCode: plans.yearlyCancelCouponCode,
        yearlyDiscountPercentage: plans.yearlyDiscountPercentage,
      },
      stripeSubscriptionId: licenses.stripeSubscriptionId,
      status: licenses.status,
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

  // Redirect if no license, no subscription ID, or it's a non-cancellable plan (free/lifetime)
  if (
    !activeLicense ||
    !activeLicense.stripeSubscriptionId ||
    activeLicense.plan?.mode === "free" ||
    activeLicense.plan?.mode === "lifetime"
  ) {
    redirect("/billing?error=no_subscription")
  }

  const plan = activeLicense.plan

  const couponCode =
    activeLicense.billingCycle === "yearly"
      ? plan?.yearlyCancelCouponCode
      : plan?.monthlyCancelCouponCode

  // Stripe's coupon is the source of truth for what will actually be applied.
  // The plan record's `monthlyCancelDiscount` / `yearlyCancelDiscount` and
  // `*CancelDuration` columns can drift from the coupon's real terms (e.g.
  // admin saved 50% on the plan but linked a 30%-off coupon in Stripe). If
  // we promised the DB number on the offer screen, the user would later see
  // the smaller Stripe-applied discount on /billing and feel cheated. So we
  // resolve the coupon up front and use ITS percent_off / duration_in_months
  // for everything the user sees, falling back to the DB plan only when the
  // coupon can't be looked up.
  const stripe = getStripe()
  const couponDetails = await resolveCouponDetails(stripe, couponCode)

  const planDiscountPercent =
    activeLicense.billingCycle === "yearly"
      ? (plan?.yearlyCancelDiscount ?? 0)
      : (plan?.monthlyCancelDiscount ?? 0)

  const planDiscountDuration =
    activeLicense.billingCycle === "yearly"
      ? (plan?.yearlyCancelDuration ?? 1)
      : (plan?.monthlyCancelDuration ?? 3)

  const discountPercent =
    couponDetails?.percentOff != null
      ? Math.round(couponDetails.percentOff)
      : planDiscountPercent

  // Coupon `duration_in_months` is always in months. Convert to the cycle
  // unit the offer copy uses (`years` for yearly billing, `months` for
  // monthly). `forever` and `once` coupons don't carry a month count, so
  // we approximate from the plan's stored duration in those cases.
  let discountDuration = planDiscountDuration
  if (couponDetails) {
    if (
      couponDetails.durationType === "repeating" &&
      couponDetails.durationInMonths
    ) {
      discountDuration =
        activeLicense.billingCycle === "yearly"
          ? Math.max(1, Math.ceil(couponDetails.durationInMonths / 12))
          : couponDetails.durationInMonths
    } else if (couponDetails.durationType === "once") {
      discountDuration = 1
    }
    // `forever` keeps the plan's value (UI also reads durationType to render
    // "every renewal" copy when needed; a numeric value is still required
    // by the existing client interface).
  }

  // Retention offer is only meaningful for real Stripe subscriptions
  // (`sub_*`). Trial licenses store a `pm_*` / `seti_*` placeholder in
  // stripeSubscriptionId until the metadata-worker converts them — calling
  // `stripe.subscriptions.update(pm_…)` would 404, and there's no recurring
  // charge to discount yet anyway. Trial users still see the cancel-reasons
  // step; they just skip the "stay for X% off" offer.
  const hasRealSubscription =
    !!activeLicense.stripeSubscriptionId &&
    activeLicense.stripeSubscriptionId.startsWith("sub_")

  // Offer eligibility is plan-driven, not license-state-driven. We do NOT
  // check `retentionDiscountUsed` / `retentionDiscountEndsAt` here — if the
  // admin has the plan configured to extend a retention offer at cancel,
  // every cancel attempt should surface it. Re-claiming overwrites the
  // existing coupon on the Stripe subscription via `subscriptions.update`,
  // so there's no stacking risk.
  const showDiscountOffer =
    hasRealSubscription &&
    plan?.cancelApplyDiscount &&
    // !activeLicense.retentionDiscountUsed &&
    discountPercent > 0

  // Calculate the full price for the current billing cycle
  let price = plan?.finalPrice || 0

  // If the user is on a yearly cycle but the plan entry is monthly,
  // we calculate the yearly total (monthly price * 12)
  if (activeLicense.billingCycle === "yearly" && plan?.mode === "monthly") {
    price = price * 12
  }

  return (
    <CancelClient
      licenseId={activeLicense.id}
      subscriptionId={activeLicense.stripeSubscriptionId}
      discountPercent={discountPercent}
      discountDuration={discountDuration}
      billingCycle={activeLicense.billingCycle as "monthly" | "yearly"}
      planName={plan?.name || "Pro"}
      price={price}
      showOfferInitial={showDiscountOffer}
      offerTimeoutSeconds={cancel_offer_timeout ?? 300}
      couponCode={couponCode}
    />
  )
}
