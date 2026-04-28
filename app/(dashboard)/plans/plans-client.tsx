"use client"

import React, { useMemo, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Check, X } from "lucide-react"
import { PricingSectionModern, PricingPlan } from "@/components/ui/pricing"
import { toast } from "sonner"

interface PricingClientProps {
  dbPlans: any[]
  groupedFeatures: any[]
  settings?: any
  redirectPath?: string
  isPublic?: boolean
  activePlanId?: string
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
          "p-3 text-sm font-medium md:p-6",
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
          <td key={activePlan.id} className="p-3 text-center md:p-6">
            <div className="flex justify-center">
              {isEnabled ? (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-white shadow-sm">
                  <Check className="size-3.5 stroke-3" />
                </div>
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white shadow-sm">
                  <X className="size-3.5 stroke-3" />
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
  activePlanId,
}: PricingClientProps) {
  const router = useRouter()
  const [billingCycle, setBillingCycle] = useState<
    "monthly" | "yearly" | "lifetime"
  >("yearly")
  const [loadingPlanName, setLoadingPlanName] = useState<string | null>(null)

  const availableCycles = useMemo(() => {
    const cycles = new Set<string>()
    dbPlans.forEach((p) => {
      if (p.mode === "monthly") cycles.add("monthly")
      if (
        p.mode === "yearly" ||
        (p.mode === "monthly" && p.hasYearlyPlan)
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
      if (group.monthly || group.yearly || group.free || group.lifetime)
        return true
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
        group.monthly.hasYearlyPlan
      ) {
        plan = group.monthly
        isVirtualYearly = true
      }

      const finalPlan = plan || group.free || group.lifetime

      let price = (finalPlan?.finalPrice || 0) / 100
      let originalPrice = (finalPlan?.regularPrice || 0) / 100
      let yearlyPrice =
        (group.yearly?.finalPrice ||
          group.lifetime?.finalPrice ||
          0) / 100
      
      // Fallback for monthly plans in yearly view
      if (billingCycle === "yearly" && !group.yearly && !isVirtualYearly && group.monthly) {
        yearlyPrice = (group.monthly.finalPrice / 100)
      }

      if (isVirtualYearly) {
        originalPrice = price * 12
        yearlyPrice = Math.round(
          price * (1 - (finalPlan.yearlyDiscountPercentage || 0) / 100) * 12
        )
      }

      // Only show originalPrice if it's different from the display price
      const displayPrice = billingCycle === "yearly" ? yearlyPrice : price
      const finalOriginalPrice =
        billingCycle === "yearly" ? originalPrice : (originalPrice > displayPrice ? originalPrice : undefined)

      let description =
        group.name === "Free"
          ? "Perfect for exploring Shoptimity."
          : "Premium features for growth."
      let badge
      if (group.monthly && (group.yearly || isVirtualYearly)) {
        const monthlyTotal = (group.monthly.finalPrice / 100) * 12
        let currentYearlyPrice
        let savingsPercent = 0
        if (isVirtualYearly) {
          currentYearlyPrice = yearlyPrice * 12
          savingsPercent = group.monthly.yearlyDiscountPercentage || 0
        } else {
          currentYearlyPrice = group.yearly.finalPrice / 100
          savingsPercent = Math.round(
            ((monthlyTotal - currentYearlyPrice) / monthlyTotal) * 100
          )
        }
        const savingsAmount = Math.round(monthlyTotal - currentYearlyPrice)
        if (savingsAmount > 0 && billingCycle === "yearly") {
          badge = `Save $${savingsAmount}/year`
        }
      }

      const modeDisplay: Record<string, string> = {
        monthly: "month",
        yearly: "year",
        free: "forever",
        lifetime: "one-time",
      }

      const tierFeatures =
        group.monthly?.features ||
        group.yearly?.features ||
        group.free?.features ||
        group.lifetime?.features ||
        []

      const isPopular = group.name.toLowerCase().includes("pro")
      const planBadge =
        finalPlan?.badge || (isPopular ? "Most Popular" : undefined)

      return {
        name: group.name,
        description,
        price,
        yearlyPrice,
        originalPrice: finalOriginalPrice,
        mode: displayPrice === 0
          ? "forever"
          : (billingCycle === "yearly" && (group.yearly || isVirtualYearly))
            ? "year"
            : billingCycle === "lifetime"
              ? "one-time"
              : "month",
        buttonText: "Get Started",
        popular: isPopular,
        badge,
        includes: Array.isArray(tierFeatures) ? tierFeatures : [],
        planBadge: planBadge,
        isCurrent: finalPlan?.id === activePlanId,
        trialDays: finalPlan?.trialDays || 0,
      }
    })
  }, [filteredGroups, billingCycle, activePlanId])

  const handleAction = useCallback(
    async (planName: string, isYearlyAction: boolean) => {
      try {
        setLoadingPlanName(planName.toLowerCase())

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
          group.monthly.hasYearlyPlan
        ) {
          plan = group.monthly
          isVirtualYearly = true
        }

        const finalPlan = plan || group?.free || group?.lifetime

        if (!finalPlan) {
          toast.error("Plan not found. Please try again.")
          return
        }

        const url = new URL(`/checkout`, window.location.origin)
        url.searchParams.set("planId", finalPlan.id)
        if (billingCycle === "yearly" || isVirtualYearly) {
          url.searchParams.set("isyearly", "true")
        }
        const checkoutPath = url.pathname + url.search

        const { authClient } = await import("@/lib/auth-client")
        const { data: session } = await authClient.getSession()

        if (!session) {
          toast.info("Please login to continue")
          router.push(`/login?redirect=${encodeURIComponent(checkoutPath)}`)
          return
        }

        if (isPublic) {
          router.push(checkoutPath)
          return
        }

        router.push(checkoutPath)
      } catch (error) {
        console.error("Action failed:", error)
        toast.error("Something went wrong. Please try again later.")
      } finally {
        setLoadingPlanName(null)
      }
    },
    [groupedPlans, billingCycle, redirectPath, isPublic, router]
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
    return dbPlans.reduce(
      (max, p) => Math.max(max, p.yearlyDiscountPercentage || 0),
      0
    )
  }, [dbPlans])

  return (
    <>
      {settings.enable_discount &&
        settings.coupon_code &&
        settings.discount_percent > 0 && (
          <div className="-mx-4 -mt-4 mb-8 bg-primary px-4 py-3 text-center md:-mx-8 md:-mt-6">
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
        loadingPlanName={loadingPlanName}
      />

      <div className="mx-auto max-w-6xl px-4 py-10 md:py-16">
        <div className="mb-16 px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold lg:text-5xl">
            The Complete Shoptimity Toolkit
          </h2>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-slate-500">
            Every single component, widget, and section designed to turn your
            visitors into customers.
          </p>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm md:rounded-[32px]">
          <table className="w-full min-w-[600px] table-fixed border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="w-1/2 p-4 text-xs font-bold tracking-widest text-slate-400 uppercase md:p-6">
                  Features & Components
                </th>
                {allTiersForTable.map((plan) => (
                  <th
                    key={plan.id}
                    className={cn(
                      "w-1/4 p-4 text-center font-bold md:p-6",
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
