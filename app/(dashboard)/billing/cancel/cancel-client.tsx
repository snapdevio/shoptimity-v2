"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  AlertCircle,
  MessageCircle,
  HeartOff,
  CheckCircle2,
  Gift,
  Zap,
  Clock,
  Tag,
} from "lucide-react"
import { toast } from "sonner"
import { downgradeToFreePlan, applyRetentionDiscount } from "@/actions/billing"
import { CANCELLATION_REASONS } from "@/lib/cancellation-reasons"

interface CancelClientProps {
  licenseId: string
  subscriptionId: string | null
  discountPercent: number
  discountDuration: number
  planName: string
  price: number
  billingCycle: "monthly" | "yearly"
  showOfferInitial?: boolean
  offerTimeoutSeconds?: number
  couponCode?: string | null
  isTrial?: boolean
  trialEndsAt?: string | null
}

export function CancelClient({
  licenseId,
  subscriptionId,
  discountPercent,
  discountDuration,
  planName,
  price,
  billingCycle,
  showOfferInitial = true,
  offerTimeoutSeconds = 300,
  couponCode,
  isTrial = false,
  trialEndsAt = null,
}: CancelClientProps) {
  const router = useRouter()
  const [step, setStep] = useState<"offer" | "reasons">(
    showOfferInitial ? "offer" : "reasons"
  )
  const [selectedReason, setSelectedReason] = useState<string | null>(null)
  const [otherReason, setOtherReason] = useState("")
  const [isCancelled, setIsCancelled] = useState(false)
  const [cancelAt, setCancelAt] = useState<number | null>(null)
  const [isDiscountClaimed, setIsDiscountClaimed] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [timeLeft, setTimeLeft] = useState(offerTimeoutSeconds)
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false)

  useEffect(() => {
    if (step !== "offer") return

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)

    return () => clearInterval(timer)
  }, [step])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleCancel = async () => {
    if (!subscriptionId) {
      toast.error("No active subscription found")
      return
    }

    setIsPending(true)
    try {
      const res = await downgradeToFreePlan(licenseId, {
        reason: selectedReason,
        details: selectedReason === "Other" ? otherReason.trim() || null : null,
      })
      if (res.error) {
        toast.error(res.error)
      } else {
        setCancelAt(res.cancelAt || null)
        setIsCancelled(true)
        toast.success("Subscription scheduled for cancellation")
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsPending(false)
    }
  }

  const handleClaimDiscount = async () => {
    if (!subscriptionId) {
      toast.error("No active subscription found")
      return
    }

    setIsPending(true)
    try {
      const res = await applyRetentionDiscount(
        licenseId,
        subscriptionId,
        discountPercent,
        discountDuration,
        billingCycle,
        couponCode
      )
      if (res.error) {
        toast.error(res.error)
      } else {
        setIsDiscountClaimed(true)
        toast.success(
          `Success! Your next payment on ${res.nextPaymentDate} will be $${((res.amountDue || 0) / 100).toFixed(2)}.`
        )
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsPending(false)
    }
  }

  const discountedPrice = price * (1 - discountPercent / 100)
  // For Stripe-managed trials, the next charge fires at `trial_end`, not on
  // the regular cycle boundary. Surface that date in the copy so the user
  // doesn't think they'll be charged "next month" while still in trial.
  const trialEndDate = isTrial && trialEndsAt ? new Date(trialEndsAt) : null
  const formatTrialEnd = (d: Date) =>
    d.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  const durationUnit =
    billingCycle === "yearly"
      ? discountDuration === 1
        ? "year"
        : "years"
      : discountDuration === 1
        ? "month"
        : "months"
  const priceUnit = billingCycle === "yearly" ? "/yr" : "/mo"

  if (isCancelled) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-4">
        <div className="w-full max-w-md animate-in text-center duration-500 fade-in zoom-in">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-slate-900">
            Subscription Cancelled
          </h1>
          <p className="mt-3 text-[15px] text-slate-500">
            We're sorry to see you go. Your {planName} features will remain
            active until the end of your current billing period
            {cancelAt && (
              <>
                {" "}
                on{" "}
                <span className="font-bold text-slate-900">
                  {new Date(cancelAt * 1000).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </>
            )}
            .
          </p>
          <ul className="mt-5 space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left text-[13px] text-slate-600">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <span>
                Your subscription has been cancelled — you{" "}
                <span className="font-bold text-slate-900">
                  will not be charged
                </span>{" "}
                on the next renewal.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <span>
                You keep full{" "}
                <span className="font-bold text-slate-900">{planName}</span>{" "}
                access for the time already paid — your plan automatically
                switches to the free plan after the period ends.
              </span>
            </li>
          </ul>
          <button
            onClick={() => router.push("/billing")}
            className="mt-8 w-full cursor-pointer rounded-xl bg-orange-600 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-orange-700 active:scale-95"
          >
            Back to Billing
          </button>
        </div>
      </div>
    )
  }

  if (isDiscountClaimed) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-4">
        <div className="w-full max-w-md animate-in text-center duration-500 fade-in zoom-in">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Zap className="h-10 w-10" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-slate-900">
            Discount Applied!
          </h1>
          <p className="mt-3 text-[15px] text-slate-500">
            Great choice! We've applied a{" "}
            <span className="font-bold text-primary">
              {discountPercent}% discount
            </span>{" "}
            to your <b>{trialEndDate
              ? `first charge on ${formatTrialEnd(trialEndDate)}`
              : `next ${billingCycle === "yearly" ? "year" : "month"}`}</b> of Shoptimity{" "}
            <b>{planName}</b>.
          </p>
          <button
            onClick={() => router.push("/billing")}
            className="mt-8 w-full cursor-pointer rounded-xl bg-primary py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:brightness-110 active:scale-95"
          >
            Go to Billing
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-2xl">
        <button
          onClick={() => router.back()}
          className="group mb-8 inline-flex cursor-pointer items-center text-sm font-bold text-slate-500 transition-colors hover:text-primary"
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Billing
        </button>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white md:shadow-xl">
          {step === "offer" ? (
            <div className="animate-in duration-500 fade-in slide-in-from-right-4">
              <div className="border-b border-primary/10 bg-primary/5 px-4 py-10 text-center md:p-10 md:px-6">
                <div className="mx-auto mb-6 flex h-24 w-24 rotate-6 transform items-center justify-center rounded-3xl bg-white text-primary shadow-xl shadow-primary/10">
                  <Gift className="h-12 w-12" />
                </div>
                <h1 className="font-heading text-2xl font-bold text-slate-900 md:text-3xl">
                  Wait! We have a gift for you
                </h1>
                <p className="mx-auto mt-4 max-w-sm text-base text-slate-600 md:text-lg">
                  Stay with us and enjoy{" "}
                  <span className="text-2xl font-bold text-primary md:text-3xl">
                    {discountPercent}% off
                  </span>{" "}
                  for the {discountDuration} {durationUnit}.
                </p>

                <div className="mt-6 inline-flex animate-pulse items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary md:text-sm">
                  <Clock className="h-4 w-4" />
                  This offer expires in {formatTime(timeLeft)}
                </div>
              </div>

              <div className="space-y-6 px-6 py-10 md:p-10">
                <div className="rounded-2xl border-2 border-dashed border-primary/20 bg-primary/5 p-3 md:p-4 text-center">
                  <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase md:text-sm">
                    Your Special Offer
                  </p>

                  <div className="mt-2 flex flex-wrap items-baseline justify-center gap-x-2 gap-y-1">
                    {/* Original Price */}
                    <span className="text-xl font-bold text-slate-400 line-through sm:text-2xl md:text-3xl">
                      ${(price / 100).toFixed(2)}
                    </span>

                    {/* Discounted Price */}
                    <span className="text-3xl font-extrabold text-primary sm:text-4xl md:text-5xl">
                      ${(discountedPrice / 100).toFixed(2)}
                    </span>

                    {/* Billing Cycle Unit */}
                    <span className="text-sm font-semibold text-slate-400 md:text-lg">
                      {priceUnit}
                    </span>
                  </div>

                  <p className="mt-3 text-xs font-medium text-slate-500 md:text-sm">
                    Valid for the next {discountDuration} {durationUnit}
                  </p>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2 md:p-4">
                  <AlertCircle className="mt-0.5 h-5 w-5 text-slate-400" />
                  <p className="text-xs leading-relaxed text-slate-500">
                    <span className="font-bold text-slate-700">Note:</span> This
                    exclusive <b>{discountPercent}% discount</b> will be
                    automatically applied to your{" "}
                    {trialEndDate
                      ? `first charge after your trial ends on ${formatTrialEnd(trialEndDate)}`
                      : `next ${billingCycle} renewal`}
                    . You will keep all your current <b>{planName}</b> features
                    and your billing cycle will remain unchanged.
                  </p>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  <button
                    onClick={() => setIsCouponModalOpen(true)}
                    disabled={isPending}
                    className="w-full cursor-pointer rounded-xl bg-primary py-4 text-lg font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                  >
                    <div className="flex flex-col items-center leading-tight">
                      <span className="text-lg">
                        Claim {discountPercent}% Discount
                      </span>
                      <span className="text-[13px] font-medium opacity-90">
                        {trialEndDate
                          ? `Pay $${(discountedPrice / 100).toFixed(2)} when your trial ends on ${formatTrialEnd(trialEndDate)}`
                          : `Pay $${(discountedPrice / 100).toFixed(2)} on your next ${billingCycle === "yearly" ? "year" : "month"}`}
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={() => setStep("reasons")}
                    className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white py-3.5 text-sm font-bold text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-700 active:scale-95"
                  >
                    No thanks, continue to cancel
                  </button>
                  <p className="text-center text-[11px] font-medium tracking-widest text-slate-400 uppercase">
                    Applied automatically to your next payment
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-in duration-500 fade-in slide-in-from-right-4">
              <div className="border-b border-primary/10 bg-primary/5 px-6 py-10 text-center md:p-8">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <HeartOff className="h-8 w-8" />
                </div>
                <h1 className="font-heading text-xl font-bold text-slate-900 md:text-2xl">
                  Cancel your subscription?
                </h1>
                <p className="mx-auto mt-2 max-w-sm text-sm text-slate-600 md:text-base">
                  Help us improve by sharing why you're leaving.
                </p>
              </div>

              <div className="px-6 py-10 md:p-8">
                <div className="mb-8">
                  <h3 className="mb-4 text-sm font-bold tracking-wider text-slate-900 uppercase">
                    Why are you leaving?
                  </h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {CANCELLATION_REASONS.map((reason) => (
                      <button
                        key={reason}
                        onClick={() => setSelectedReason(reason)}
                        className={`flex cursor-pointer items-center rounded-xl border px-4 py-3.5 text-sm font-medium transition-all ${selectedReason === reason
                          ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/20"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                      >
                        <div
                          className={`mr-3 flex h-4 w-4 items-center justify-center rounded-full border-2 transition-all ${selectedReason === reason
                            ? "border-primary bg-primary"
                            : "border-slate-200 bg-white"
                            }`}
                        >
                          {selectedReason === reason && (
                            <div className="h-1.5 w-1.5 rounded-full bg-white" />
                          )}
                        </div>
                        {reason}
                      </button>
                    ))}
                  </div>

                  {selectedReason === "Other" && (
                    <div className="mt-4 animate-in duration-300 fade-in slide-in-from-top-2">
                      <textarea
                        placeholder="Please tell us more about why you're leaving..."
                        value={otherReason}
                        onChange={(e) => setOtherReason(e.target.value)}
                        className="min-h-25 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-sm transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-100 pt-4">
                  <button
                    onClick={handleCancel}
                    disabled={
                      isPending ||
                      !selectedReason ||
                      (selectedReason === "Other" && !otherReason.trim())
                    }
                    className="w-full cursor-pointer rounded-xl bg-primary py-4 text-[15px] font-bold text-white shadow-lg shadow-primary/20 transition-all hover:brightness-110 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
                  >
                    {isPending ? (
                      <span className="flex items-center justify-center gap-2">
                        <Clock className="h-4 w-4 animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      "Confirm Cancellation"
                    )}
                  </button>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => setStep("offer")}
                      className="flex-1 cursor-pointer rounded-xl border border-slate-200 bg-white py-3.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 active:scale-95"
                    >
                      Keep my plan
                    </button>
                   
                    <Link
                      href="/contact"
                      className="flex-1 cursor-pointer rounded-xl border border-slate-200 bg-white py-3.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 active:scale-95 text-center flex items-center justify-center"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Talk to support
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">
          Cancelling your subscription will not delete your account. You can
          continue to use the free version of Shoptimity with limited features.
        </p>
      </div>

      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="border-b border-primary/10 bg-primary/5 px-6 py-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-primary shadow-md">
                <Tag className="h-7 w-7" />
              </div>
              <h3 className="font-heading text-xl font-bold text-slate-900">
                Confirm your discount
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Review the offer before we apply it to your subscription.
              </p>
            </div>

            <div className="space-y-4 p-6 md:p-8">
              <div className="space-y-2 rounded-2xl bg-slate-50 p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Discount</span>
                  <span className="font-bold text-primary">
                    {discountPercent}% off
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Valid for</span>
                  <span className="font-bold text-slate-900">
                    {discountDuration} {durationUnit}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2">
                  <span className="font-bold text-slate-900">
                    {trialEndDate
                      ? `First charge on ${formatTrialEnd(trialEndDate)}`
                      : `Next ${billingCycle === "yearly" ? "year" : "month"}`}
                  </span>
                  <span className="text-base font-bold text-primary">
                    ${(discountedPrice / 100).toFixed(2)}
                    {priceUnit}
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsCouponModalOpen(false)}
                  disabled={isPending}
                  className="flex-1 cursor-pointer rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 active:scale-95 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await handleClaimDiscount()
                    setIsCouponModalOpen(false)
                  }}
                  disabled={isPending}
                  className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <Clock className="h-4 w-4 animate-spin" />
                      Applying…
                    </>
                  ) : (
                    "Apply discount"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
