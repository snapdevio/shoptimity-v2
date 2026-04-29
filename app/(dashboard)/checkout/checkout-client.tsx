"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import {
  ChevronDown,
  MoveLeft,
  Loader2,
  CreditCard,
  Plus,
  Check,
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  getUserCards,
  createSetupIntent,
  getBillingInfo,
  validateCoupon,
} from "@/actions/billing"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, useStripe } from "@stripe/react-stripe-js"
import { CardForm } from "@/components/checkout/card-form"
import { Country, State, City } from "country-state-city"

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)

interface Plan {
  id: string
  name: string
  mode: string
  slots: number
  regularPrice: number
  finalPrice: number
  currency: string
  yearlyDiscountPercentage?: number | null
  yearlyDiscountCouponCode?: string | null
  couponCode?: string | null
  stripePaymentLink?: string | null
  trialDays: number
}

interface CheckoutClientProps {
  initialPlan: Plan
  allPlans: Plan[]
  initialEmail?: string
  initialName?: string
  initialIsYearly?: boolean
}

export function CheckoutClient(props: CheckoutClientProps) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutInner {...props} />
    </Elements>
  )
}

function CheckoutInner({
  initialPlan,
  allPlans,
  initialEmail = "",
  initialName = "",
  initialIsYearly = false,
}: CheckoutClientProps) {
  const router = useRouter()
  const stripe = useStripe()
  const searchParams = useSearchParams()

  // Find plans with the same name (to switch between monthly/yearly)
  const relatedPlans = useMemo(() => {
    return allPlans.filter((p) => p.name === initialPlan.name)
  }, [allPlans, initialPlan.name])

  const monthlyPlan = relatedPlans.find((p) => p.mode === "monthly")
  const yearlyPlan = relatedPlans.find((p) => p.mode === "yearly")

  const [currentPlan, setCurrentPlan] = useState<Plan>(() => {
    if (initialIsYearly && yearlyPlan) return yearlyPlan
    return initialPlan
  })
  const [isYearly, setIsYearly] = useState(
    initialIsYearly || initialPlan.mode === "yearly"
  )
  const [couponCode, setCouponCode] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string
    name: string
    percentOff?: number | null
    amountOff?: number | null
  } | null>(null)
  const [isDiscountOpen, setIsDiscountOpen] = useState(false)
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false)
  const [couponError, setCouponError] = useState<string | null>(null)

  // Form states
  // const [domains, setDomains] = useState<string[]>([""])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [savedCards, setSavedCards] = useState<any[]>([])
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [isInitializingSetup, setIsInitializingSetup] = useState(false)
  const [attemptedSubmit, setAttemptedSubmit] = useState(false)
  const paymentRef = useRef<HTMLDivElement>(null)

  // Address states (Consolidated)
  // Handle Auto-applying Coupons from Plan
  useEffect(() => {
    const targetCoupon = isYearly
      ? currentPlan.yearlyDiscountCouponCode
      : currentPlan.couponCode

    if (targetCoupon && !appliedCoupon && !isValidatingCoupon) {
      console.log(`Auto-applying coupon from plan: ${targetCoupon}`)
      setCouponCode(targetCoupon)

      const autoApply = async () => {
        setIsValidatingCoupon(true)
        setCouponError(null)
        try {
          const res = await validateCoupon(targetCoupon)
          if ("id" in res) {
            setAppliedCoupon({
              id: String(res.id),
              name: res.name as string,
              percentOff: res.percentOff,
              amountOff: res.amountOff,
            })
            setIsDiscountOpen(true)
          }
        } catch (err) {
          console.error("Auto-apply failed", err)
        } finally {
          setIsValidatingCoupon(false)
        }
      }

      autoApply()
    }
  }, [
    currentPlan.id,
    isYearly,
    currentPlan.couponCode,
    currentPlan.yearlyDiscountCouponCode,
  ])

  const [billingData, setBillingData] = useState({
    line1: "",
    line2: "",
    company: "",
    country: "",
    state: "",
    city: "",
    postalCode: "",
  })

  const countries = useMemo(() => Country.getAllCountries(), [])
  const states = useMemo(() => {
    return billingData.country
      ? State.getStatesOfCountry(billingData.country)
      : []
  }, [billingData.country])
  const cities = useMemo(() => {
    return billingData.country && billingData.state
      ? City.getCitiesOfState(billingData.country, billingData.state)
      : []
  }, [billingData.country, billingData.state])

  async function loadCards() {
    try {
      const cards = await getUserCards()
      setSavedCards(cards)
      // Only auto-select if one is default
      const def = cards.find((c) => c.isDefault) || cards[0]
      if (def) setSelectedCardId(def.id)
    } catch (err) {
      console.error("Failed to load cards:", err)
    }
  }

  async function loadBillingInfo() {
    try {
      const info = await getBillingInfo()
      if (info) {
        setBillingData({
          line1: info.line1 || "",
          line2: info.line2 || "",
          company: info.company || "",
          country: info.country || "",
          state: info.state || "",
          city: info.city || "",
          postalCode: info.postalCode || "",
        })
      }
    } catch (err) {
      console.error("Failed to load billing info:", err)
    }
  }

  useEffect(() => {
    loadCards()
    loadBillingInfo()
  }, [])

  const handleAddNewCard = async () => {
    setIsInitializingSetup(true)
    try {
      const res = await createSetupIntent()
      if (res.error) throw new Error(res.error)
      setClientSecret(res.clientSecret!)
      setIsAddingCard(true)
      setSelectedCardId(null)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsInitializingSetup(false)
    }
  }

  const handleCardSuccess = async (paymentMethodId: string) => {
    await loadCards()
    setSelectedCardId(paymentMethodId)
    setIsAddingCard(false)
    setClientSecret(null)
  }

  // Update plan when billing cycle changes
  useEffect(() => {
    if (isYearly && yearlyPlan) {
      setCurrentPlan(yearlyPlan)
    } else if (!isYearly && monthlyPlan) {
      setCurrentPlan(monthlyPlan)
    }
  }, [isYearly, monthlyPlan, yearlyPlan])

  const handleApplyCoupon = async () => {
    const trimmedCode = couponCode.trim()
    if (!trimmedCode) return

    // Prevent yearly-only coupons on monthly plans
    if (!isYearly && currentPlan.yearlyDiscountCouponCode === trimmedCode) {
      setCouponError("This code is only valid for yearly plans")
      return
    }

    setIsValidatingCoupon(true)
    setCouponError(null)
    try {
      const res = await validateCoupon(couponCode)
      if ("error" in res && res.error) {
        setCouponError(res.error)
        setAppliedCoupon(null)
      } else if ("id" in res) {
        setAppliedCoupon({
          id: String(res.id),
          name: res.name as string,
          percentOff: res.percentOff,
          amountOff: res.amountOff,
        })
        toast.success("Discount applied!")
      }
    } catch (err) {
      setCouponError("Failed to apply discount code")
    } finally {
      setIsValidatingCoupon(false)
    }
  }

  const price = useMemo(() => {
    // Standardize on finalPrice as the baseline
    const basePrice = monthlyPlan?.finalPrice || currentPlan.finalPrice
    let original = basePrice / 100
    let label = "Discount"
    let effectiveMonthly = original

    if (isYearly) {
      original = (basePrice * 12) / 100
      effectiveMonthly = original / 12
      label = "Yearly Savings"
    }

    const finalBeforeCoupon = isYearly
      ? (basePrice * 12) / 100
      : currentPlan.finalPrice / 100
    let couponSavings = 0
    if (appliedCoupon) {
      if (appliedCoupon.percentOff) {
        couponSavings = (finalBeforeCoupon * appliedCoupon.percentOff) / 100
      } else if (appliedCoupon.amountOff) {
        couponSavings = appliedCoupon.amountOff / 100
      }
    }

    const final = Math.max(0, finalBeforeCoupon - couponSavings)
    const baseSavings = original - finalBeforeCoupon
    const percent =
      original > 0 ? Math.round((baseSavings / original) * 100) : 0

    return {
      original,
      final,
      baseSavings: baseSavings > 0 ? baseSavings : 0,
      couponSavings,
      percent: percent > 0 ? percent : 0,
      label,
      effectiveMonthly,
    }
  }, [isYearly, currentPlan, monthlyPlan, yearlyPlan, appliedCoupon])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAttemptedSubmit(true)

    if (!initialEmail || !initialName) {
      toast.error("Form Incomplete", {
        description: "Please fill in your name and email to proceed.",
      })
      return
    }

    if (!selectedCardId && !isFreePlan) {
      paymentRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      })
      toast.error("Payment method required", {
        description: "Please select or add a payment method to continue.",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: currentPlan.id,
          email: initialEmail.trim(),
          contactName: initialName.trim(),
          // licenseQuantity: domains.length,
          // domains: domains.filter((d) => d.trim() !== ""),
          paymentCardId: selectedCardId,
          isYearly: isYearly,
          promoCode: appliedCoupon?.id,
          address: {
            line1: billingData.line1,
            line2: billingData.line2,
            city: billingData.city,
            state: billingData.state,
            postal_code: billingData.postalCode,
            country: billingData.country,
            company: billingData.company,
          },
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Checkout failed")

      if (data.url) {
        // Fallback to Stripe Checkout UI if requested
        window.location.href = data.url
      } else if (data.success) {
        toast.success("Plan activated successfully!")
        router.push("/licenses")
      } else if (
        data.requiresAction &&
        data.paymentIntentClientSecret &&
        stripe
      ) {
        // Handle Strong Customer Authentication (SCA)
        const { error } = await stripe.confirmCardPayment(
          data.paymentIntentClientSecret
        )
        if (error) {
          throw new Error(error.message)
        }
        toast.success("Plan activated successfully!")
        router.push("/licenses")
      }
    } catch (err: any) {
      toast.error("Checkout Failed", {
        description:
          err.message ||
          "An unexpected error occurred during checkout. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFreePlan = currentPlan.finalPrice === 0

  const handleBillingChange = (yearly: boolean) => {
    setIsYearly(yearly)
    // Reset coupon when switching billing cycles
    setAppliedCoupon(null)
    setCouponCode("")
    setCouponError(null)

    const targetPlan = yearly ? yearlyPlan || monthlyPlan : monthlyPlan
    if (targetPlan) {
      const params = new URLSearchParams(searchParams.toString())
      params.set("planId", targetPlan.id)
      params.set("isyearly", yearly ? "true" : "false")
      router.replace(`?${params.toString()}`, { scroll: false })
    }
  }

  const isButtonDisabled = isSubmitting || isAddingCard

  return (
    <div className="animate-in duration-500 fade-in">
      <div className="mb-6 flex flex-col items-start gap-2">
        <button
          onClick={() => router.push("/plans")}
          className="group inline-flex cursor-pointer items-center text-sm font-bold text-gray-500 transition-colors hover:text-primary"
        >
          <MoveLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to plans
        </button>
        <h1 className="font-heading text-[32px] font-bold tracking-tight text-base-content">
          Checkout
        </h1>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          {!isFreePlan && (
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
                {monthlyPlan && (
                  <label
                    className={cn(
                      "group flex cursor-pointer items-center gap-4 rounded-2xl border-2 p-4 transition-all",
                      !isYearly
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-gray-100 hover:border-gray-200"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                        !isYearly
                          ? "border-primary"
                          : "border-gray-300 group-hover:border-gray-400"
                      )}
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
                    <div className="flex flex-1 flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[16px] font-bold text-base-content">
                          Monthly billing
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-[18px] font-bold text-base-content">
                          ${(monthlyPlan.finalPrice / 100).toFixed(2)}
                        </span>
                        <span className="text-[14px] text-gray-500">
                          per month
                        </span>
                      </div>
                    </div>
                  </label>
                )}

                {(yearlyPlan ||
                  (monthlyPlan &&
                    monthlyPlan.yearlyDiscountPercentage &&
                    monthlyPlan.yearlyDiscountPercentage > 0)) &&
                  (() => {
                    const discountPercent =
                      yearlyPlan?.yearlyDiscountPercentage ||
                      monthlyPlan?.yearlyDiscountPercentage ||
                      0
                    const baseMonthly =
                      monthlyPlan?.finalPrice || currentPlan.finalPrice
                    let yearlyTotal = 0
                    let monthlyEquivalent = 0

                    if (yearlyPlan) {
                      yearlyTotal = yearlyPlan.finalPrice / 100
                      monthlyEquivalent = yearlyTotal / 12
                    } else {
                      const discountedMonthly = Math.round(
                        baseMonthly * (1 - discountPercent / 100)
                      )
                      yearlyTotal = (discountedMonthly * 12) / 100
                      monthlyEquivalent = discountedMonthly / 100
                    }

                    return (
                      <label
                        className={cn(
                          "group flex cursor-pointer items-center gap-4 rounded-2xl border-2 p-4 transition-all",
                          isYearly
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-gray-100 hover:border-gray-200"
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                            isYearly
                              ? "border-primary"
                              : "border-gray-300 group-hover:border-gray-400"
                          )}
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
                        <div className="flex flex-1 flex-col gap-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[16px] font-bold text-base-content">
                              Yearly billing
                            </span>
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold tracking-wide text-emerald-700 uppercase">
                              Save {discountPercent}%
                            </span>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-[18px] font-bold text-base-content">
                              ${monthlyEquivalent.toFixed(2)}
                            </span>
                            <span className="text-[14px] text-gray-500">
                              per month, billed annually
                            </span>
                          </div>
                          <div className="text-[12px] text-gray-400">
                            Total: ${yearlyTotal.toFixed(2)}/year
                          </div>
                        </div>
                      </label>
                    )
                  })()}
              </div>
            </div>
          )}
          <div
            ref={paymentRef}
            className={cn(
              "rounded-[20px] border p-6 shadow-sm transition-all md:p-8",
              attemptedSubmit && !selectedCardId && !isFreePlan
                ? "border-red-500 bg-red-50/30 ring-4 ring-red-500/10"
                : "border-gray-200 bg-white"
            )}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-heading text-[20px] font-bold text-base-content">
                {isFreePlan ? "Payment (Optional)" : "Payment method"}
                {attemptedSubmit && !selectedCardId && !isFreePlan && (
                  <span className="animate-pulse text-[12px] font-bold text-red-500">
                    (Required)
                  </span>
                )}
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
              {/* {!isFreePlan && <CreditCard className="h-5 w-5 text-gray-400" />} */}
            </div>

            {isFreePlan ? (
              <div className="rounded-xl bg-gray-50 p-4 text-center">
                <p className="text-sm text-gray-500">
                  No payment method required for this free plan. You can just
                  activate it directly.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {savedCards.length > 0 && (
                  <div className="grid gap-3">
                    {savedCards.map((card) => (
                      <div
                        key={card.id}
                        onClick={() => {
                          if (!isAddingCard) setSelectedCardId(card.id)
                        }}
                        className={cn(
                          "flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all hover:bg-gray-50",
                          selectedCardId === card.id
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-gray-200",
                          isAddingCard && "cursor-not-allowed opacity-50"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-5 w-5 text-gray-400" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-slate-900 uppercase">
                                {card.brand} •••• {card.last4}
                              </p>
                              {card.isDefault && (
                                <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              Expires {card.cardExpMonth}/{card.cardExpYear}
                            </p>
                          </div>
                        </div>
                        {selectedCardId === card.id && (
                          <Check className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {isAddingCard && clientSecret ? (
                  <div className="animate-in rounded-xl border border-primary/20 bg-primary/5 p-4 duration-300 slide-in-from-top-2">
                    <CardForm
                      clientSecret={clientSecret}
                      onSuccess={handleCardSuccess}
                      onCancel={() => setIsAddingCard(false)}
                    />
                  </div>
                ) : (
                  <button
                    onClick={handleAddNewCard}
                    disabled={isInitializingSetup}
                    className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-gray-200 p-4 transition-all hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      {isInitializingSetup ? (
                        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                      ) : (
                        <Plus className="h-5 w-5 text-gray-400" />
                      )}
                      <p className="text-sm font-bold">
                        Add a new payment method
                      </p>
                    </div>
                  </button>
                )}

                {!isAddingCard && savedCards.length === 0 && (
                  <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-gray-300 p-8 text-center">
                    <div className="rounded-full bg-gray-50 p-3">
                      <CreditCard className="h-6 w-6 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-[15px] font-bold text-base-content">
                        No payment method added
                      </p>
                      <p className="text-sm text-gray-500">
                        Add a card to complete your purchase
                      </p>
                    </div>
                    <button
                      onClick={handleAddNewCard}
                      disabled={isInitializingSetup}
                      className="inline-flex items-center gap-2 rounded-full bg-base-content px-6 py-2.5 text-[14px] font-bold text-white transition-all hover:bg-black active:scale-95 disabled:opacity-50"
                    >
                      {isInitializingSetup && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}
                      Add Payment Method
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="rounded-[20px] border border-gray-200 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-heading text-[20px] font-bold text-base-content">
                Billing Information
              </h2>
            </div>

            <div className="space-y-4">
              {/* Detailed Address Fields */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[14px] font-semibold text-base-content">
                    Address Line 1
                  </label>
                  <input
                    type="text"
                    value={billingData.line1}
                    onChange={(e) =>
                      setBillingData((prev) => ({
                        ...prev,
                        line1: e.target.value,
                      }))
                    }
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
                    value={billingData.line2}
                    onChange={(e) =>
                      setBillingData((prev) => ({
                        ...prev,
                        line2: e.target.value,
                      }))
                    }
                    placeholder="Address Line 2"
                    className="w-full rounded-[12px] border border-gray-200 px-4 py-3 text-[14px] placeholder-gray-400 transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-[14px] font-semibold text-base-content">
                    Company (optional)
                  </label>
                  <input
                    type="text"
                    value={billingData.company}
                    onChange={(e) =>
                      setBillingData((prev) => ({
                        ...prev,
                        company: e.target.value,
                      }))
                    }
                    placeholder="e.g.: Monsters Inc."
                    className="w-full rounded-[12px] border border-gray-200 px-4 py-3 text-[14px] placeholder-gray-400 transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[14px] font-semibold text-base-content">
                    Country
                  </label>
                  <div className="relative">
                    <select
                      value={billingData.country}
                      onChange={(e) =>
                        setBillingData((prev) => ({
                          ...prev,
                          country: e.target.value,
                          state: "",
                          city: "",
                        }))
                      }
                      className="w-full cursor-pointer appearance-none rounded-[12px] border border-gray-200 bg-white px-4 py-3 text-[14px] focus:border-primary focus:outline-none"
                    >
                      <option value="">Select Country</option>
                      {countries.map((c) => (
                        <option key={c.isoCode} value={c.isoCode}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute top-4 right-4 h-4 w-4 text-gray-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[14px] font-semibold text-base-content">
                    State
                  </label>
                  <div className="relative">
                    <select
                      value={billingData.state}
                      onChange={(e) =>
                        setBillingData((prev) => ({
                          ...prev,
                          state: e.target.value,
                          city: "",
                        }))
                      }
                      disabled={!billingData.country}
                      className="w-full cursor-pointer appearance-none rounded-[12px] border border-gray-200 bg-white px-4 py-3 text-[14px] focus:border-primary focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
                    >
                      <option value="">Select State</option>
                      {states.map((s) => (
                        <option key={s.isoCode} value={s.isoCode}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute top-4 right-4 h-4 w-4 text-gray-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[14px] font-semibold text-base-content">
                    City
                  </label>
                  <div className="relative">
                    <select
                      value={billingData.city}
                      onChange={(e) =>
                        setBillingData((prev) => ({
                          ...prev,
                          city: e.target.value,
                        }))
                      }
                      disabled={!billingData.state}
                      className="w-full cursor-pointer appearance-none rounded-[12px] border border-gray-200 bg-white px-4 py-3 text-[14px] focus:border-primary focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
                    >
                      <option value="">Select City</option>
                      {cities.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
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
                    value={billingData.postalCode}
                    onChange={(e) =>
                      setBillingData((prev) => ({
                        ...prev,
                        postalCode: e.target.value,
                      }))
                    }
                    placeholder="Your ZIP code"
                    className="w-full rounded-[12px] border border-gray-200 px-4 py-3 text-[14px] placeholder-gray-400 transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky top-6 rounded-[20px] border border-gray-200 bg-white p-6 shadow-md md:p-8">
          <h2 className="mb-8 font-heading text-[22px] font-bold text-base-content">
            Order summary
          </h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-[15px] text-gray-600">
                {isFreePlan
                  ? "Plan price"
                  : isYearly
                    ? "Effective monthly price"
                    : "Plan price"}
              </span>
              <span className="text-[15px] font-bold text-base-content">
                {isFreePlan
                  ? "Free"
                  : `$${price.effectiveMonthly.toFixed(2)} / month`}
              </span>
            </div>
            {isYearly && !isFreePlan && (
              <div className="flex items-center justify-between">
                <span className="text-[15px] text-gray-600">
                  Billed annually
                </span>
                <span className="text-[15px] font-bold text-base-content">
                  x 12 months
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-[15px] text-gray-600">Subtotal</span>
              <span className="text-[15px] font-bold text-base-content">
                ${price.original.toFixed(2)}
              </span>
            </div>
            {price.baseSavings > 0 && (
              <div className="flex items-center justify-between text-emerald-600">
                <span className="text-[15px] font-medium">
                  {price.label} ({price.percent}%)
                </span>
                <span className="text-[15px] font-bold">
                  -${price.baseSavings.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-[15px] text-gray-600">Billing cycle</span>
              <span className="text-[15px] font-bold text-base-content capitalize">
                {isFreePlan ? "Free Forever" : isYearly ? "Yearly" : "Monthly"}
              </span>
            </div>
            {price.couponSavings > 0 && (
              <div className="flex items-center justify-between text-gray-800">
                <span className="text-[15px] font-medium">
                  Discount Code{" "}
                  <span className="text-[10px]">({appliedCoupon?.name})</span>
                </span>
                <span className="text-[15px] font-bold">
                  -${price.couponSavings.toFixed(2)}
                </span>
              </div>
            )}
            <div className="border-y border-gray-100 py-3">
              <button
                onClick={() => setIsDiscountOpen(!isDiscountOpen)}
                className="group flex w-full cursor-pointer items-center justify-between text-[15px] font-medium text-gray-600 hover:text-primary"
              >
                <span>Have a discount code?</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-gray-400 transition-transform duration-200",
                    isDiscountOpen && "rotate-180 text-primary"
                  )}
                />
              </button>
              {isDiscountOpen && (
                <div className="mt-4 animate-in fade-in slide-in-from-top-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      disabled={!!appliedCoupon || isValidatingCoupon}
                      onChange={(e) => {
                        setCouponCode(e.target.value)
                        setCouponError(null)
                      }}
                      placeholder="Discount code"
                      className={cn(
                        "flex-1 rounded-full border px-4 py-2 text-[14px] transition-all focus:outline-none",
                        couponError
                          ? "border-red-300 bg-red-50/50 focus:border-red-500"
                          : appliedCoupon
                            ? "border-orange-200 bg-orange-50 text-orange-700"
                            : "border-gray-200 bg-[#f9fbf9] focus:border-primary",
                        (appliedCoupon || isValidatingCoupon) &&
                          "cursor-not-allowed"
                      )}
                    />
                    <button
                      onClick={
                        appliedCoupon
                          ? () => {
                              setAppliedCoupon(null)
                              setCouponCode("")
                              setCouponError(null)
                            }
                          : handleApplyCoupon
                      }
                      disabled={
                        (!appliedCoupon && couponCode.trim().length < 2) ||
                        isValidatingCoupon
                      }
                      className={cn(
                        "rounded-full bg-orange-600 px-6 py-2 text-[14px] font-bold text-white transition-all hover:bg-orange-700",
                        ((!appliedCoupon && couponCode.trim().length < 2) ||
                          isValidatingCoupon) &&
                          "cursor-not-allowed opacity-50"
                      )}
                    >
                      {isValidatingCoupon ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : appliedCoupon ? (
                        "Remove"
                      ) : (
                        "Apply"
                      )}
                    </button>
                  </div>

                  {couponError && (
                    <p className="mt-2 ml-1 animate-in text-[13px] font-medium text-red-500 fade-in slide-in-from-top-1">
                      {couponError}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="font-heading text-[20px] font-bold text-base-content">
                Total due today
              </span>
              <span className="font-heading text-[24px] font-bold text-primary">
                ${currentPlan.trialDays > 0 ? "0.00" : price.final.toFixed(2)}
              </span>
            </div>
            <p className="mt-6 text-[13px] text-gray-500">
              {isFreePlan ? (
                <>
                  You'll be charged{" "}
                  <strong className="text-base-content">$0.00</strong> today. No
                  future payments will be required for this free plan.
                </>
              ) : currentPlan.trialDays > 0 ? (
                <>
                  You won't be charged today. Your{" "}
                  <strong className="text-base-content">
                    {currentPlan.trialDays}-day free trial
                  </strong>{" "}
                  starts now. First payment of{" "}
                  <strong className="text-base-content">
                    ${price.final.toFixed(2)}
                  </strong>{" "}
                  on{" "}
                  <strong className="text-base-content">
                    {new Date(
                      Date.now() + currentPlan.trialDays * 86400000
                    ).toLocaleDateString()}
                  </strong>
                  .{" "}
                  {appliedCoupon && (
                    <span className="inline-flex animate-in items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[12px] font-bold text-emerald-600 zoom-in-95">
                      <Check className="h-3 w-3" />
                      {appliedCoupon.percentOff
                        ? `${appliedCoupon.percentOff}% off applied to future payment`
                        : `$${(appliedCoupon.amountOff! / 100).toFixed(2)} off applied to future payment`}
                    </span>
                  )}
                </>
              ) : (
                <>
                  You'll be charged{" "}
                  <strong className="text-base-content">
                    ${price.final.toFixed(2)}
                  </strong>{" "}
                  today. Next payment on{" "}
                  <strong className="text-base-content">
                    {new Date(
                      Date.now() + (isYearly ? 365 : 30) * 86400000
                    ).toLocaleDateString()}
                  </strong>
                  .
                </>
              )}
            </p>
            <button
              onClick={handleSubmit}
              disabled={isButtonDisabled}
              className="mt-8 flex w-full cursor-pointer items-center justify-center rounded-full bg-primary py-4 text-[16px] font-bold text-white shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] disabled:opacity-70"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : isFreePlan ? (
                "Activate Free Plan"
              ) : currentPlan.trialDays > 0 ? (
                "Start Free Trial"
              ) : (
                "Complete Purchase"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
