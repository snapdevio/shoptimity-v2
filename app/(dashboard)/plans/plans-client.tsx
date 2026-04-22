"use client"

import React, { useMemo, useState, useCallback } from "react"
import { redirect } from "next/navigation"
import { cn } from "@/lib/utils"
import { Check, X } from "lucide-react"
import { PricingSectionModern, PricingPlan } from "@/components/ui/pricing"

interface PricingClientProps {
  dbPlans: any[]
  groupedFeatures: any[]
  settings?: any
  redirectPath?: string
  isPublic?: boolean
}

function FeatureRow({
  name,
  plans,
  activePlans,
  highlight,
  dbPlans,
}: {
  name: string
  plans: any[]
  activePlans: any[]
  highlight?: boolean
  dbPlans: any[]
}) {
  return (
    <tr className="transition-colors hover:bg-slate-50/50">
      <td
        className={cn(
          "p-4 text-sm font-medium md:p-6",
          highlight ? "text-slate-900" : "text-slate-600"
        )}
      >
        <div className="flex items-center gap-2">
          {name}
          {highlight && (
            <span className="shrink-0 rounded-full bg-orange-100 px-2 py-0.5 text-[9px] font-bold tracking-tight text-orange-600 uppercase">
              Conversion Focus
            </span>
          )}
        </div>
      </td>
      {activePlans.map((activePlan) => {
        const tierPlanIds = dbPlans
          .filter((p) => p.name.toLowerCase() === activePlan.name.toLowerCase())
          .map((p) => p.id)

        const isEnabled = plans.some(
          (p) => tierPlanIds.includes(p.planId) && p.isEnabled
        )

        return (
          <td key={activePlan.id} className="p-4 text-center md:p-6">
            <div className="flex justify-center">
              {isEnabled ? (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-white shadow-sm">
                  <Check className="size-3.5 stroke-[3]" />
                </div>
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white shadow-sm">
                  <X className="size-3.5 stroke-[3]" />
                </div>
              )}
            </div>
          </td>
        )
      })}
    </tr>
  )
}

