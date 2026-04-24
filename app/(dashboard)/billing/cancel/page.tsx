"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  AlertCircle,
  MessageCircle,
  HeartOff,
  CheckCircle2,
  Gift,
  Zap,
  Clock,
} from "lucide-react"
import { useEffect } from "react"

const CANCELLATION_REASONS = [
  "Too expensive",
  "Missing features",
  "Technical issues",
  "Switching to a competitor",
  "No longer need it",
  "Other",
]

export default function CancelPlanPage() {
  const router = useRouter()
  const [step, setStep] = useState<"offer" | "reasons">("offer")
  const [selectedReason, setSelectedReason] = useState<string | null>(null)
  const [otherReason, setOtherReason] = useState("")
  const [isCancelled, setIsCancelled] = useState(false)
  const [isDiscountClaimed, setIsDiscountClaimed] = useState(false)
  const [timeLeft, setTimeLeft] = useState(200)

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

  const handleCancel = () => {
    // call cancel subscription API here
    setIsCancelled(true)
  }

  const handleClaimDiscount = () => {
    // call API to apply discount
    setIsDiscountClaimed(true)
  }

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
            We're sorry to see you go. Your Pro features will remain active
            until the end of your current billing period on{" "}
            <span className="font-bold text-slate-900">May 24, 2026</span>.
          </p>
          <button
            onClick={() => router.push("/billing")}
            className="mt-8 w-full rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-black active:scale-95"
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
            <span className="font-bold text-primary">50% discount</span> to your
            next 3 months of Shoptimity Pro.
          </p>
          <button
            onClick={() => router.push("/billing")}
            className="mt-8 w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:brightness-110 active:scale-95"
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
        {/* Header */}
        <button
          onClick={() => router.back()}
          className="group mb-8 inline-flex items-center text-sm font-bold text-slate-500 transition-colors hover:text-slate-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Billing
        </button>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white md:shadow-xl">
          {step === "offer" ? (
            /* STEP 1: THE OFFER */
            <div className="animate-in duration-500 fade-in slide-in-from-right-4">
              <div className="border-b border-primary/10 bg-primary/5 px-4 py-10 text-center md:p-10 md:px-6">
                <div className="mx-auto mb-6 flex h-24 w-24 rotate-6 transform items-center justify-center rounded-3xl bg-white text-primary shadow-xl shadow-primary/10">
                  <Gift className="h-12 w-12" />
                </div>
                <h1 className="font-heading text-2xl font-bold text-slate-900 md:text-3xl">
                  Wait! We have a gift for you
                </h1>
                <p className="mx-auto mt-4 max-w-sm text-base text-slate-600 md:text-lg">
                  Before you go, would you stay for{" "}
                  <span className="font-bold text-primary">50% off</span> for
                  the next 3 months?
                </p>

                {/* Countdown Timer */}
                <div className="mt-6 inline-flex animate-pulse items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary md:text-sm">
                  <Clock className="h-4 w-4" />
                  This offer expires in {formatTime(timeLeft)}
                </div>
              </div>

              <div className="space-y-6 px-6 py-10 md:p-10">
                <div className="rounded-2xl border-2 border-dashed border-primary/20 bg-primary/5 p-6 text-center">
                  <p className="text-xs font-medium tracking-wider text-slate-500 uppercase md:text-sm">
                    Your Special Offer
                  </p>
                  <div className="mt-2 flex items-center justify-center gap-3">
                    <span className="text-2xl font-bold text-slate-400 line-through md:text-3xl">
                      $19.00
                    </span>
                    <span className="text-4xl font-bold text-primary md:text-5xl">
                      $9.50
                    </span>
                    <span className="text-base font-bold text-slate-400 md:text-lg">
                      /mo
                    </span>
                  </div>
                  <p className="mt-3 text-sm font-medium text-slate-500">
                    Valid for the next 3 billing cycles
                  </p>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <AlertCircle className="mt-0.5 h-5 w-5 text-slate-400" />
                  <p className="text-xs leading-relaxed text-slate-500">
                    <span className="font-bold text-slate-700">
                      Note for Annual Subscribers:
                    </span>{" "}
                    If you are currently on an annual plan, accepting this offer
                    will switch your subscription to a monthly billing cycle
                    with the discount applied.
                  </p>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                  <button
                    onClick={handleClaimDiscount}
                    className="w-full cursor-pointer rounded-xl bg-primary py-4 text-lg font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
                  >
                    Claim 50% Discount
                  </button>
                  <button
                    onClick={() => setStep("reasons")}
                    className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white py-3.5 text-sm font-bold text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-700 active:scale-95"
                  >
                    No thanks, continue to cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* STEP 2: THE REASONS */
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
                {/* Reason Selection */}
                <div className="mb-8">
                  <h3 className="mb-4 text-sm font-bold tracking-wider text-slate-900 uppercase">
                    Why are you leaving?
                  </h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {CANCELLATION_REASONS.map((reason) => (
                      <button
                        key={reason}
                        onClick={() => setSelectedReason(reason)}
                        className={`flex items-center rounded-xl border px-4 py-3.5 text-sm font-medium transition-all ${
                          selectedReason === reason
                            ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/20"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div
                          className={`mr-3 h-4 w-4 rounded-full border-2 transition-all ${
                            selectedReason === reason
                              ? "border-primary bg-primary"
                              : "border-slate-200 bg-white"
                          }`}
                        >
                          {selectedReason === reason && (
                            <div className="m-auto h-1.5 w-1.5 rounded-full bg-white" />
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
                        className="min-h-[100px] w-full resize-none rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-sm transition-all focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 border-t border-slate-100 pt-4">
                  <button
                    disabled={
                      !selectedReason ||
                      (selectedReason === "Other" && !otherReason.trim())
                    }
                    onClick={handleCancel}
                    className="w-full cursor-pointer rounded-xl bg-primary py-4 text-[15px] font-bold text-white shadow-lg shadow-primary/20 transition-all hover:brightness-110 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
                  >
                    Confirm Cancellation
                  </button>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep("offer")}
                      className="flex-1 cursor-pointer rounded-xl border border-slate-200 bg-white py-3.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 active:scale-95"
                    >
                      Keep my plan
                    </button>
                    <button className="flex-1 cursor-pointer rounded-xl border border-slate-200 bg-white py-3.5 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 active:scale-95">
                      <MessageCircle className="mr-2 inline-block h-4 w-4" />
                      Talk to support
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <p className="mt-8 text-center text-xs text-slate-400">
          Cancelling your subscription will not delete your account. You can
          continue to use the free version of Shoptimity with limited features.
        </p>
      </div>
    </div>
  )
}
