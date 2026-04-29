"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Check, X, Zap, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import CTABadges from "./CTABadges"
import { getActivePlans } from "@/actions/admin-plans"
import { useBasePrice } from "@/hooks/use-base-price"
import { useRouter } from "next/navigation"

interface Feature {
  name: string
  included: boolean
  highlight?: boolean
}

interface DBPlan {
  id: string
  name: string
  mode: "monthly" | "yearly" | "free" | "lifetime"
  slots: number
  regularPrice: number
  finalPrice: number
  currency: string
  features: unknown
  isActive: boolean
  stripePaymentLink?: string | null
  trialDays: number
  yearlyDiscountPercentage?: number | null
  hasYearlyPlan: boolean
  badge?: string | null
  position: number
  createdAt: Date
  updatedAt: Date
}

interface PlanGroup {
  name: string
  monthly: DBPlan | null
  yearly: DBPlan | null
  free: DBPlan | null
  lifetime: DBPlan | null
}

interface GroupedPlan {
  id: string
  name: string
  description: string
  monthlyPrice: number
  yearlyPrice: number
  features: Feature[]
  badge?: string
  buttonText: string
  popular?: boolean
  mode: string
  canBeYearly: boolean
  isFree: boolean
}

interface NewPricingSectionProps {
  headline?: string
  subheadline?: string
}