export function PlansClient({
  dbPlans,
  groupedFeatures,
  settings = {},
  redirectPath = "/plans",
  isPublic = false,
}: PricingClientProps) {
  const [billingCycle, setBillingCycle] = useState<
    "monthly" | "yearly" | "lifetime"
  >("monthly")

  const availableCycles = useMemo(() => {
    const cycles = new Set<string>()
    dbPlans.forEach((p) => {
      if (p.mode === "monthly") cycles.add("monthly")
      if (
        p.mode === "yearly" ||
        (p.mode === "monthly" && p.yearlyDiscount && p.yearlyDiscount > 0)
      )
        cycles.add("yearly")
      if (p.mode === "lifetime") cycles.add("lifetime")
    })
    return Array.from(cycles)
  }, [dbPlans])

  const groupedPlans = useMemo(() => {
    const groups: Record<string, any> = {}
    dbPlans.forEach((plan) => {
      if (!groups[plan.name]) {
        groups[plan.name] = {
          name: plan.name,
          monthly: null,
          yearly: null,
          free: null,
          lifetime: null,
        }
      }
      groups[plan.name][plan.mode] = plan
    })
    return Object.values(groups)
  }, [dbPlans])

  const filteredGroups = useMemo(() => {
    return groupedPlans.filter((group) => {
      if (billingCycle === "lifetime" && group.lifetime) return true
      if (
        billingCycle === "yearly" &&
        (group.yearly || (group.monthly && group.monthly.yearlyDiscount > 0))
      )
        return true
      if (billingCycle === "monthly" && group.monthly) return true
      if (group.free && group.free.finalPrice === 0) return true
      return false
    })
  }, [groupedPlans, billingCycle])

  const modernPlans: PricingPlan[] = useMemo(() => {
    return filteredGroups.map((group) => {
      let plan =
        billingCycle === "yearly"
          ? group.yearly
          : billingCycle === "lifetime"
            ? group.lifetime
            : group.monthly

      let isVirtualYearly = false
      if (
        billingCycle === "yearly" &&
        !plan &&
        group.monthly &&
        group.monthly.yearlyDiscount > 0
      ) {
        plan = group.monthly
        isVirtualYearly = true
      }

      const finalPlan = plan || group.free || group.lifetime

      let price = (finalPlan?.finalPrice || 0) / 100
      let yearlyPrice =
        (group.yearly?.finalPrice ||
          group.free?.finalPrice ||
          group.lifetime?.finalPrice ||
          0) / 100

      if (isVirtualYearly) {
        yearlyPrice = Math.round(price * (1 - finalPlan.yearlyDiscount / 100))
      }

      let description =
        group.name === "Starter"
          ? "Perfect for exploring Shoptimity."
          : "Premium features for growth."
      let badge
      if (group.monthly && (group.yearly || isVirtualYearly)) {
        const monthlyTotal = (group.monthly.finalPrice / 100) * 12
        let currentYearlyPrice
        let savingsPercent = 0
        if (isVirtualYearly) {
          currentYearlyPrice = yearlyPrice * 12
          savingsPercent = group.monthly.yearlyDiscount
        } else {
          currentYearlyPrice = group.yearly.finalPrice / 100
          savingsPercent = Math.round(
            ((monthlyTotal - currentYearlyPrice) / monthlyTotal) * 100
          )
        }
        const savingsAmount = Math.round(monthlyTotal - currentYearlyPrice)
        if (savingsAmount > 0 && billingCycle === "yearly") {
          badge = `Save $${savingsAmount}/year (${savingsPercent}%)`
        }
      }

      const modeDisplay: Record<string, string> = {
        monthly: "month",
        yearly: "year",
        free: "free",
        lifetime: "lifetime",
      }

      const tierFeatures =
        group.monthly?.features ||
        group.yearly?.features ||
        group.free?.features ||
        group.lifetime?.features ||
        []

      return {
        name: group.name,
        description,
        price,
        yearlyPrice,
        mode: isVirtualYearly
          ? "month"
          : modeDisplay[finalPlan?.mode as string] || finalPlan?.mode || "free",
        buttonText: finalPlan?.finalPrice === 0 ? "Get Started" : "Choose Plan",
        popular: group.name.toLowerCase().includes("pro"),
        badge,
        includes: Array.isArray(tierFeatures) ? tierFeatures : [],
        planBadge: finalPlan?.badge || badge,
      }
    })
  }, [filteredGroups, billingCycle])

  const handleAction = useCallback(
    async (planName: string, isYearlyAction: boolean) => {
      const group = groupedPlans.find(
        (g) => g.name.toLowerCase() === planName.toLowerCase()
      )
      let plan =
        billingCycle === "yearly"
          ? group?.yearly
          : billingCycle === "lifetime"
            ? group?.lifetime
            : group?.monthly

      let isVirtualYearly = false
      if (
        billingCycle === "yearly" &&
        !plan &&
        group?.monthly &&
        group.monthly.yearlyDiscount > 0
      ) {
        plan = group.monthly
        isVirtualYearly = true
      }

      const finalPlan = plan || group?.free || group?.lifetime

      const { authClient } = await import("@/lib/auth-client")
      const { data: session } = await authClient.getSession()

      if (!session) {
        redirect(`/login?redirect=${redirectPath}`)
      }

      if (isPublic) {
        redirect(redirectPath)
      }

      if (!finalPlan || finalPlan.finalPrice === 0) return

      const url = new URL(`/api/checkout`, window.location.origin)
      url.searchParams.set("planId", finalPlan.id)
      url.searchParams.set("quantity", finalPlan.slots.toString())
      if (isVirtualYearly) {
        url.searchParams.set("isYearly", "true")
      }
      redirect(url.toString())
    },
    [groupedPlans, billingCycle, redirectPath, isPublic]
  )

  const allTiersForTable = useMemo(() => {
    return groupedPlans
      .map((group) => {
        return group.free || group.lifetime || group.monthly || group.yearly
      })
      .filter(Boolean)
  }, [groupedPlans])

  const showSwitch = useMemo(() => {
    return availableCycles.length > 1
  }, [availableCycles])

  const maxYearlyDiscount = useMemo(() => {
    return dbPlans.reduce((max, p) => Math.max(max, p.yearlyDiscount || 0), 0)
  }, [dbPlans])

  return (
    <>
      {settings.enable_discount &&
        settings.coupon_code &&
        settings.discount_percent > 0 && (
          <div className="-mx-8 -mt-4 mb-8 bg-primary px-4 py-3 text-center md:-mx-6 md:-mt-6">
            <p className="font-sans text-sm font-bold tracking-wide text-white">
              Exclusive Launch Sale: Use Code{" "}
              <span className="cursor-pointer rounded border border-dashed border-white/30 bg-white/20 px-2 py-0.5 transition-all hover:bg-white/40 active:scale-95">
                {settings.coupon_code}
              </span>{" "}
              for an EXTRA {settings.discount_percent}% OFF!
            </p>
          </div>
        )}

      <PricingSectionModern
        plans={modernPlans}
        onAction={handleAction}
        billingCycle={billingCycle}
        onSwitch={(val: any) => setBillingCycle(val)}
        showSwitch={showSwitch}
        availableCycles={availableCycles}
        maxYearlyDiscount={maxYearlyDiscount}
      />

      <div className="mx-auto mt-32 max-w-6xl">
        <div className="mb-16 px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold lg:text-5xl">
            The Complete Shoptimity Toolkit
          </h2>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-500">
            Every single component, widget, and section designed to turn your
            visitors into customers.
          </p>
        </div>

        <div className="overflow-x-auto rounded-[32px] border border-slate-200 bg-white shadow-sm">
          <table className="w-full table-fixed border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="w-1/2 p-6 text-xs font-bold tracking-widest text-slate-400 uppercase">
                  Features & Components
                </th>
                {allTiersForTable.map((plan) => (
                  <th
                    key={plan.id}
                    className={cn(
                      "w-1/4 p-6 text-center font-bold",
                      plan.name.toLowerCase().includes("pro")
                        ? "bg-orange-50/30 text-orange-500"
                        : "text-slate-900"
                    )}
                  >
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {groupedFeatures.map((category) => (
                <React.Fragment key={category.id}>
                  <tr className="bg-slate-50/50">
                    <td
                      colSpan={1 + allTiersForTable.length}
                      className="border-t border-slate-200 px-6 py-4 text-xs font-bold tracking-wider text-slate-900 uppercase"
                    >
                      {category.name}
                    </td>
                  </tr>
                  {category.features.map((feature: any) => (
                    <FeatureRow
                      key={feature.id}
                      name={feature.name}
                      plans={feature.plans}
                      activePlans={allTiersForTable}
                      dbPlans={dbPlans}
                      highlight={feature.isHighlight}
                    />
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
