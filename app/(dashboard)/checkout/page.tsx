import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getActivePlans } from "@/actions/admin-plans"
import { CheckoutClient } from "./checkout-client"
import { getAppSession } from "@/lib/auth-session"
import { db } from "@/db"
import { licenses } from "@/db/schema"
import { and, eq, or, isNotNull } from "drizzle-orm"
import { getMetadata } from "@/lib/metadata"

export const metadata = getMetadata({
  title: "Checkout",
  description: "Complete your purchase and start using Shoptimity today.",
  pathname: "/checkout",
  robots: { index: false, follow: false },
})

interface CheckoutPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function CheckoutPage({
  searchParams,
}: CheckoutPageProps) {
  const params = await searchParams
  const planId = params["planId"] as string | undefined
  // Single flag — matches ?isyearly=true or ?isYearly=true (case-insensitive)
  const isYearly = Object.entries(params).some(
    ([k, v]) => k.toLowerCase() === "isyearly" && v === "true"
  )

  if (!planId) {
    redirect("/plans")
  }

  const allPlans = await getActivePlans()

  // Cast to the type expected by CheckoutClient
  const formattedPlans = allPlans.map((p) => ({
    id: p.id,
    name: p.name,
    mode: p.mode,
    slots: p.slots,
    regularPrice: p.regularPrice,
    finalPrice: p.finalPrice,
    currency: p.currency,
    yearlyDiscountPercentage: p.yearlyDiscountPercentage,
    yearlyDiscountCouponCode: p.yearlyDiscountCouponCode,
    couponCode: p.couponCode,
    stripePaymentLink: p.stripePaymentLink,
    trialDays: p.trialDays,
  }))

  let initialPlan = formattedPlans.find((p) => p.id === planId)
  const session = await getAppSession()

  if (!session) {
    redirect(
      `/login?redirect=/checkout?planId=${planId}${isYearly ? "&isyearly=true" : ""}`
    )
  }

  if (!initialPlan) {
    redirect("/plans")
  }

  // Block free plan activation for users who already have an active paid
  // subscription. They must use the cancel flow on the billing page instead
  // of navigating directly to a free plan checkout URL.
  if (initialPlan!.finalPrice === 0) {
    const [activePaidLicense] = await db
      .select({ id: licenses.id })
      .from(licenses)
      .where(
        and(
          eq(licenses.userId, session!.userId),
          or(eq(licenses.status, "active"), eq(licenses.status, "trialing")),
          isNotNull(licenses.stripeSubscriptionId)
        )
      )
      .limit(1)

    if (activePaidLicense) {
      redirect("/billing")
    }
  }

  // If yearly is requested but the planId points to a monthly plan,
  // swap to the corresponding yearly plan so both radio buttons render
  if (isYearly && initialPlan!.mode === "monthly") {
    const yearlyVariant = formattedPlans.find(
      (p) => p.name === initialPlan!.name && p.mode === "yearly"
    )
    if (yearlyVariant) initialPlan = yearlyVariant
  }

  const initialName = session
    ? session.firstName && session.lastName
      ? `${session.firstName} ${session.lastName}`
      : session.name || ""
    : ""

  return (
    <CheckoutClient
      initialPlan={initialPlan as any}
      allPlans={formattedPlans as any}
      initialEmail={session?.email || ""}
      initialName={initialName}
      initialIsYearly={isYearly}
    />
  )
}
