"use client"

import { useState, useEffect, useMemo } from "react"
import { ChevronDown, MoveLeft, ScanBarcode, X } from "lucide-react"
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
  const [isAddCardOpen, setIsAddCardOpen] = useState(false)
  const [isDiscountOpen, setIsDiscountOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("credit_card")

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
          className="group inline-flex items-center text-sm font-bold text-gray-500 transition-colors hover:text-[#FF5924]"
        >
          <MoveLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to plans
        </button>
        <h1 className="font-heading text-[32px] font-bold tracking-tight text-[#1a1a1a]">
          Checkout
        </h1>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_400px]">
        {/* Left Column (Forms) */}
        <div className="space-y-6">
          <div className="rounded-[20px] border border-gray-200 bg-white p-8 shadow-sm">
            <h2 className="font-heading text-[20px] font-bold text-[#1a1a1a]">
              Billing cycle
            </h2>
            <p className="mt-1 mb-6 text-[14px] text-gray-500">
              Choose how often you'd like to be billed for the{" "}
              <span className="font-bold text-[#1a1a1a]">
                {currentPlan.name}
              </span>{" "}
              plan.
            </p>

            <div className="space-y-4">
              {/* Monthly Option */}
              {monthlyPlan && (
                <label className="group flex cursor-pointer items-center gap-3">
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${!isYearly ? "border-[#FF5924]" : "border-gray-200 group-hover:border-gray-300"}`}
                  >
                    {!isYearly && (
                      <div className="h-2.5 w-2.5 rounded-full bg-[#FF5924]"></div>
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
                    <span className="text-[16px] font-bold text-[#1a1a1a]">
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
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${isYearly ? "border-[#FF5924]" : "border-gray-200 group-hover:border-gray-300"}`}
                  >
                    {isYearly && (
                      <div className="h-2.5 w-2.5 rounded-full bg-[#FF5924]"></div>
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
                    <span className="text-[16px] font-bold text-[#1a1a1a]">
                      ${(yearlyPlan.finalPrice / 100).toFixed(2)}
                    </span>
                    <span className="text-[14px] text-gray-500">
                      Every year
                    </span>
                    {monthlyPlan && (
                      <span className="rounded-full bg-[#FFE8E0] px-3 py-1 text-[11px] font-bold tracking-wide text-[#FF5924] uppercase">
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
          <div className="rounded-[20px] border border-gray-200 bg-white p-8 shadow-sm">
            <h2 className="mb-6 font-heading text-[20px] font-bold text-[#1a1a1a]">
              Payment method
            </h2>

            <div className="space-y-6">
              {/* Credit Card */}
              <label className="group flex cursor-pointer items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${paymentMethod === "credit_card" ? "border-[#FF5924]" : "border-gray-200 group-hover:border-gray-300"}`}
                  >
                    {paymentMethod === "credit_card" && (
                      <div className="h-2.5 w-2.5 rounded-full bg-[#FF5924]"></div>
                    )}
                  </div>
                  <input
                    type="radio"
                    name="payment"
                    value="credit_card"
                    className="hidden"
                    checked={paymentMethod === "credit_card"}
                    onChange={() => setPaymentMethod("credit_card")}
                  />
                  <span className="text-[16px] font-bold text-[#1a1a1a]">
                    Credit card
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <img
                      src="https://raw.githubusercontent.com/stripe/stripe-js/master/assets/visa.svg"
                      alt="Visa"
                      className="h-5"
                    />
                    <img
                      src="https://raw.githubusercontent.com/stripe/stripe-js/master/assets/mastercard.svg"
                      alt="Mastercard"
                      className="h-5"
                    />
                  </div>
                  <button
                    onClick={() => setIsAddCardOpen(true)}
                    className="rounded-full border border-gray-200 px-4 py-2 text-[13px] font-bold text-[#1a1a1a] shadow-sm transition-all hover:bg-gray-50 active:scale-95"
                  >
                    Add new card
                  </button>
                </div>
              </label>

              {/* Paypal */}
              <label className="group flex cursor-pointer items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${paymentMethod === "paypal" ? "border-[#FF5924]" : "border-gray-200 group-hover:border-gray-300"}`}
                  >
                    {paymentMethod === "paypal" && (
                      <div className="h-2.5 w-2.5 rounded-full bg-[#FF5924]"></div>
                    )}
                  </div>
                  <input
                    type="radio"
                    name="payment"
                    value="paypal"
                    className="hidden"
                    checked={paymentMethod === "paypal"}
                    onChange={() => setPaymentMethod("paypal")}
                  />
                  <span className="text-[16px] font-bold text-[#1a1a1a]">
                    Paypal
                  </span>
                </div>
                <div className="text-[15px] font-bold tracking-tight text-[#003087] italic">
                  Pay<span className="text-[#0079C1]">Pal</span>
                </div>
              </label>
            </div>
          </div>

          {/* Billing Information Panel */}
          <div className="rounded-[20px] border border-gray-200 bg-white p-8 shadow-sm">
            <h2 className="mb-6 font-heading text-[20px] font-bold text-[#1a1a1a]">
              Billing Information
            </h2>

            <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[14px] font-semibold text-[#1a1a1a]">
                  Address Line 1
                </label>
                <input
                  type="text"
                  placeholder="Address Line 1"
                  className="w-full rounded-[12px] border border-gray-200 px-4 py-3 text-[14px] placeholder-gray-400 transition-all focus:border-[#FF5924] focus:ring-4 focus:ring-[#FF5924]/10 focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[14px] font-semibold text-[#1a1a1a]">
                  Address Line 2
                </label>
                <input
                  type="text"
                  placeholder="Address Line 2"
                  className="w-full rounded-[12px] border border-gray-200 px-4 py-3 text-[14px] placeholder-gray-400 transition-all focus:border-[#FF5924] focus:ring-4 focus:ring-[#FF5924]/10 focus:outline-none"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-[14px] font-semibold text-[#1a1a1a]">
                  Company (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g.: Monsters Inc."
                  className="w-full rounded-[12px] border border-gray-200 px-4 py-3 text-[14px] placeholder-gray-400 transition-all focus:border-[#FF5924] focus:ring-4 focus:ring-[#FF5924]/10 focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[14px] font-semibold text-[#1a1a1a]">
                  City
                </label>
                <input
                  type="text"
                  placeholder="Your city"
                  className="w-full rounded-[12px] border border-gray-200 px-4 py-3 text-[14px] placeholder-gray-400 transition-all focus:border-[#FF5924] focus:ring-4 focus:ring-[#FF5924]/10 focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[14px] font-semibold text-[#1a1a1a]">
                  Country
                </label>
                <div className="relative">
                  <select className="w-full cursor-pointer appearance-none rounded-[12px] border border-gray-200 bg-white px-4 py-3 text-[14px] text-[#1a1a1a] focus:border-[#FF5924] focus:ring-4 focus:ring-[#FF5924]/10 focus:outline-none">
                    <option>United States</option>
                    <option>Canada</option>
                    <option>United Kingdom</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute top-4 right-4 h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[14px] font-semibold text-[#1a1a1a]">
                  State
                </label>
                <div className="relative">
                  <select className="w-full cursor-pointer appearance-none rounded-[12px] border border-gray-200 bg-white px-4 py-3 text-[14px] text-[#1a1a1a] focus:border-[#FF5924] focus:ring-4 focus:ring-[#FF5924]/10 focus:outline-none">
                    <option>New York</option>
                    <option>California</option>
                    <option>Texas</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute top-4 right-4 h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[14px] font-semibold text-[#1a1a1a]">
                  ZIP Code
                </label>
                <input
                  type="text"
                  placeholder="Your ZIP code"
                  className="w-full rounded-[12px] border border-gray-200 px-4 py-3 text-[14px] placeholder-gray-400 transition-all focus:border-[#FF5924] focus:ring-4 focus:ring-[#FF5924]/10 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Summary) */}
        <div>
          <div className="sticky top-6 rounded-[20px] border border-gray-200 bg-white p-8 shadow-md">
            <h2 className="mb-8 font-heading text-[22px] font-bold text-[#1a1a1a]">
              Order summary
            </h2>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-[15px] text-gray-600">Selected plan</span>
                <span className="text-[15px] font-bold text-[#1a1a1a] capitalize">
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
                  <span className="text-[16px] font-bold text-[#1a1a1a]">
                    ${price.final.toFixed(2)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-6">
                <span className="text-[15px] text-gray-600">Billing cycle</span>
                <span className="text-[15px] font-bold text-[#1a1a1a] capitalize">
                  {currentPlan.mode}
                </span>
              </div>

              <div className="border-b border-gray-100 pt-1 pb-6">
                <button
                  onClick={() => setIsDiscountOpen(!isDiscountOpen)}
                  className="group flex w-full items-center justify-between text-[15px] font-medium text-gray-600 hover:text-[#FF5924]"
                >
                  <span>Have a discount code?</span>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isDiscountOpen ? "rotate-180 text-[#FF5924]" : ""}`}
                  />
                </button>
                {isDiscountOpen && (
                  <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Discount code"
                        className="flex-1 truncate rounded-full border border-gray-200 bg-[#f9fbf9] px-4 py-2 text-[14px] text-[#1a1a1a] focus:border-[#FF5924] focus:ring-4 focus:ring-[#FF5924]/10 focus:outline-none"
                      />
                      <button className="rounded-full bg-[#1a1a1a] px-6 py-2 text-[14px] font-bold text-white shadow-sm transition-all hover:bg-black active:scale-95">
                        Apply
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="font-heading text-[20px] font-bold text-[#1a1a1a]">
                  Total due today
                </span>
                <span className="font-heading text-[24px] font-bold text-[#FF5924]">
                  ${price.final.toFixed(2)}
                </span>
              </div>

              <p className="mt-6 text-[13px] leading-relaxed text-gray-500">
                You'll be charged{" "}
                <strong className="font-bold text-[#1a1a1a]">
                  ${price.final.toFixed(2)}
                </strong>{" "}
                today. Your next payment will be ${price.final.toFixed(2)} on{" "}
                {new Date(
                  new Date().setMonth(
                    new Date().getMonth() +
                      (currentPlan.mode === "yearly" ? 12 : 1)
                  )
                ).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
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
                className="mt-8 w-full rounded-full bg-[#FF5924] py-4 text-[16px] font-bold text-white shadow-lg shadow-[#FF5924]/30 transition-all hover:scale-[1.02] hover:brightness-110 active:scale-95"
              >
                Start your plan
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add New Card Modal */}
      {isAddCardOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Add your payment method
              </h2>
              <button
                onClick={() => setIsAddCardOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input type="radio" checked readOnly />
                  <span className="font-semibold text-gray-900">
                    Credit card
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700">
                  Name on Card*
                </label>
                <input
                  type="text"
                  placeholder="e.g.: Jane Johnson"
                  className="mt-1 w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-primary/30 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-[3fr_1fr_1fr] gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Credit Card Number*
                  </label>
                  <input
                    type="text"
                    placeholder="1234 1234 1234 1234"
                    className="mt-1 w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-primary/30 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Expiration Date*
                  </label>
                  <input
                    type="text"
                    placeholder="MM / YY"
                    className="mt-1 w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-primary/30 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    CVV Number*
                  </label>
                  <input
                    type="text"
                    placeholder="CVC"
                    className="mt-1 w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-primary/30 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t px-8 py-6">
              <button
                onClick={() => setIsAddCardOpen(false)}
                className="rounded-full border px-6 py-2.5 text-sm font-bold text-[#1a1a1a] transition-all hover:bg-gray-50 active:scale-95"
              >
                Cancel
              </button>
              <button className="rounded-full bg-[#FF5924] px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#FF5924]/20 transition-all hover:brightness-110 active:scale-95">
                Save Card
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
