import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getActivePlans } from "@/actions/admin-plans"
import { CheckoutClient } from "./checkout-client"
import { getAppSession } from "@/lib/auth-session"

export const metadata: Metadata = {
  title: "Checkout | Shoptimity",
  description: "Complete your purchase and start using Shoptimity today.",
  robots: {
    index: false,
    follow: false,
  },
}

interface CheckoutPageProps {
  searchParams: Promise<Record<string, string | undefined>>
}

export default async function CheckoutPage({
  searchParams,
}: CheckoutPageProps) {
  const params = await searchParams
  const planId = params["planId"]
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
