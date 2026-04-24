export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { eq, and, isNull, count, desc } from "drizzle-orm"

import { getAppSession } from "@/lib/auth-session"
import { db } from "@/db"
import { licenses, plans, domains, orders, payments } from "@/db/schema"
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
      planMode: plans.mode,
      stripeInvoiceUrl: payments.stripeInvoiceUrl,
      amount: payments.amount,
      currency: payments.currency,
    })
    .from(licenses)
    .innerJoin(plans, eq(licenses.planId, plans.id))
    .leftJoin(orders, eq(licenses.sourceOrderId, orders.id))
    .leftJoin(payments, eq(orders.paymentId, payments.id))
    .where(eq(licenses.userId, session.userId))
    .orderBy(desc(licenses.createdAt))
    .then((rows) => {
      // Deduplicate by license ID just in case join produced duplicates
      const seen = new Set()
      return rows.filter((row) => {
        if (seen.has(row.id)) return false
        seen.add(row.id)
        return true
      })
    })

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
