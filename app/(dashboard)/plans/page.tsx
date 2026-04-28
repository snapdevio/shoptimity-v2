export const dynamic = "force-dynamic"

import { Metadata } from "next"
import { getActivePlans } from "@/actions/admin-plans"
import { getGroupedFeatures } from "@/actions/admin-features"
import { getSettings } from "@/actions/admin-settings"
import { PlansClient } from "./plans-client"
import { getAppSession } from "@/lib/auth-session"
import { db } from "@/db"
import { licenses } from "@/db/schema"
import { eq, and } from "drizzle-orm"

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

  const session = await getAppSession()
  let activePlanId: string | undefined

  if (session) {
    const [activeLicense] = await db
      .select({ planId: licenses.planId })
      .from(licenses)
      .where(
        and(eq(licenses.userId, session.userId), eq(licenses.status, "active"))
      )
      .limit(1)

    activePlanId = activeLicense?.planId || undefined
  }

  return (
    <PlansClient
      dbPlans={dbPlans}
      groupedFeatures={groupedFeatures}
      settings={settings || {}}
      activePlanId={activePlanId}
    />
  )
}
