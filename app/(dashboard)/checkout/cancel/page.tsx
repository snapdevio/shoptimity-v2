"use client"

import { useRouter } from "next/navigation"
import { XCircle, ArrowLeft, MessageCircle, RefreshCw } from "lucide-react"

export default function CheckoutCancelPage() {
  const router = useRouter()

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center p-4">
      <div className="w-full max-w-md animate-in text-center duration-500 fade-in zoom-in">
        {/* Icon */}
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-red-50 text-red-500 shadow-inner">
          <XCircle className="h-12 w-12" />
        </div>

        {/* Text */}
        <h1 className="font-heading text-3xl font-bold tracking-tight text-slate-900">
          Checkout Cancelled
        </h1>
        <p className="mt-4 text-lg text-slate-500">
          Your payment was not processed. No charges were made to your account.
        </p>

        {/* Info Card */}
        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50/50 p-6 text-left">
          <h3 className="font-bold text-slate-900">Common reasons:</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              Payment window was closed manually
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              Temporary issue with the payment provider
            </li>
            <li className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              Card authentication failed (3D Secure)
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="mt-10 flex flex-col gap-3">
          <button
            onClick={() => router.push("/plans")}
            className="group flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] hover:brightness-110 active:scale-95"
          >
            <RefreshCw className="h-4 w-4 transition-transform duration-500 group-hover:rotate-180" />
            Try again
          </button>

          <div className="flex gap-3">
            <button
              onClick={() => router.push("/licenses")}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 active:scale-95"
            >
              <ArrowLeft className="h-4 w-4" />
              Licenses
            </button>
            <button className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 active:scale-95">
              <MessageCircle className="h-4 w-4" />
              Support
            </button>
          </div>
        </div>

        <p className="mt-8 text-sm text-slate-400">
          Need help?{" "}
          <button className="cursor-pointer font-bold text-primary hover:underline">
            Contact our support team
          </button>
        </p>
      </div>
    </div>
  )
}
