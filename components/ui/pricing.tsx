"use client"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import NumberFlow from "@number-flow/react"
import { CheckCheck } from "lucide-react"
// import { motion, AnimatePresence } from "motion/react";
import React, { memo, useRef } from "react"
// import { VerticalCutReveal } from "./vertical-cut-reveal";

const PricingSwitch = ({
  billingCycle,
  onSwitch,
  availableCycles,
  maxYearlyDiscount,
  className,
}: {
  billingCycle: string
  onSwitch: (value: string) => void
  availableCycles: string[]
  maxYearlyDiscount?: number
  className?: string
}) => {
  const options = [
    { id: "monthly", label: "Monthly" },
    {
      id: "yearly",
      label: "Yearly",
      badge:
        maxYearlyDiscount && maxYearlyDiscount > 0
          ? `Save ${maxYearlyDiscount}%`
          : undefined,
    },
    { id: "lifetime", label: "Lifetime", badge: "One-time" },
  ].filter((opt) => availableCycles.includes(opt.id))

  const activeIndex = options.findIndex((opt) => opt.id === billingCycle)

  return (
    <div className={cn("flex w-full justify-center", className)}>
      <div className="relative z-10 flex w-full max-w-[280px] rounded-full border border-neutral-200 bg-neutral-100/50 p-1 shadow-inner backdrop-blur-sm sm:w-auto md:max-w-none md:p-2">
        <div
          className={cn(
            "absolute inset-y-1 left-1 z-0 rounded-full bg-linear-to-br from-orange-500 to-orange-600 shadow-md shadow-orange-500/20 transition-all duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] md:inset-y-2 md:left-2",
            options.length === 2
              ? "w-[calc((100%-8px)/2)] md:w-[calc((100%-16px)/2)]"
              : "w-[calc((100%-8px)/3)] md:w-[calc((100%-16px)/3)]",
            activeIndex === 0
              ? "translate-x-0"
              : activeIndex === 1
                ? "translate-x-full"
                : "translate-x-[200%]"
          )}
        />
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onSwitch(option.id)}
            style={{ width: `${100 / options.length}%` }}
            className={cn(
              "relative z-10 flex h-10 cursor-pointer items-center justify-center transition-all duration-300 sm:h-11",
              billingCycle === option.id
                ? "text-white"
                : "text-neutral-500 hover:text-neutral-900"
            )}
          >
            <div className="relative flex items-center justify-center px-1.5 sm:px-9">
              <span className="text-xs font-bold whitespace-nowrap sm:text-base">
                {option.label}
              </span>
              {option.badge && (
                <span
                  className={cn(
                    "absolute -top-7 -right-14 flex rotate-20 items-center justify-center rounded-full bg-emerald-500 px-2 py-0.5 text-[8px] font-black tracking-tight whitespace-nowrap text-white uppercase shadow-sm ring-1 ring-white transition-all duration-300 sm:-top-8 sm:-right-8 sm:px-2.5 sm:text-[9px] sm:tracking-wider md:-right-8 md:text-[10px]"
                  )}
                >
                  {option.badge}
                  <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-r border-b border-white bg-emerald-500" />
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export interface PricingPlan {
  name: string
  description: string
  price: number
  yearlyPrice: number
  originalPrice?: number
  mode: string
  buttonText: string
  popular?: boolean
  badge?: string
  includes: string[]
  isCurrent?: boolean
  planBadge?: string
  trialDays?: number
}

export const PricingSectionModern = memo(
  ({
    plans,
    onAction,
    billingCycle,
    onSwitch,
    showSwitch = true,
    availableCycles = ["monthly", "yearly"],
    maxYearlyDiscount,
    loadingPlanName,
  }: {
    plans: PricingPlan[]
    onAction?: (planId: string, isYearly: boolean) => void
    billingCycle: string
    onSwitch: (value: string) => void
    showSwitch?: boolean
    availableCycles?: string[]
    maxYearlyDiscount?: number
    loadingPlanName?: string | null
  }) => {
    const pricingRef = useRef<HTMLDivElement>(null)

    return (
      <div
        className="relative mx-auto max-w-7xl px-4 py-6 md:py-10"
        ref={pricingRef}
      >
        <article className="mx-auto mb-12 max-w-4xl space-y-6 text-center">
          <h2 className="mb-4 text-2xl font-bold text-gray-900 capitalize md:text-4xl">
            We've got a plan that's perfect for you
          </h2>

          <p className="mx-auto max-w-2xl text-base text-gray-500 md:text-lg">
            {billingCycle === "lifetime"
              ? "The best investment for your Shopify store. No recurring bills, just lifetime updates and premium features."
              : "Trusted by millions of merchants worldwide. Choose the plan that best fits your growth stage and start scaling today."}
          </p>

          {showSwitch && (
            <div className="flex justify-center pt-4">
              <PricingSwitch
                billingCycle={billingCycle}
                onSwitch={onSwitch}
                availableCycles={availableCycles}
                maxYearlyDiscount={maxYearlyDiscount}
              />
            </div>
          )}
        </article>

        <div
          className={cn(
            "grid gap-6 py-8 md:gap-4 lg:gap-8",
            plans.length === 1
              ? "mx-auto max-w-md"
              : plans.length === 2
                ? "mx-auto max-w-4xl md:grid-cols-2"
                : "md:grid-cols-3"
          )}
        >
          {plans.map((plan) => {
            const isLoading = loadingPlanName === plan.name.toLowerCase()
            const displayPrice =
              billingCycle === "yearly" ? plan.yearlyPrice : plan.price
            const isFree = displayPrice === 0

            return (
              <div key={plan.name} className="h-full">
                <Card
                  className={`relative h-full border border-neutral-200 ${plan.popular
                    ? "bg-orange-50 shadow-lg ring-2 shadow-orange-100 ring-orange-500"
                    : "bg-white"
                    }`}
                >
                  {plan.planBadge && (
                    <div className="absolute -top-3 left-1/2 z-20 -translate-x-1/2">
                      <span className="rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white shadow-md">
                        {plan.planBadge}
                      </span>
                    </div>
                  )}
                  <CardHeader className="text-left">
                    <div className="flex items-start justify-between">
                      <h3 className="mb-2 text-3xl font-semibold text-gray-900 md:text-2xl xl:text-3xl">
                        {plan.name} Plan
                      </h3>
                      {plan.badge && (
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className="rounded-full bg-emerald-500 px-2 py-1 text-[10px] font-bold text-white md:px-3 md:py-1.5">
                            {plan.badge}
                          </span>
                        </div>
                      )}
                      {billingCycle === "yearly" && plan.price > 0 && (plan.price * 12 - plan.yearlyPrice) > 0 && (
                        <div className="shrink-0 rounded-lg bg-emerald-500/10 px-2.5 py-1.5 text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                          Save ${Math.round(plan.price * 12 - plan.yearlyPrice)}
                        </div>
                      )}
                    </div>

                    <p className="mt-2 text-sm leading-relaxed text-gray-500 md:text-base">
                      {plan.description}
                    </p>

                    <div className="flex flex-col gap-1">
                      <div className="flex items-baseline flex-wrap gap-1">

                        {plan.originalPrice !== undefined &&
                          plan.originalPrice > displayPrice && (
                            <span className="mr-2 text-xl font-medium text-neutral-400 line-through md:text-2xl">
                              ${plan.originalPrice.toFixed(0)}
                            </span>
                          )}
                        <span className="text-2xl font-bold text-gray-900 md:text-3xl">
                          $
                        </span>
                        <span className="text-4xl font-bold tracking-tight text-gray-900 md:text-5xl lg:text-6xl">
                          <NumberFlow
                            format={{
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            }}
                            value={displayPrice}
                            className="text-3xl font-bold md:text-4xl"
                          />
                        </span>
                        <span className="ml-1 text-sm font-semibold text-gray-500 md:text-base">
                          /{plan.mode}
                        </span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <button
                      onClick={() =>
                        !plan.isCurrent &&
                        !isLoading &&
                        onAction?.(
                          plan.name.toLowerCase(),
                          billingCycle === "yearly"
                        )
                      }
                      disabled={plan.isCurrent || !!loadingPlanName}
                      className={cn(
                        "mb-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-orange-400 bg-linear-to-t from-orange-500 to-orange-600 px-4 py-3.5 text-base font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed sm:text-lg lg:text-xl whitespace-nowrap",
                        isLoading && "opacity-90"
                      )}
                    >
                      {isLoading && (
                        <svg
                          className="h-5 w-5 animate-spin text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      )}
                      <span className="truncate">
                        {plan.isCurrent
                          ? "Current Plan"
                          : plan.trialDays && plan.trialDays > 0
                            ? `Start ${plan.trialDays}-Day Free Trial`
                            : plan.buttonText}
                      </span>
                    </button>

                    <div className="space-y-3 border-t border-neutral-200 pt-4">
                      <h2 className="mb-3 text-xl font-semibold text-gray-900 uppercase">
                        Features
                      </h2>
                      <ul className="space-y-3 font-semibold">
                        {plan.includes.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-start">
                            <span className="mt-0.5 mr-3 grid h-5 w-5 shrink-0 place-content-center rounded-full border border-orange-500 bg-white">
                              <CheckCheck className="h-3 w-3 text-orange-500" />
                            </span>
                            <span className="text-sm leading-snug text-gray-600 md:text-xs xl:text-sm">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)
