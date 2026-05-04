"use client"

import React, { useMemo, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Check, X, Search, Plus, Minus } from "lucide-react"
import { PricingSectionModern, PricingPlan } from "@/components/ui/pricing"
import { toast } from "sonner"

interface PricingClientProps {
  dbPlans: any[]
  groupedFeatures: any[]
  settings?: any
  redirectPath?: string
  isPublic?: boolean
  activePlanId?: string
  activePlanMode?: string
  activeBillingCycle?: string
  hasStripeSubscription?: boolean
  hasUsedTrial?: boolean
}

// Feature Row Component (Table Row Format)
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

// Card-Based Accordion with Table Inside
function AccordionWithTable({
  category,
  children,
  isOpen,
  onToggle,
  featureCount,
}: {
  category: any
  children: React.ReactNode
  isOpen: boolean
  onToggle: () => void
  featureCount: number
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md">
      {/* Accordion Header - Card Style */}
      <button
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center justify-between px-6 py-5 text-left transition-colors hover:bg-slate-50/50"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold text-slate-900 md:text-lg">
            {category.name}
          </h3>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
            {featureCount} features
          </span>
        </div>
        <div className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-transform duration-200">
          {isOpen ? <Minus className="size-4" /> : <Plus className="size-4" />}
        </div>
      </button>

      {/* Accordion Content - Table Format */}
      {isOpen && (
        <div className="border-t border-slate-100">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed border-collapse text-left">
              <tbody className="divide-y divide-slate-100">{children}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export function PlansClient({
  dbPlans,
  groupedFeatures,
  settings = {},
  redirectPath = "/plans",
  isPublic = false,
  activePlanId,
  activePlanMode,
  activeBillingCycle,
  hasStripeSubscription = false,
  hasUsedTrial = false,
}: PricingClientProps) {
  const router = useRouter()
  const [billingCycle, setBillingCycle] = useState<
    "monthly" | "yearly" | "lifetime"
  >("yearly")
  const [loadingPlanName, setLoadingPlanName] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set())

  // Use ref to track if initial state has been set
  const isInitialized = useRef(false)

  // Initialize ONLY the first category as open, all others closed (runs only once)
  React.useEffect(() => {
    if (!isInitialized.current && groupedFeatures.length > 0) {
      // Only open the first category
      setOpenCategories(new Set([groupedFeatures[0].id]))
      isInitialized.current = true
    }
  }, [groupedFeatures]) // Only depends on groupedFeatures, not on openCategories

  const toggleCategory = useCallback((categoryId: string) => {
    setOpenCategories((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }, [])

  // Calculate feature counts for each category
  const categoryFeatureCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    groupedFeatures.forEach((category) => {
      counts[category.id] = category.features?.length || 0
    })
    return counts
  }, [groupedFeatures])

  const availableCycles = useMemo(() => {
    const cycles = new Set<string>()
    dbPlans.forEach((p) => {
      if (p.mode === "monthly") cycles.add("monthly")
      if (p.mode === "yearly" || (p.mode === "monthly" && p.hasYearlyPlan))
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
    return Object.values(groups).sort((a, b) => {
      const aPrice =
        a.free?.finalPrice ??
        a.monthly?.finalPrice ??
        a.yearly?.finalPrice ??
        a.lifetime?.finalPrice ??
        0
      const bPrice =
        b.free?.finalPrice ??
        b.monthly?.finalPrice ??
        b.yearly?.finalPrice ??
        b.lifetime?.finalPrice ??
        0
      return aPrice - bPrice
    })
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
        (group.yearly?.finalPrice || group.lifetime?.finalPrice || 0) / 100

      // Fallback for monthly plans in yearly view
      if (
        billingCycle === "yearly" &&
        !group.yearly &&
        !isVirtualYearly &&
        group.monthly
      ) {
        yearlyPrice = group.monthly.finalPrice / 100
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
        billingCycle === "yearly"
          ? originalPrice
          : originalPrice > displayPrice
            ? originalPrice
            : undefined

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

      // A plan card represents the same plan record AND the same billing
      // cycle the user is actually on. For free/lifetime plans the cycle
      // doesn't matter, but for paid plans we must compare both — otherwise
      // a user on Pro Monthly would see "Current Plan" on the Pro Yearly tab
      // when the plan uses inline `hasYearlyPlan` (same plan record).
      const planMatches = !!finalPlan && finalPlan.id === activePlanId
      const cycleMatches =
        finalPlan?.mode === "free" ||
        finalPlan?.mode === "lifetime" ||
        billingCycle === activeBillingCycle
      const isCurrent = planMatches && cycleMatches

      // Yearly subscriber viewing the monthly tab — any paid plan is a
      // potential downgrade, not a new purchase.
      const isYearlyViewingMonthly =
        activeBillingCycle === "yearly" && billingCycle === "monthly"

      let buttonText = "Get Started"
      let isDowngrade = false

      if (planMatches && !cycleMatches) {
        // Same plan, different cycle
        if (isYearlyViewingMonthly) {
          buttonText = "Switch to Monthly"
          isDowngrade = true
        } else {
        buttonText = "Upgrade to Yearly"
        }
      } else if (
        !planMatches &&
        !isCurrent &&
        isYearlyViewingMonthly &&
        finalPlan?.mode !== "free"
      ) {
        // Different paid plan on monthly tab while subscriber is yearly
        buttonText = "Downgrade"
        isDowngrade = true
      }

      return {
        name: group.name,
        description,
        price,
        yearlyPrice,
        originalPrice: finalOriginalPrice,
        mode:
          displayPrice === 0
            ? "forever"
            : billingCycle === "yearly" && (group.yearly || isVirtualYearly)
              ? "year"
              : billingCycle === "lifetime"
                ? "one-time"
                : "month",
        buttonText,
        popular: isPopular,
        badge,
        includes: Array.isArray(tierFeatures) ? tierFeatures : [],
        planBadge: planBadge,
        isCurrent,
        isDowngrade,
        trialDays: finalPlan?.trialDays || 0,
      }
    })
  }, [filteredGroups, billingCycle, activePlanId, activeBillingCycle])

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

        // If the user is on a paid plan (monthly/yearly with a Stripe sub)
        // and clicks the Free plan's button, do NOT activate Free or push
        // them into a cancel flow — we don't want to nudge a paying user
        // toward leaving. Just inform them and stay on the plans page.
        const isFreePlan =
          finalPlan.mode === "free" || finalPlan.finalPrice === 0
        const isOnPaidPlan =
          hasStripeSubscription && activePlanMode && activePlanMode !== "free"

        if (isFreePlan && isOnPaidPlan) {
          toast.info("Your paid plan is still active.")
          return
        }

        // Same-plan cycle change for an existing subscriber: don't send
        // them through /checkout (that creates a brand-new subscription).
        // Route to /billing instead, which auto-opens the proration-aware
        // upgrade modal and reuses the user's existing Stripe subscription
        // (credits unused monthly time, charges only the difference).
        const isUpgradeToYearly =
          isOnPaidPlan &&
          activePlanId === finalPlan.id &&
          activeBillingCycle === "monthly" &&
          (billingCycle === "yearly" || isVirtualYearly)

        if (isUpgradeToYearly) {
          router.push("/billing?action=upgrade-yearly")
          return
        }

        // Yearly subscribers clicking any monthly plan card must go through
        // /billing — never /checkout — to avoid creating a parallel subscription
        // that discards their prepaid yearly time.
        const isYearlyCustomerPickingMonthly =
          isOnPaidPlan &&
          activeBillingCycle === "yearly" &&
          billingCycle === "monthly"

        if (isYearlyCustomerPickingMonthly) {
          const isSamePlan = activePlanId === finalPlan?.id
          if (isSamePlan) {
            router.push("/billing?action=switch-month")
          } else {
          toast.info(
              "To change your plan, manage your subscription from the billing page."
          )
          router.push("/billing")
          }
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
    [
      groupedPlans,
      billingCycle,
      redirectPath,
      isPublic,
      router,
      activePlanId,
      activePlanMode,
      activeBillingCycle,
      hasStripeSubscription,
    ]
  )

  const allTiersForTable = useMemo(() => {
    return groupedPlans
      .map((group) => {
        return group.free || group.lifetime || group.monthly || group.yearly
      })
      .filter(Boolean)
  }, [groupedPlans])

  const freePlanIds = useMemo(() => {
    return dbPlans
      .filter((p) => p.mode === "free" || p.name.toLowerCase() === "free")
      .map((p) => p.id)
  }, [dbPlans])

  const showSwitch = useMemo(() => {
    return availableCycles.length > 1
  }, [availableCycles])

  const maxYearlyDiscount = useMemo(() => {
    return dbPlans.reduce(
      (max, p) => Math.max(max, p.yearlyDiscountPercentage || 0),
      0
    )
  }, [dbPlans])

  // Filter features based on search term (minimum 3 characters)
  const hasValidSearch = searchTerm.length >= 3
  const filteredGroupedFeatures = useMemo(() => {
    if (!hasValidSearch) return groupedFeatures

    return groupedFeatures
      .map((category) => ({
        ...category,
        features: category.features.filter((feature: any) =>
          feature.name.toLowerCase().includes(searchTerm.toLowerCase())
        ),
      }))
      .filter((category) => category.features.length > 0)
  }, [groupedFeatures, searchTerm, hasValidSearch])

  // Auto-open categories when searching (using useEffect with stable dependencies)
  React.useEffect(() => {
    if (hasValidSearch) {
      // When searching, open ALL categories that have matching features
      const categoriesToOpen = filteredGroupedFeatures.map((cat) => cat.id)
      if (categoriesToOpen.length > 0) {
        setOpenCategories(new Set(categoriesToOpen))
      }
    } else if (!hasValidSearch && isInitialized.current) {
      // When search is cleared, revert to only first category open
      if (groupedFeatures.length > 0) {
        setOpenCategories(new Set([groupedFeatures[0].id]))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasValidSearch]) // Only depend on hasValidSearch, not on filteredGroupedFeatures

  return (
    <>
      {settings.enable_discount &&
        settings.coupon_code &&
        settings.discount_percent > 0 && (
          <div className="-mx-4 mb-8 bg-primary px-4 py-3 text-center md:-mx-8">
            <p className="font-sans text-sm font-bold tracking-wide text-white">
              Exclusive Launch Sale: Use Code{" "}
              <span
                onClick={() => {
                  navigator.clipboard.writeText(settings.coupon_code)
                  toast.success("Coupon code copied to clipboard!")
                }}
                title="Click to copy"
                className="cursor-pointer rounded border border-dashed border-white/30 bg-white/20 px-2 py-0.5 transition-all hover:bg-white/40 active:scale-95"
              >
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
        hasUsedTrial={hasUsedTrial}
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

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative mx-auto">
            <Search className="absolute top-1/2 left-4 size-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search features..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-full border border-slate-200 bg-white py-3 pr-4 pl-12 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-300 focus:ring-2 focus:ring-orange-200 focus:outline-none"
            />
          </div>
          {searchTerm.length > 0 && searchTerm.length < 3 && (
            <p className="mt-2 text-center text-xs text-amber-600">
              Please enter at least 3 characters to search
            </p>
          )}
          {hasValidSearch && filteredGroupedFeatures.length === 0 && (
            <p className="mt-4 text-center text-sm text-slate-500">
              No features found matching "{searchTerm}"
            </p>
          )}
        </div>

        {/* Accordion with Table Inside */}
        <div className="space-y-4">
          {filteredGroupedFeatures.map((category, index) => {
            const isOpen = openCategories.has(category.id)

            return (
              <AccordionWithTable
                key={category.id}
                category={category}
                isOpen={isOpen}
                onToggle={() => toggleCategory(category.id)}
                featureCount={categoryFeatureCounts[category.id] || 0}
              >
                {/* Table Header Row - Plan Names */}
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="w-1/4 p-4 text-xs font-bold tracking-widest text-slate-400 uppercase md:w-1/2 md:p-6">
                    Features & Components
                  </th>
                  {allTiersForTable.map((plan) => (
                    <th
                      key={plan.id}
                      className={cn(
                        "w-1/4 p-4 text-center font-bold md:p-6",
                        plan.name.toLowerCase().includes("pro")
                          ? "text-orange-500"
                          : "text-slate-900"
                      )}
                    >
                      {plan.name}
                    </th>
                  ))}
                </tr>

                {/* Sort features: Free features first, then others */}
                {category.features
                  .slice()
                  .sort((a: any, b: any) => {
                    const aFree = a.plans.some(
                      (p: any) => freePlanIds.includes(p.planId) && p.isEnabled
                    )
                    const bFree = b.plans.some(
                      (p: any) => freePlanIds.includes(p.planId) && p.isEnabled
                    )
                    if (aFree && !bFree) return -1
                    if (!aFree && bFree) return 1
                    return 0
                  })
                  .map((feature: any) => (
                    <FeatureRow
                      key={feature.id}
                      name={feature.name}
                      plans={feature.plans}
                      activePlans={allTiersForTable}
                      dbPlans={dbPlans}
                      highlight={feature.isHighlight}
                    />
                  ))}
              </AccordionWithTable>
            )
          })}
        </div>
      </div>
    </>
  )
}
