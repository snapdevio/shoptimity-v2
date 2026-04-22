export const dynamic = "force-dynamic"

import { Metadata } from "next"
import { getActivePlans } from "@/actions/admin-plans"
import { getGroupedFeatures } from "@/actions/admin-features"
import { getSettings } from "@/actions/admin-settings"
import { PlansClient } from "./plans-client"

export const metadata: Metadata = {
  title: "Upgrade Plans | Shoptimity",
  description:
    "Choose the best plan for your business. Affordable pricing for Shoptimity Shopify theme licenses.",
  robots: {
    index: false,
    follow: false,
  },
}

export default async function PlansPage() {
  const [dbPlans, groupedFeatures, settings] = await Promise.all([
    getActivePlans(),
    getGroupedFeatures(),
    getSettings(),
  ])

  return (
    <PlansClient
      dbPlans={dbPlans}
      groupedFeatures={groupedFeatures}
      settings={settings || {}}
      // redirectPath="/plans"
    />
  )
}
