import { getAppSession } from "@/lib/auth-session"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { licenses, plans } from "@/db/schema"
import { and, eq, or } from "drizzle-orm"
import { CancelClient } from "./cancel-client"
import { getSettings } from "@/actions/admin-settings"

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

  // Use plan-specific settings only
  const discountPercent =
    activeLicense.billingCycle === "yearly"
      ? (plan?.yearlyCancelDiscount ?? 0)
      : (plan?.monthlyCancelDiscount ?? 0)

  const discountDuration =
    activeLicense.billingCycle === "yearly"
      ? (plan?.yearlyCancelDuration ?? 1)
      : (plan?.monthlyCancelDuration ?? 3)

  const showDiscountOffer =
    plan?.cancelApplyDiscount &&
    !activeLicense.retentionDiscountUsed &&
    discountPercent > 0

  // Calculate the full price for the current billing cycle
  let price = plan?.finalPrice || 0
  
  // If the user is on a yearly cycle but the plan entry is monthly, 
  // we calculate the yearly total (monthly price * 12)
  if (activeLicense.billingCycle === "yearly" && plan?.mode === "monthly") {
    price = price * 12
  }

  const couponCode =
    activeLicense.billingCycle === "yearly"
      ? plan?.yearlyCancelCouponCode
      : plan?.monthlyCancelCouponCode

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
