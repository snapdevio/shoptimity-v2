import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getActivePlans } from "@/actions/admin-plans"
import { CheckoutClient } from "./checkout-client"

export const metadata: Metadata = {
  title: "Checkout | Shoptimity",
  description: "Complete your purchase and start using Shoptimity today.",
  robots: {
    index: false,
    follow: false,
  },
}

interface CheckoutPageProps {
  searchParams: Promise<{
    planId?: string
  }>
}

export default async function CheckoutPage({
  searchParams,
}: CheckoutPageProps) {
  const { planId } = await searchParams

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
    yearlyDiscount: p.yearlyDiscount,
    stripePaymentLink: p.stripePaymentLink,
  }))

  const initialPlan = formattedPlans.find((p) => p.id === planId)

  if (!initialPlan) {
    // If the specific planId is not found (maybe it was deactivated),
    // try to find any plan with that name or redirect
    redirect("/plans")
  }

  return (
    <CheckoutClient
      initialPlan={initialPlan as any}
      allPlans={formattedPlans as any}
    />
  )
}
