"use client"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import NumberFlow from "@number-flow/react"
import { CheckCheck } from "lucide-react"
// import { motion, AnimatePresence } from "motion/react";
import { memo, useRef } from "react"
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
      <div className="relative z-10 flex overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 p-1 shadow-inner">
        <div
          className="absolute inset-y-1 left-1 z-0 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 shadow-md shadow-orange-500/20"
          style={{
            width: `calc(${100 / options.length}%)`,
            transform: `translateX(${activeIndex * 100}%)`,
            transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onSwitch(option.id)}
            style={{ width: `${100 / options.length}%` }}
            className={cn(
              "relative z-10 flex h-10 cursor-pointer items-center justify-center rounded-lg px-2 text-sm font-semibold whitespace-nowrap transition-all duration-300 sm:px-6 md:text-base",
              billingCycle === option.id
                ? "text-white"
                : "text-neutral-500 hover:text-neutral-900"
            )}
          >
            <span className="relative z-10 flex items-center gap-2">
              {option.label}
              {option.badge && (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold tracking-tight uppercase",
                    billingCycle === option.id
                      ? "bg-white/20 text-white"
                      : "bg-orange-100 text-orange-600"
                  )}
                >
                  {option.badge}
                </span>
              )}
            </span>
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
  mode: string
  buttonText: string
  popular?: boolean
  badge?: string
  planBadge?: string
  includes: string[]
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
  }: {
    plans: PricingPlan[]
    onAction?: (planId: string, isYearly: boolean) => void
    billingCycle: string
    onSwitch: (value: string) => void
    showSwitch?: boolean
    availableCycles?: string[]
    maxYearlyDiscount?: number
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
            "grid gap-4 py-6",
            plans.length === 1
              ? "mx-auto max-w-md"
              : plans.length === 2
                ? "mx-auto max-w-4xl md:grid-cols-2"
                : "md:grid-cols-3"
          )}
        >
          {plans.map((plan) => (
            <div key={plan.name} className="h-full">
              <Card
                className={`relative h-full border border-neutral-200 ${
                  plan.popular
                    ? "bg-orange-50 shadow-lg ring-2 shadow-orange-100 ring-orange-500"
                    : "bg-white"
                }`}
              >
                <CardHeader className="text-left">
                  <div className="flex items-start justify-between">
                    <h3 className="mb-2 text-3xl font-semibold text-gray-900 md:text-2xl xl:text-3xl">
                      {plan.name} Plan
                    </h3>
                    {plan.planBadge && (
                      <div className="">
                        <span className="rounded-full bg-orange-500 px-3 py-1 text-sm font-medium text-white">
                          {plan.planBadge}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="mb-4 text-sm text-gray-600 md:text-xs xl:text-sm">
                    {plan.description}
                  </p>
                  <div className="flex items-baseline">
                    <span className="text-4xl font-semibold text-gray-900">
                      $
                      <NumberFlow
                        format={{
                          currency: "USD",
                        }}
                        value={
                          billingCycle === "yearly"
                            ? plan.yearlyPrice
                            : plan.price
                        }
                        className="text-4xl font-semibold"
                      />
                    </span>
                    <span className="ml-1 text-gray-600">/{plan.mode}</span>
                    {plan.badge && (
                      <span className="mt-3 ml-3 self-start rounded-full border border-green-200 bg-green-100 px-2 py-0.5 text-[10px] font-bold tracking-wider whitespace-nowrap text-green-700 capitalize">
                        {plan.badge}
                      </span>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <button
                    onClick={() =>
                      onAction?.(
                        plan.name.toLowerCase(),
                        billingCycle === "yearly"
                      )
                    }
                    className={cn(
                      "mb-3 w-full cursor-pointer rounded-xl border p-4 text-xl font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98]",
                      plan.buttonText === "Current Plan"
                        ? "border-neutral-700 bg-gradient-to-t from-neutral-900 to-neutral-600 shadow-lg shadow-neutral-900/20"
                        : "border-orange-400 bg-gradient-to-t from-orange-500 to-orange-600 shadow-lg shadow-orange-500/20"
                    )}
                  >
                    {plan.buttonText}
                  </button>

                  <div className="space-y-3 border-t border-neutral-200 pt-4">
                    <h2 className="mb-3 text-xl font-semibold text-gray-900 uppercase">
                      Features
                    </h2>
                    <h4 className="mb-3 text-base font-medium text-gray-900">
                      {plan.includes[0]}
                    </h4>
                    <ul className="space-y-2 font-semibold">
                      {plan.includes.slice(1).map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center">
                          <span className="mt-0.5 mr-3 grid h-6 w-6 shrink-0 place-content-center rounded-full border border-orange-500 bg-white">
                            <CheckCheck className="h-4 w-4 text-orange-500" />
                          </span>
                          <span className="text-sm text-gray-600">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    )
  }
)
