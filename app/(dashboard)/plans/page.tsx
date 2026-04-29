export const dynamic = "force-dynamic"

import { Metadata } from "next"
import { getActivePlans } from "@/actions/admin-plans"
import { getGroupedFeatures } from "@/actions/admin-features"
import { getSettings } from "@/actions/admin-settings"
import { PlansClient } from "./plans-client"
import { getAppSession } from "@/lib/auth-session"
import { db } from "@/db"
import { licenses, plans, users } from "@/db/schema"
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
  let activePlanMode: string | undefined
  let activeBillingCycle: string | undefined
  let hasStripeSubscription = false
  let hasUsedTrial = false

  if (session) {
    const [activeLicense] = await db
      .select({
        planId: licenses.planId,
        planMode: plans.mode,
        billingCycle: licenses.billingCycle,
        stripeSubscriptionId: licenses.stripeSubscriptionId,
      })
      .from(licenses)
      .leftJoin(plans, eq(licenses.planId, plans.id))
      .where(
        and(eq(licenses.userId, session.userId), eq(licenses.status, "active"))
      )
      .limit(1)

    activePlanId = activeLicense?.planId || undefined
    activePlanMode = activeLicense?.planMode || undefined
    activeBillingCycle = activeLicense?.billingCycle || undefined
    hasStripeSubscription = !!activeLicense?.stripeSubscriptionId

    const [userTrialState] = await db
      .select({ hasUsedTrial: users.hasUsedTrial })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1)

    hasUsedTrial = !!userTrialState?.hasUsedTrial
  }

  return (
    <PlansClient
      dbPlans={dbPlans}
      groupedFeatures={groupedFeatures}
      settings={settings || {}}
      activePlanId={activePlanId}
      activePlanMode={activePlanMode}
      activeBillingCycle={activeBillingCycle}
      hasStripeSubscription={hasStripeSubscription}
      hasUsedTrial={hasUsedTrial}
    />
  )
}
