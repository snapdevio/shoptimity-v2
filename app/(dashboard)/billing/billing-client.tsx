"use client"

import { useState, useMemo, useEffect } from "react"
import {
  CreditCard,
  History,
  MapPin,
  Plus,
  Trash2,
  Check,
  Loader2,
  ChevronDown,
  FileText,
} from "lucide-react"
import { useRouter } from "next/navigation"
import {
  setDefaultCard,
  removeCard,
  createSetupIntent,
  updateBillingInfo,
  reactivateSubscription,
  previewSubscriptionUpgrade,
  upgradeSubscriptionToYearly,
} from "@/actions/billing"
import { toast } from "sonner"
import { loadStripe } from "@stripe/stripe-js"
import { Elements } from "@stripe/react-stripe-js"
import { CardForm } from "@/components/checkout/card-form"
import { cn } from "@/lib/utils"
import { Country, State, City } from "country-state-city"

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)

interface Card {
  id: string
  last4: string
  brand: string
  cardExpMonth: number
  cardExpYear: number
  isDefault: boolean
  cardholderName: string | null
}

interface BillingInfo {
  line1: string
  line2: string
  city: string
  state: string
  postalCode: string
  country: string
  company: string
}

interface Payment {
  id: string
  amount: number
  currency: string
  status: string
  stripeInvoiceUrl: string | null
  appliedPromoCode: string | null
  createdAt: Date
  planName: string | null
}

interface BillingClientProps {
  initialCards: Card[]
  activeLicense: any
  initialBillingInfo: BillingInfo
  userPayments: Payment[]
  nextPaymentDate: number | null
}

