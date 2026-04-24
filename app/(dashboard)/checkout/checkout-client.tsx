"use client"

import { useState, useEffect, useMemo } from "react"
import { ChevronDown, MoveLeft } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

interface Plan {
  id: string
  name: string
  mode: string
  slots: number
  regularPrice: number
  finalPrice: number
  currency: string
  yearlyDiscount?: number | null
  stripePaymentLink?: string | null
}

interface CheckoutClientProps {
  initialPlan: Plan
  allPlans: Plan[]
}

export function CheckoutClient({ initialPlan, allPlans }: CheckoutClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Find plans with the same name (to switch between monthly/yearly)
  const relatedPlans = useMemo(() => {
    return allPlans.filter((p) => p.name === initialPlan.name)
  }, [allPlans, initialPlan.name])

  const monthlyPlan = relatedPlans.find((p) => p.mode === "monthly")
  const yearlyPlan = relatedPlans.find((p) => p.mode === "yearly")

  const [currentPlan, setCurrentPlan] = useState<Plan>(initialPlan)
  const [isYearly, setIsYearly] = useState(initialPlan.mode === "yearly")
  const [isDiscountOpen, setIsDiscountOpen] = useState(false)

  // Update plan when billing cycle changes
  useEffect(() => {
    if (isYearly && yearlyPlan) {
      setCurrentPlan(yearlyPlan)
    } else if (!isYearly && monthlyPlan) {
      setCurrentPlan(monthlyPlan)
    }
  }, [isYearly, monthlyPlan, yearlyPlan])

  const price = {
    original: currentPlan.regularPrice / 100,
    final: currentPlan.finalPrice / 100,
  }

  const handleBillingChange = (yearly: boolean) => {
    setIsYearly(yearly)
    const targetPlan = yearly ? yearlyPlan : monthlyPlan
    if (targetPlan) {
      // Update URL without full refresh to keep state but reflect current planId
      const params = new URLSearchParams(searchParams.toString())
      params.set("planId", targetPlan.id)
      window.history.replaceState(null, "", `?${params.toString()}`)
    }
  }

  return (
    <div className="animate-in duration-500 fade-in">
      {/* Back button and Title */}
      <div className="mb-6 flex flex-col items-start gap-2">
        <button
          onClick={() => router.push("/plans")}
          className="group inline-flex items-center text-sm font-bold text-gray-500 transition-colors hover:text-primary"
        >
          <MoveLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to plans
        </button>
        <h1 className="font-heading text-[32px] font-bold tracking-tight text-base-content">
          Checkout
        </h1>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_400px]">
        {/* Left Column (Forms) */}
        <div className="space-y-6">
          <div className="rounded-[20px] border border-gray-200 bg-white p-6 shadow-sm md:p-8">
            <h2 className="font-heading text-[20px] font-bold text-base-content">
              Billing cycle
            </h2>
            <p className="mt-1 mb-6 text-[14px] text-gray-500">
              Choose how often you'd like to be billed for the{" "}
              <span className="font-bold text-base-content">
                {currentPlan.name}
              </span>{" "}
              plan.
            </p>

            <div className="space-y-4">
              {/* Monthly Option */}
              {monthlyPlan && (
                <label className="group flex cursor-pointer items-center gap-3">
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${!isYearly ? "border-primary" : "border-gray-200 group-hover:border-gray-300"}`}
                  >
                    {!isYearly && (
                      <div className="h-2.5 w-2.5 rounded-full bg-primary"></div>
                    )}
                  </div>
                  <input
                    type="radio"
                    name="billing"
                    value="monthly"
                    className="hidden"
                    checked={!isYearly}
                    onChange={() => handleBillingChange(false)}
                  />
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    {monthlyPlan.regularPrice > monthlyPlan.finalPrice && (
                      <span className="text-sm font-medium text-gray-400 line-through">
                        ${(monthlyPlan.regularPrice / 100).toFixed(2)}
                      </span>
                    )}
                    <span className="text-[16px] font-bold text-base-content">
                      ${(monthlyPlan.finalPrice / 100).toFixed(2)}
                    </span>
                    <span className="text-[14px] text-gray-500">
                      Every month
                    </span>
                  </div>
                </label>
              )}

              {/* Yearly Option */}
              {yearlyPlan && (
                <label className="group flex cursor-pointer items-center gap-3">
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${isYearly ? "border-primary" : "border-gray-200 group-hover:border-gray-300"}`}
                  >
                    {isYearly && (
                      <div className="h-2.5 w-2.5 rounded-full bg-primary"></div>
                    )}
                  </div>
                  <input
                    type="radio"
                    name="billing"
                    value="yearly"
                    className="hidden"
                    checked={isYearly}
                    onChange={() => handleBillingChange(true)}
                  />
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    {yearlyPlan.regularPrice > yearlyPlan.finalPrice && (
                      <span className="text-sm font-medium text-gray-400 line-through">
                        ${(yearlyPlan.regularPrice / 100).toFixed(2)}
                      </span>
                    )}
                    <span className="text-[16px] font-bold text-base-content">
                      ${(yearlyPlan.finalPrice / 100).toFixed(2)}
                    </span>
                    <span className="text-[14px] text-gray-500">
                      Every year
                    </span>
                    {monthlyPlan && (
                      <span className="rounded-full bg-base-200 px-3 py-1 text-[11px] font-bold tracking-wide text-primary uppercase">
                        Save{" "}
                        {Math.round(
                          (1 -
                            yearlyPlan.finalPrice /
                              (monthlyPlan.finalPrice * 12)) *
                            100
                        )}
                        %
                      </span>
                    )}
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Payment Method Panel */}
          <div className="rounded-[20px] border border-gray-200 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-heading text-[20px] font-bold text-base-content">
                Payment method
              </h2>
              <div className="flex gap-2">
                <img
                  src="/assets/visa.svg"
                  alt="Visa"
                  className="h-7 md:h-10"
                />
                <img
                  src="/assets/mastercard.svg"
                  alt="Mastercard"
                  className="h-7 md:h-10"
                />
                <img
                  src="/assets/american-express.svg"
                  alt="American Express"
                  className="h-7 md:h-10"
                />
                <img
                  src="/assets/discover.svg"
                  alt="Discover"
                  className="h-7 md:h-10"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-[14px] font-semibold text-base-content">
                    Name on Card*
                  </label>
                  <input
                    type="text"
                    placeholder="e.g.: Jane Johnson"
                    className="w-full rounded-[12px] border border-gray-200 px-4 py-3 text-[14px] placeholder-gray-400 transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[14px] font-semibold text-base-content">
                    Credit Card Number*
                  </label>
                  <input
                    type="text"
                    placeholder="1234 1234 1234 1234"
                    className="w-full rounded-[12px] border border-gray-200 px-4 py-3 text-[14px] placeholder-gray-400 transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[14px] font-semibold text-base-content">
                      Expiration Date*
                    </label>
                    <input
                      type="text"
                      placeholder="MM / YY"
                      className="w-full rounded-[12px] border border-gray-200 px-4 py-3 text-[14px] placeholder-gray-400 transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[14px] font-semibold text-base-content">
                      CVV Number*
                    </label>
                    <input
                      type="text"
                      placeholder="CVC"
                      className="w-full rounded-[12px] border border-gray-200 px-4 py-3 text-[14px] placeholder-gray-400 transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Billing Information Panel */}
          <div className="rounded-[20px] border border-gray-200 bg-white p-6 shadow-sm md:p-8">
            <h2 className="mb-6 font-heading text-[20px] font-bold text-base-content">
              Billing Information
            </h2>

            <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[14px] font-semibold text-base-content">
                  Address Line 1
                </label>
                <input
                  type="text"
                  placeholder="Address Line 1"
                  className="w-full rounded-[12px] border border-gray-200 px-4 py-3 text-[14px] placeholder-gray-400 transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[14px] font-semibold text-base-content">
                  Address Line 2
                </label>
                <input
                  type="text"
                  placeholder="Address Line 2"
                  className="w-full rounded-[12px] border border-gray-200 px-4 py-3 text-[14px] placeholder-gray-400 transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[14px] font-semibold text-base-content">
                  Company (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g.: Monsters Inc."
                  className="w-full rounded-[12px] border border-gray-200 px-4 py-3 text-[14px] placeholder-gray-400 transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[14px] font-semibold text-base-content">
                  City
                </label>
                <input
                  type="text"
                  placeholder="Your city"
                  className="w-full rounded-[12px] border border-gray-200 px-4 py-3 text-[14px] placeholder-gray-400 transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[14px] font-semibold text-base-content">
                  Country
                </label>
                <div className="relative">
                  <select className="w-full cursor-pointer appearance-none rounded-[12px] border border-gray-200 bg-white px-4 py-3 text-[14px] text-base-content focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none">
                    <option>United States</option>
                    <option>Canada</option>
                    <option>United Kingdom</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute top-4 right-4 h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[14px] font-semibold text-base-content">
                  State
                </label>
                <div className="relative">
                  <select className="w-full cursor-pointer appearance-none rounded-[12px] border border-gray-200 bg-white px-4 py-3 text-[14px] text-base-content focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none">
                    <option>New York</option>
                    <option>California</option>
                    <option>Texas</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute top-4 right-4 h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[14px] font-semibold text-base-content">
                  ZIP Code
                </label>
                <input
                  type="text"
                  placeholder="Your ZIP code"
                  className="w-full rounded-[12px] border border-gray-200 px-4 py-3 text-[14px] placeholder-gray-400 transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Summary) */}

        <div className="sticky top-6 rounded-[20px] border border-gray-200 bg-white p-6 shadow-md md:p-8">
          <h2 className="mb-8 font-heading text-[22px] font-bold text-base-content">
            Order summary
          </h2>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-[15px] text-gray-600">Selected plan</span>
              <span className="text-[15px] font-bold text-base-content capitalize">
                {currentPlan.name} Plan
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[15px] text-gray-600">
                Price per {currentPlan.mode === "yearly" ? "year" : "month"}
              </span>
              <div className="text-right">
                {price.original > price.final && (
                  <span className="mr-2 text-[15px] font-bold text-gray-400 line-through">
                    ${price.original.toFixed(2)}
                  </span>
                )}
                <span className="text-[16px] font-bold text-base-content">
                  ${price.final.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-6">
              <span className="text-[15px] text-gray-600">Billing cycle</span>
              <span className="text-[15px] font-bold text-base-content capitalize">
                {currentPlan.mode}
              </span>
            </div>

            <div className="border-b border-gray-100 pt-1 pb-6">
              <button
                onClick={() => setIsDiscountOpen(!isDiscountOpen)}
                className="group flex w-full items-center justify-between text-[15px] font-medium text-gray-600 hover:text-primary"
              >
                <span>Have a discount code?</span>
                <ChevronDown
                  className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isDiscountOpen ? "rotate-180 text-primary" : ""}`}
                />
              </button>
              {isDiscountOpen && (
                <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Discount code"
                      className="flex-1 truncate rounded-full border border-gray-200 bg-[#f9fbf9] px-4 py-2 text-[14px] text-base-content focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none"
                    />
                    <button className="rounded-full bg-base-content px-6 py-2 text-[14px] font-bold text-white shadow-sm transition-all hover:bg-black active:scale-95">
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="font-heading text-[20px] font-bold text-base-content">
                Total due today
              </span>
              <span className="font-heading text-[24px] font-bold text-primary">
                ${price.final.toFixed(2)}
              </span>
            </div>

            <p className="mt-6 text-[13px] leading-relaxed text-gray-500">
              You'll be charged{" "}
              <strong className="font-bold text-base-content">
                ${price.final.toFixed(2)}
              </strong>{" "}
              today. Your next payment will be{" "}
              <strong className="font-bold text-base-content">
                ${price.final.toFixed(2)}
              </strong>{" "}
              on{" "}
              <strong className="font-bold text-base-content">
                {(() => {
                  const nextBillingDate = new Date()
                  nextBillingDate.setMonth(
                    nextBillingDate.getMonth() +
                      (currentPlan.mode === "yearly" ? 12 : 1)
                  )
                  return nextBillingDate.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                })()}
              </strong>
              . You can cancel auto-renewal at any time.
            </p>

            <button
              onClick={() => {
                if (currentPlan.stripePaymentLink) {
                  window.location.href = currentPlan.stripePaymentLink
                } else {
                  alert(
                    "Payment integration coming soon! This plan is not yet linked to a Stripe checkout."
                  )
                }
              }}
              className="mt-8 w-full rounded-full bg-primary py-4 text-[16px] font-bold text-white shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] hover:brightness-110 active:scale-95"
            >
              Start your plan
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
