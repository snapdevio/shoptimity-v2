export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { eq, and, isNull, count, desc } from "drizzle-orm"

import { getAppSession } from "@/lib/auth-session"
import { db } from "@/db"
import { licenses, plans, domains, orders, payments } from "@/db/schema"
import { Metadata } from "next"
import { LicensesClient } from "./licenses-client"
import { VideoTutorialModal } from "./video-tutorial-modal"
import { getMetadata } from "@/lib/metadata"

export const metadata = getMetadata({
  title: "Licenses",
  description: "Manage your Shopify theme licenses and domain assignments.",
  pathname: "/licenses",
  robots: { index: false, follow: false },
})

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
      billingCycle: licenses.billingCycle,
      planMode: plans.mode,
      planFinalPrice: plans.finalPrice,
      planRegularPrice: plans.regularPrice,
      planYearlyDiscountPercentage: plans.yearlyDiscountPercentage,
      stripeInvoiceUrl: payments.stripeInvoiceUrl,
      amount: payments.amount,
      currency: payments.currency,
      planCurrency: plans.currency,
      paymentStatus: payments.status,
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

      // After an upgrade (e.g. monthly → yearly) the license's
      // `sourceOrderId` still points at the ORIGINAL signup payment, so the
      // initial join above returns the stale monthly amount/cycle. Resolve
      // the latest payment for this subscription so "Amount Paid" matches
      // what the user is actually being billed today.
      let latestPayment: typeof payments.$inferSelect | undefined
      if (license.stripeSubscriptionId) {
        ;[latestPayment] = await db
          .select()
          .from(payments)
          .where(
            eq(payments.stripeSubscriptionId, license.stripeSubscriptionId)
          )
          .orderBy(desc(payments.createdAt))
          .limit(1)
      }

      const effectiveAmount = latestPayment?.amount ?? license.amount
      const effectiveCurrency = latestPayment?.currency ?? license.currency
      const effectiveInvoiceUrl =
        latestPayment?.stripeInvoiceUrl ?? license.stripeInvoiceUrl
      const effectivePaymentStatus =
        latestPayment?.status ?? license.paymentStatus

      return {
        ...license,
        amount: effectiveAmount,
        currency: effectiveCurrency,
        stripeInvoiceUrl: effectiveInvoiceUrl,
        paymentStatus: effectivePaymentStatus,
        createdAt: license.createdAt.toISOString(),
        trialEndsAt: license.trialEndsAt?.toISOString() || null,
        domains: activeDomains.map((d) => ({
          ...d,
          createdAt: d.createdAt.toISOString(),
        })),
        usedSlots: activeDomainCount,
        displayAmount: (() => {
          // Match the billing page's "Subscription" column: always show
          // the plan-based regular charge so the two pages agree. Using
          // the latest payment amount drifts after upgrades because the
          // proration charge is smaller than the full yearly rate.
          let amt = license.planFinalPrice || 0
          if (
            license.billingCycle === "yearly" &&
            license.planMode === "monthly"
          ) {
            const discount = license.planYearlyDiscountPercentage || 0
            amt = amt * 12 * (1 - discount / 100)
          }
          return amt
        })(),
        displayCurrency: effectiveCurrency || license.planCurrency || "USD",
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
          {/* <VideoTutorialModal /> */}
        </div>
        <p className="text-sm text-muted-foreground">
          Manage your licenses and domain assignments.
        </p>
      </div>
      <LicensesClient licenses={licensesWithDomains} />
    </div>
  )
}
