export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { eq, and, isNull, count } from "drizzle-orm"

import { getAppSession } from "@/lib/auth-session"
import { db } from "@/db"
import { licenses, plans, domains } from "@/db/schema"
import { Metadata } from "next"
import { LicensesClient } from "./licenses-client"
import { VideoTutorialModal } from "./video-tutorial-modal"

export const metadata: Metadata = {
  title: "Licenses | Shoptimity",
  description: "Manage your Shopify theme licenses and domain assignments.",
  alternates: {
    canonical: "https://shoptimity.com/licenses",
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default async function LicensesPage() {
  const session = await getAppSession()
  if (!session) redirect("/login")

  const userLicenses = await db
    .select({
      id: licenses.id,
      status: licenses.status,
      totalSlots: licenses.totalSlots,
      createdAt: licenses.createdAt,
      planName: plans.name,
      isTrial: licenses.isTrial,
      trialEndsAt: licenses.trialEndsAt,
      stripeSubscriptionId: licenses.stripeSubscriptionId,
      isLifetime: licenses.isLifetime,
    })
    .from(licenses)
    .innerJoin(plans, eq(licenses.planId, plans.id))
    .where(eq(licenses.userId, session.userId))
    .orderBy(licenses.createdAt)

  const licensesWithDomains = await Promise.all(
    userLicenses.map(async (license) => {
      const activeDomains = await db
        .select({
          id: domains.id,
          domainName: domains.domainName,
          createdAt: domains.createdAt,
        })
        .from(domains)
        .where(
          and(eq(domains.licenseId, license.id), isNull(domains.deletedAt))
        )
        .orderBy(domains.createdAt)

      const [{ value: activeDomainCount }] = await db
        .select({ value: count() })
        .from(domains)
        .where(
          and(eq(domains.licenseId, license.id), isNull(domains.deletedAt))
        )

      return {
        ...license,
        createdAt: license.createdAt.toISOString(),
        trialEndsAt: license.trialEndsAt?.toISOString() || null,
        domains: activeDomains.map((d) => ({
          ...d,
          createdAt: d.createdAt.toISOString(),
        })),
        usedSlots: activeDomainCount,
      }
    })
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Licenses
          </h1>
          <VideoTutorialModal />
        </div>
        <p className="text-sm text-muted-foreground">
          Manage your licenses and domain assignments.
        </p>
      </div>
      <LicensesClient licenses={licensesWithDomains} />
    </div>
  )
}
