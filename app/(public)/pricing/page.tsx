import { Metadata } from "next"
import { getActivePlans } from "@/actions/admin-plans"
import { getGroupedFeatures } from "@/actions/admin-features"
import { getSettings } from "@/actions/admin-settings"
import { PricingPublicClient } from "./client"

export const metadata: Metadata = {
  title: "Pricing | Shoptimity",
  description:
    "Affordable, transparent pricing for high-converting Shopify store templates.",
}

export default async function PublicPricingPage() {
  const [dbPlans, groupedFeatures, settings] = await Promise.all([
    getActivePlans(),
    getGroupedFeatures(),
    getSettings(),
  ])

  return (
    <PricingPublicClient
      dbPlans={dbPlans}
      groupedFeatures={groupedFeatures}
      settings={settings || {}}
      redirectPath="/plans"
      isPublic={true}
    />
  )
}