export function BillingClient({
  initialCards,
  activeLicense,
  initialBillingInfo,
  userPayments,
  nextPaymentDate,
}: BillingClientProps) {
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [isPending, setIsPending] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [isInitializingSetup, setIsInitializingSetup] = useState(false)

  // Billing Info States
  const [isEditingBilling, setIsEditingBilling] = useState(false)
  const [isSavingBilling, setIsSavingBilling] = useState(false)
  const [billingData, setBillingData] = useState(initialBillingInfo)

  // Upgrade Modal States
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false)
  const [upgradePreview, setUpgradePreview] = useState<any>(null)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [isUpgrading, setIsUpgrading] = useState(false)

  const router = useRouter()
  const [hasShownToast, setHasShownToast] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const error = params.get("error")

    if (error === "no_subscription" && !hasShownToast) {
      toast.error("No active subscription found for this operation.")
      setHasShownToast(true)
      // Clean up the URL
      const newUrl = window.location.pathname
      window.history.replaceState({}, "", newUrl)
    }
  }, [hasShownToast])

  // Location Data
  const countries = useMemo(() => Country.getAllCountries(), [])

  const selectedCountryObj = useMemo(() => {
    return countries.find(
      (c) => c.isoCode === billingData.country || c.name === billingData.country
    )
  }, [countries, billingData.country])

  const states = useMemo(() => {
    if (!selectedCountryObj) return []
    return State.getStatesOfCountry(selectedCountryObj.isoCode)
  }, [selectedCountryObj])

  const selectedStateObj = useMemo(() => {
    return states.find(
      (s) => s.isoCode === billingData.state || s.name === billingData.state
    )
  }, [states, billingData.state])

  const cities = useMemo(() => {
    if (!selectedCountryObj || !selectedStateObj) return []
    return City.getCitiesOfState(
      selectedCountryObj.isoCode,
      selectedStateObj.isoCode
    )
  }, [selectedCountryObj, selectedStateObj])

  const handleCountryChange = (countryCode: string) => {
    setBillingData({
      ...billingData,
      country: countryCode,
      state: "",
      city: "",
    })
  }

  const handleStateChange = (stateCode: string) => {
    setBillingData({
      ...billingData,
      state: stateCode,
      city: "",
    })
  }

  const handleSetDefault = async (cardId: string) => {
    setIsPending(cardId)
    try {
      const res = await setDefaultCard(cardId)
      if (res.error) throw new Error(res.error)
      toast.success("Default payment method updated")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsPending(null)
    }
  }

  const handleRemoveCard = async (cardId: string) => {
    if (!confirm("Are you sure you want to remove this card?")) return
    setIsPending(cardId)
    try {
      const res = await removeCard(cardId)
      if (res.error) throw new Error(res.error)
      toast.success("Card removed successfully")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsPending(null)
    }
  }

  const handleAddCard = async () => {
    setIsInitializingSetup(true)
    try {
      const res = await createSetupIntent()
      if (res.error) throw new Error(res.error)
      setClientSecret(res.clientSecret!)
      setIsAddingCard(true)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsInitializingSetup(false)
    }
  }

  const handleCardSuccess = async () => {
    setIsAddingCard(false)
    setClientSecret(null)
    toast.success("New payment method added")
    router.refresh()
  }

  const handleSaveBilling = async () => {
    setIsSavingBilling(true)
    try {
      const res = await updateBillingInfo({
        addressLine1: billingData.line1,
        addressLine2: billingData.line2,
        city: billingData.city,
        state: billingData.state,
        zipCode: billingData.postalCode,
        country: billingData.country,
        company: billingData.company,
      })
      if (res.error) throw new Error(res.error)
      toast.success("Billing information updated")
      setIsEditingBilling(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsSavingBilling(false)
    }
  }

  const handleReactivate = async () => {
    if (!activeLicense?.stripeSubscriptionId) return
    setIsPending("reactivate")
    try {
      const res = await reactivateSubscription(
        activeLicense.stripeSubscriptionId
      )
      if (res.error) throw new Error(res.error)
      toast.success("Subscription reactivated successfully!")
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsPending(null)
    }
  }

  const handlePreviewUpgrade = async () => {
    setIsPreviewing(true)
    try {
      const res = await previewSubscriptionUpgrade(activeLicense.id)
      if (res.error) throw new Error(res.error)
      setUpgradePreview(res.preview)
      setIsUpgradeModalOpen(true)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsPreviewing(false)
    }
  }

  const handleConfirmUpgrade = async () => {
    if (!upgradePreview) return
    setIsUpgrading(true)
    try {
      const res = await upgradeSubscriptionToYearly(
        activeLicense.id,
        upgradePreview.yearlyPlanId,
        upgradePreview.finalYearlyAmount
      )
      if (res.error) throw new Error(res.error)
      toast.success(res.message)
      setIsUpgradeModalOpen(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsUpgrading(false)
    }
  }

  const defaultCard = initialCards.find((c) => c.isDefault) || initialCards[0]

  return (
    <Elements stripe={stripePromise}>
      <div className="flex-1 overflow-x-hidden overflow-y-auto">
        <div className="mx-auto w-full">
          {/* Title */}
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
                Billing & Subscription
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Manage your plan, billing information and payment methods.
              </p>
            </div>
          </div>

          <div className="grid gap-6">
            {/* Plan Details Card */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md">
              <div className="p-4 md:p-6">
                <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
                  <div className="flex items-center gap-6">
                    <div>
                      <h4 className="text-xl font-bold text-slate-900">
                        Plan details
                      </h4>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-3 sm:flex-row">
                    {activeLicense?.cancelAtPeriodEnd ? (
                      <button
                        onClick={handleReactivate}
                        disabled={isPending === "reactivate"}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-bold text-emerald-700 transition-all hover:bg-emerald-100 active:scale-95 disabled:opacity-50 sm:w-auto"
                      >
                        {isPending === "reactivate" && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        Reactivate Plan
                      </button>
                    ) : (
                      <button
                        onClick={() => router.push("/billing/cancel")}
                        className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 active:scale-95 sm:w-auto"
                      >
                        Cancel Plan
                      </button>
                    )}
                    {activeLicense?.billingCycle === "monthly" &&
                      activeLicense?.plan?.mode !== "free" &&
                      !activeLicense?.isLifetime && (
                        <button
                          onClick={handlePreviewUpgrade}
                          disabled={isPreviewing}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-50 sm:w-auto"
                        >
                          {isPreviewing && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          )}
                          Upgrade to Yearly (Save {activeLicense?.plan?.yearlyDiscountPercentage || 20}%)
                        </button>
                      )}
                    <button
                      className="w-full cursor-pointer rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:brightness-110 active:scale-95 sm:w-auto"
                      onClick={() => router.push("/plans")}
                    >
                      Upgrade Plan
                    </button>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-6 rounded-2xl bg-slate-50 p-6 text-center sm:grid-cols-3 lg:grid-cols-7">
                  <div>
                    <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                      Plan name
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {activeLicense?.plan?.name || "No active plan"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                      Renewal Date
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {nextPaymentDate
                        ? new Date(nextPaymentDate * 1000).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          }
                        )
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                      Next Payment
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {(() => {
                        if (!activeLicense?.plan?.finalPrice) return "$0.00"
                        if (activeLicense.billingCycle === "yearly") {
                          const monthly = activeLicense.plan.finalPrice
                          const discount =
                            (activeLicense.plan.yearlyDiscountPercentage || 0) / 100
                          return `$${((monthly * 12 * (1 - discount)) / 100).toFixed(2)}`
                        }
                        return `$${(activeLicense.plan.finalPrice / 100).toFixed(2)}`
                      })()}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                      Subscription
                    </p>
                    <div className="mt-1 text-sm font-bold text-slate-900">
                      {(() => {
                        if (!activeLicense?.plan?.finalPrice) return "$0.00"
                        if (activeLicense.billingCycle === "yearly") {
                          const monthly = activeLicense.plan.finalPrice
                          const discount =
                            (activeLicense.plan.yearlyDiscountPercentage || 0) / 100
                          const yearlyTotal = monthly * 12 * (1 - discount)
                          return `$${(yearlyTotal / 100).toFixed(2)}/yr`
                        }
                        return `$${(activeLicense.plan.finalPrice / 100).toFixed(2)}/mo`
                      })()}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                      Billing Cycle
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-900 capitalize">
                      {activeLicense?.plan?.finalPrice === 0 || activeLicense?.plan?.mode === "lifetime"
                        ? "Forever"
                        : (activeLicense?.billingCycle || activeLicense?.plan?.mode || "N/A")}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                      Payment Method
                    </p>
                    {defaultCard ? (
                      <div className="mt-1 flex items-center justify-center gap-1.5 text-sm font-bold text-slate-900">
                        <span className="uppercase">
                          {defaultCard.brand} •••• {defaultCard.last4}
                        </span>
                      </div>
                    ) : (
                      <p className="mt-1 text-sm font-bold text-red-500">
                        None
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                      Status
                    </p>
                    <div className="mt-1 flex justify-center">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold",
                          activeLicense?.cancelAtPeriodEnd
                            ? "bg-amber-100 text-amber-700"
                            : activeLicense
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-700"
                        )}
                      >
                        {activeLicense?.cancelAtPeriodEnd
                          ? "Cancelling"
                          : activeLicense
                            ? "Active"
                            : "Inactive"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Billing Information */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <h3 className="font-bold text-slate-900">
                      Billing Information
                    </h3>
                  </div>
                  {!isEditingBilling ? (
                    <button
                      onClick={() => setIsEditingBilling(true)}
                      className="text-sm font-bold text-primary hover:underline"
                    >
                      Edit
                    </button>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        onClick={() => setIsEditingBilling(false)}
                        className="text-sm font-bold text-slate-400 hover:text-slate-600"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveBilling}
                        disabled={isSavingBilling}
                        className="flex items-center gap-2 text-sm font-bold text-primary hover:underline disabled:opacity-50"
                      >
                        {isSavingBilling && (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        )}
                        Save
                      </button>
                    </div>
                  )}
                </div>

                {isEditingBilling ? (
                  <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-[12px] font-bold text-slate-500 uppercase">
                        Company (optional)
                      </label>
                      <input
                        type="text"
                        value={billingData.company}
                        onChange={(e) =>
                          setBillingData({
                            ...billingData,
                            company: e.target.value,
                          })
                        }
                        placeholder="e.g.: Monsters Inc."
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm transition-all focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-slate-500 uppercase">
                        Address Line 1
                      </label>
                      <input
                        type="text"
                        value={billingData.line1}
                        onChange={(e) =>
                          setBillingData({
                            ...billingData,
                            line1: e.target.value,
                          })
                        }
                        placeholder="Address Line 1"
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm transition-all focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-slate-500 uppercase">
                        Address Line 2
                      </label>
                      <input
                        type="text"
                        value={billingData.line2}
                        onChange={(e) =>
                          setBillingData({
                            ...billingData,
                            line2: e.target.value,
                          })
                        }
                        placeholder="Address Line 2"
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm transition-all focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-slate-500 uppercase">
                        Country
                      </label>
                      <div className="relative">
                        <select
                          value={billingData.country}
                          onChange={(e) => handleCountryChange(e.target.value)}
                          className="w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
                        >
                          <option value="">Select Country</option>
                          {countries.map((c) => (
                            <option key={c.isoCode} value={c.isoCode}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute top-3 right-4 h-4 w-4 text-slate-400" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-slate-500 uppercase">
                        State
                      </label>
                      <div className="relative">
                        <select
                          value={billingData.state}
                          onChange={(e) => handleStateChange(e.target.value)}
                          disabled={!billingData.country}
                          className="w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-primary focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
                        >
                          <option value="">Select State</option>
                          {states.map((s) => (
                            <option key={s.isoCode} value={s.isoCode}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute top-3 right-4 h-4 w-4 text-slate-400" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-slate-500 uppercase">
                        City
                      </label>
                      <div className="relative">
                        <select
                          value={billingData.city}
                          onChange={(e) =>
                            setBillingData({
                              ...billingData,
                              city: e.target.value,
                            })
                          }
                          disabled={!billingData.state}
                          className="w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-primary focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
                        >
                          <option value="">Select City</option>
                          {cities.map((c) => (
                            <option key={c.name} value={c.name}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute top-3 right-4 h-4 w-4 text-slate-400" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-bold text-slate-500 uppercase">
                        ZIP Code
                      </label>
                      <input
                        type="text"
                        value={billingData.postalCode}
                        onChange={(e) =>
                          setBillingData({
                            ...billingData,
                            postalCode: e.target.value,
                          })
                        }
                        placeholder="Your ZIP code"
                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm transition-all focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 border-b border-slate-50 pb-3">
                      <div>
                        <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                          Country
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-slate-900">
                          {selectedCountryObj?.name ||
                            billingData.country ||
                            "Not set"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                          State
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-slate-900">
                          {selectedStateObj?.name ||
                            billingData.state ||
                            "Not set"}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 border-b border-slate-50 pb-3">
                      <div>
                        <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                          City
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-slate-900">
                          {billingData.city || "Not set"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                          ZIP Code
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-slate-900">
                          {billingData.postalCode || "Not set"}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                        Address
                      </p>
                      <p className="mt-0.5 text-sm font-bold text-slate-900">
                        {billingData.line1 || "Not set"}
                        {billingData.line2 && `, ${billingData.line2}`}
                      </p>
                    </div>
                    {billingData.company && (
                      <div>
                        <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                          Company
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-slate-900">
                          {billingData.company}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Payment Methods */}
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
                <div className="mb-6 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <h3 className="truncate font-bold text-slate-900">
                      Payment Methods
                    </h3>
                  </div>
                  {!isAddingCard && (
                    <button
                      onClick={handleAddCard}
                      disabled={isInitializingSetup}
                      className="flex h-9 items-center gap-2 rounded-lg bg-slate-900 px-4 text-xs font-bold text-white transition-all hover:bg-black active:scale-95 disabled:opacity-50"
                    >
                      {isInitializingSetup ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Plus className="h-3.5 w-3.5" />
                      )}
                      Add New
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {isAddingCard && clientSecret && (
                    <div className="animate-in rounded-xl border border-primary/20 bg-primary/5 p-4 duration-300 slide-in-from-top-2">
                      <CardForm
                        clientSecret={clientSecret}
                        onSuccess={handleCardSuccess}
                        onCancel={() => setIsAddingCard(false)}
                      />
                    </div>
                  )}

                  {initialCards.map((card) => (
                    <div
                      key={card.id}
                      className={cn(
                        "group relative overflow-hidden rounded-xl border p-4 transition-all hover:border-primary/30 hover:bg-slate-50",
                        card.isDefault
                          ? "border-primary bg-primary/[0.02] shadow-sm"
                          : "border-slate-100"
                      )}
                    >
                      <div className="flex items-start justify-between gap-4 sm:items-center">
                        <div className="flex items-center gap-4">
                          <div
                            className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-lg border bg-white shadow-sm",
                              card.isDefault
                                ? "border-primary/20"
                                : "border-slate-100"
                            )}
                          >
                            <CreditCard
                              className={cn(
                                "h-5 w-5",
                                card.isDefault
                                  ? "text-primary"
                                  : "text-slate-400"
                              )}
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-slate-900 uppercase">
                                {card.brand} •••• {card.last4}
                              </p>
                              {card.isDefault && (
                                <span className="flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                                  <Check className="h-2.5 w-2.5" />
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 md:text-xs">
                              Expires {card.cardExpMonth}/{card.cardExpYear}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-1 border-t border-slate-100 pt-3 transition-opacity group-hover:opacity-100 sm:border-t-0 sm:pt-0 sm:opacity-0">
                          {isPending === card.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                          ) : (
                            <>
                              {!card.isDefault && (
                                <button
                                  onClick={() => handleSetDefault(card.id)}
                                  className="rounded-lg p-2 text-slate-400 transition-all hover:bg-white hover:text-primary"
                                  title="Set as Default"
                                >
                                  <Check className="h-4 w-4" />
                                </button>
                              )}
                              {initialCards.length > 1 && (
                                <button
                                  onClick={() => handleRemoveCard(card.id)}
                                  className="rounded-lg p-2 text-slate-400 transition-all hover:bg-white hover:text-red-500"
                                  title="Remove Card"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {initialCards.length === 0 && (
                    <div className="py-8 text-center">
                      <p className="text-sm text-slate-400 italic">
                        No payment methods saved.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Billing History */}
          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-slate-400" />
                <h3 className="font-bold text-slate-900">Billing History</h3>
              </div>
            </div>
            <div className="scrollbar-none w-full overflow-x-auto">
              <div className="inline-block min-w-full align-middle">
                <table className="w-full min-w-[600px] text-left">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Amount</th>
                      <th className="px-6 py-3">Plan</th>
                      <th className="px-6 py-3 text-center">Status</th>
                      <th className="px-6 py-3 text-center">Promo Code</th>
                      <th className="px-6 py-3 text-right">Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {userPayments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="text-sm transition-colors hover:bg-slate-50/50"
                      >
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {new Date(payment.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-900">
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: payment.currency.toUpperCase(),
                          }).format(payment.amount / 100)}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-600">
                          {payment.planName || "Pro"}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold",
                              payment.status === "paid" ||
                                payment.status === "completed"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                            )}
                          >
                            {payment.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {payment.appliedPromoCode ? (
                            <span className="inline-flex items-center gap-1 rounded bg-orange-50 px-2 py-0.5 text-[11px] font-bold text-orange-600">
                              {payment.appliedPromoCode}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {payment.stripeInvoiceUrl ? (
                            <a
                              href={payment.stripeInvoiceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[12px] font-bold text-primary hover:underline"
                            >
                              <FileText className="h-3 w-3" />
                              View
                            </a>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {userPayments.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-8 text-center text-sm text-slate-400 italic"
                        >
                          No billing history found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Upgrade Modal */}
          {isUpgradeModalOpen && upgradePreview && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
              <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
                <div className="p-6 md:p-8">
                  <h3 className="font-heading text-xl font-bold text-slate-900">
                    Upgrade to Yearly Plan
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    You're switching from the{" "}
                    <strong>{upgradePreview.currentPlan}</strong> (Monthly) to
                    the <strong>{upgradePreview.newPlan}</strong>.
                  </p>

                  <div className="mt-6 space-y-4 rounded-xl bg-slate-50 p-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Yearly Plan Price</span>
                      <span className="font-bold text-slate-900">
                        ${(upgradePreview.finalYearlyAmount / 100).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">
                        Unused Monthly Credit
                      </span>
                      <span className="font-bold text-emerald-600">
                        -$
                        {(Math.abs(upgradePreview.creditAmount) / 100).toFixed(
                          2
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-3">
                      <span className="font-bold text-slate-900">
                        Due Today
                      </span>
                      <span className="text-lg font-bold text-indigo-600">
                        ${(upgradePreview.chargeAmount / 100).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-8 flex gap-3">
                    <button
                      onClick={() => setIsUpgradeModalOpen(false)}
                      disabled={isUpgrading}
                      className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 active:scale-95"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmUpgrade}
                      disabled={isUpgrading}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-50"
                    >
                      {isUpgrading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Confirm Upgrade"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Elements>
  )
}