const NewPricingSection: React.FC<NewPricingSectionProps> = ({
  headline = "Flexible Pricing For Every Brand",
  subheadline = "Ready to Build a Store That Actually Converts?",
}) => {
  const router = useRouter()
  const { templateCount } = useBasePrice()
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  )
  const [dbPlans, setDbPlans] = useState<DBPlan[]>([])
  const [selectedPlanIndex, setSelectedPlanIndex] = useState<number>(1) // Default to Pro

  useEffect(() => {
    const fetchPlans = async () => {
      const plans = await getActivePlans()
      if (plans && plans.length > 0) {
        setDbPlans(plans)
      }
    }
    fetchPlans()
  }, [])

  const dynamicPlans = useMemo((): GroupedPlan[] => {
    if (dbPlans.length === 0) return []

    const groups: Record<string, PlanGroup> = {}
    dbPlans.forEach((plan: DBPlan) => {
      if (!groups[plan.name]) {
        groups[plan.name] = {
          name: plan.name,
          monthly: null,
          yearly: null,
          free: null,
          lifetime: null,
        }
      }
      groups[plan.name][plan.mode as keyof Omit<PlanGroup, "name">] = plan
    })

    return Object.values(groups).map((group: PlanGroup) => {
      const isPro = group.name.toLowerCase().includes("pro")
      const isFree = !!group.free
      const monthlyPlan = group.monthly || group.free || group.lifetime
      let yearlyPlan = group.yearly

      const basePlan =
        group.monthly || group.yearly || group.free || group.lifetime

      // Calculate prices
      const mPrice = monthlyPlan ? monthlyPlan.finalPrice / 100 : 0
      let yPrice = yearlyPlan ? yearlyPlan.finalPrice / 100 : mPrice * 12

      // Check for hasYearlyPlan flag
      const canBeYearly =
        yearlyPlan || (monthlyPlan && monthlyPlan.hasYearlyPlan) || false

      const discountPercent =
        yearlyPlan?.yearlyDiscountPercentage ||
        monthlyPlan?.yearlyDiscountPercentage ||
        0

      // If no explicit yearly plan, but has flag and discount, calculate virtual yearly
      if (!yearlyPlan && canBeYearly && discountPercent > 0 && mPrice > 0) {
        yPrice = Math.round(mPrice * 12 * (1 - discountPercent / 100))
      } else if (!canBeYearly) {
        // If it can't be yearly, set yPrice to 0 or indicator (handled in UI)
        yPrice = 0
      }

      return {
        id: basePlan?.id || "",
        name: group.name,
        description: isPro
          ? "The complete conversion toolkit."
          : "Perfect for beginners and testing.",
        monthlyPrice: mPrice,
        yearlyPrice: yPrice,
        buttonText: isFree ? "Get Started For Free" : "Upgrade To Pro Now",
        popular: isPro,
        badge: isPro ? "MOST POPULAR" : undefined,
        mode: basePlan?.mode || "",
        canBeYearly: !!canBeYearly,
        isFree,
        features: Array.isArray(basePlan?.features)
          ? (basePlan.features as string[]).map((f) => {
              let name = f
              if (f.toLowerCase().includes("industry templates")) {
                const count = isPro
                  ? templateCount || 10
                  : Math.round((templateCount || 10) / 2)
                name = `${count} Industry Templates`
              }
              return {
                name,
                included: true,
                highlight:
                  f.toLowerCase().includes("templates") ||
                  (isPro && f.toLowerCase().includes("priority")),
              }
            })
          : [],
      }
    })
  }, [dbPlans, templateCount])

  const currentPlan = dynamicPlans[selectedPlanIndex] || dynamicPlans[0]
  const isYearly = billingCycle === "yearly"

  const displayPrice =
    currentPlan && isYearly && currentPlan.yearlyPrice > 0
      ? currentPlan.yearlyPrice
      : currentPlan?.monthlyPrice || 0

  const discount =
    currentPlan && currentPlan.monthlyPrice > 0
      ? Math.round(
          ((currentPlan.monthlyPrice * 12 - currentPlan.yearlyPrice) /
            (currentPlan.monthlyPrice * 12)) *
            100
        )
      : 0

  const handleAction = async () => {
    if (!currentPlan) return
    const { authClient } = await import("@/lib/auth-client")
    const { data: session } = await authClient.getSession()

    if (!session) {
      router.push(`/login?redirect=/pricing`)
      return
    }

    const url = new URL(`/checkout`, window.location.origin)
    url.searchParams.set("planId", currentPlan.id)
    if (isYearly && currentPlan.yearlyPrice > 0) {
      url.searchParams.set("isyearly", "true")
    }

    router.push(url.pathname + url.search)
  }

  if (!currentPlan) return null

  return (
    <section className="relative bg-base-100 py-16 md:py-24" id="pricing">
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="scroll-animate relative h-auto justify-center rounded-[38px] border p-2 shadow-[0_10px_50px_rgba(0,0,0,0.05)] lg:sticky lg:top-[120px] lg:p-6">
            <div className="relative z-0 mx-auto h-full w-full rounded-[28px]">
              <img
                src="/assets/pricing-image.webp"
                className="h-full w-full rounded-[28px] object-contain drop-shadow-2xl"
                alt="Shoptimity Mockup"
              />
            </div>
          </div>

          <div className="scroll-animate flex flex-col">
            <div className="mb-6">
              <h2 className="mb-2 font-heading text-[32px] leading-tight text-base-content md:text-[40px]">
                {subheadline}
              </h2>
              <p className="text-lg text-base-content-muted">{headline}</p>
            </div>

            {dbPlans.some((p) => p.hasYearlyPlan) && (
              <div className="mb-8 flex items-center gap-4">
                <span
                  className={cn(
                    "text-sm font-semibold",
                    !isYearly ? "text-base-content" : "text-base-content-muted"
                  )}
                >
                  Monthly
                </span>
                <button
                  onClick={() =>
                    setBillingCycle(isYearly ? "monthly" : "yearly")
                  }
                  className="relative h-7 w-14 rounded-full bg-base-200 p-1 transition-colors hover:bg-base-200/80"
                >
                  <div
                    className={cn(
                      "h-5 w-5 rounded-full bg-primary shadow-sm transition-transform duration-300",
                      isYearly ? "translate-x-7" : "translate-x-0"
                    )}
                  />
                </button>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      isYearly ? "text-base-content" : "text-base-content-muted"
                    )}
                  >
                    Yearly
                  </span>
                  <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-green-700 uppercase">
                    Save {discount || 0}%
                  </span>
                </div>
              </div>
            )}

            <div className="mb-4 flex items-center gap-3 font-sans">
              <div className="flex items-baseline gap-2">
                {isYearly && currentPlan.monthlyPrice > 0 && (
                  <span className="text-2xl font-medium text-neutral-400 line-through">
                    ${currentPlan.monthlyPrice * 12}
                  </span>
                )}
                <span className="text-[40px] font-bold tracking-tight text-base-content md:text-[52px]">
                  {displayPrice === 0 ? "Free" : `$${displayPrice}`}
                </span>
                <span className="text-[18px] font-medium text-base-content-muted">
                  {displayPrice === 0
                    ? "forever"
                    : isYearly && currentPlan.canBeYearly
                      ? "/year"
                      : "/month"}
                </span>
              </div>
              {isYearly && currentPlan.yearlyPrice > 0 && discount > 0 && (
                <span className="ml-2 rounded-full bg-emerald-100 px-3 py-1 text-[13px] font-bold text-emerald-700">
                  Save {discount}%
                </span>
              )}
            </div>

            <div className="mb-10 font-sans">
              <h4 className="mb-4 text-[20px] font-bold tracking-tight text-base-content sm:text-[24px]">
                Choose your plan
              </h4>

              <div className="space-y-4">
                {dynamicPlans.map((plan, idx) => (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlanIndex(idx)}
                    className={cn(
                      "group relative flex w-full cursor-pointer items-center justify-between rounded-2xl border-2 p-4 transition-all duration-300",
                      selectedPlanIndex === idx
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-transparent bg-base-300 hover:bg-primary/10"
                    )}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 right-4 rounded-full bg-orange-500 px-3 py-1 text-[10px] font-bold text-white shadow-lg">
                        {plan.badge}
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-left">
                      <div className="relative h-14 w-14">
                        <div className="absolute inset-0 -translate-x-1 -translate-y-1 rounded-xl border bg-base-300 shadow-sm"></div>
                        <div className="relative flex h-14 w-14 items-center justify-center rounded-xl border bg-base-300 shadow-sm">
                          <img
                            src="/shoptimity-icon.png"
                            className="h-7 w-7 opacity-80"
                            alt="Icon"
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-2 font-bold text-base-content">
                            {plan.name}
                            {plan.yearlyPrice > 0 && isYearly && (
                              <span
                                className={`rounded bg-primary px-2 py-0.5 text-[10px] font-normal text-white uppercase`}
                              >
                                Save $
                                {Math.round(
                                  plan.monthlyPrice * 12 - plan.yearlyPrice
                                )}
                              </span>
                            )}
                          </span>
                        </div>
                        <p className="text-[13px] font-medium text-base-content-muted">
                          {plan.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="gap text-[20px] leading-none font-bold text-base-content">
                        {isYearly && plan.yearlyPrice > 0 ? (
                          <>
                            ${plan.yearlyPrice}
                            <span className="ml-1 text-[13px] font-medium text-base-content-muted">
                              /yr
                            </span>
                          </>
                        ) : plan.monthlyPrice > 0 ? (
                          <>
                            ${plan.monthlyPrice}
                            <span className="ml-1 text-[13px] font-medium text-base-content-muted">
                              /mo
                            </span>
                          </>
                        ) : (
                          "Free"
                        )}
                        {isYearly &&
                          plan.monthlyPrice > 0 &&
                          plan.yearlyPrice > 0 && (
                            <span className="ml-2 text-[14px] leading-none font-medium text-base-content-muted line-through">
                              ${plan.monthlyPrice * 12}
                            </span>
                          )}
                      </div>
                      <div className="mt-1 text-[12px] leading-none font-medium text-base-content-muted">
                        {plan.monthlyPrice > 0
                          ? isYearly && plan.yearlyPrice > 0
                            ? "Billed annually"
                            : "Billed monthly"
                          : "Forever"}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Feature list preview */}
            <div className="mb-10 space-y-3 rounded-xl bg-white p-4">
              <p className="text-xs font-bold tracking-widest text-base-content-muted uppercase">
                Key Features
              </p>
              <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                {currentPlan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2">
                    {feature.included ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-base-content-muted/30" />
                    )}
                    <span
                      className={cn(
                        "text-[13px]",
                        feature.included
                          ? feature.highlight
                            ? "font-bold text-base-content"
                            : "text-base-content-muted"
                          : "text-base-content-muted/40 line-through"
                      )}
                    >
                      {feature.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center gap-4">
              <button
                onClick={handleAction}
                className="group flex w-full cursor-pointer items-center justify-center gap-4 rounded-full bg-orange-500 py-4 text-white transition-all duration-300 hover:-translate-y-1 hover:bg-orange-600 hover:shadow-[0_10px_25px_rgba(249,115,22,0.35)]"
              >
                <span className="font-sans text-[16px] font-bold tracking-wider uppercase md:text-[20px]">
                  {currentPlan.buttonText}
                </span>
              </button>
              <CTABadges className="items-center justify-center" />
            </div>
          </div>
        </div>
        <div className="mt-10 rounded-[48px] border bg-base-200/50 p-4 shadow-sm backdrop-blur-sm sm:p-8 md:p-12">
          <div className="mb-12 text-center">
            <span className="mb-3 inline-block rounded-full bg-primary/10 px-4 py-1.5 text-[14px] font-bold tracking-wider text-primary uppercase">
              Easy Setup
            </span>
            <h3 className="font-heading text-[32px] font-bold text-base-content md:text-[40px]">
              Setup in under 5 minutes
            </h3>
            <p className="mt-4 text-base-content-muted">
              Everything you need to launch your high-converting Shopify store
              instantly.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: "01",
                title: "Select Plan",
                desc: "Choose licenses & checkout via secure Stripe payment.",
              },
              {
                step: "02",
                title: "Access Dashboard",
                desc: "Get magic link, select your templates & download zip files.",
              },
              {
                step: "03",
                title: "Link Store",
                desc: "Add your Shopify domain to assign your license slot.",
              },
              {
                step: "04",
                title: "Go Live",
                desc: "Upload theme on Shopify & start increasing your conversion.",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="group relative rounded-3xl bg-white p-6 transition-all duration-300 hover:-translate-y-2 hover:bg-base-100 hover:shadow-xl"
              >
                {/* Connector Arrow for Desktop */}
                {idx < 3 && (
                  <div className="absolute top-12 left-[70%] z-0 hidden w-full lg:block">
                    <svg
                      className="w-[50%] text-primary/40"
                      viewBox="0 0 100 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M0 10H85M85 10L77 4M85 10L77 16"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeDasharray="6 8"
                        className="animate-flow"
                      />
                    </svg>
                  </div>
                )}

                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-primary/20 bg-base-100 font-sans text-[18px] font-bold text-primary transition-all duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-white">
                  {item.step}
                </div>

                <div className="flex flex-col">
                  <h4 className="mb-2 font-sans text-[18px] font-bold text-base-content transition-colors duration-300 group-hover:text-primary">
                    {item.title}
                  </h4>
                  <p className="text-[14px] leading-relaxed font-medium text-base-content-muted">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-3 rounded-full bg-base-300/80 px-6 py-3">
              <span className="flex h-2 w-2 animate-pulse rounded-full bg-primary"></span>
              <p className="text-[14px] font-semibold text-base-content">
                Need more info? Read the full{" "}
                <a
                  href="/setup"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Setup Guide
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default NewPricingSection
