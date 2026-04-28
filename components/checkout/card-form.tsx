"use client"

import { useState } from "react"
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Loader2, CreditCard, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { checkDuplicateCard } from "@/actions/billing"

interface CardFormProps {
  clientSecret: string
  onSuccess: (paymentMethodId: string) => void
  onCancel: () => void
}

export function CardForm({ clientSecret, onSuccess, onCancel }: CardFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) return

    setIsProcessing(true)

    try {
      const { setupIntent, error } = await stripe.confirmCardSetup(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement)!,
          },
        }
      )

      if (error) {
        setError(error.message || "Failed to confirm card")
        return
      }

      if (setupIntent?.status === "succeeded") {
        const pmId = setupIntent.payment_method as string
        const verification = await checkDuplicateCard(pmId)

        if (verification.isDuplicate && verification.existingPaymentMethodId) {
          toast.success("Card already added, selecting it for you")
          onSuccess(verification.existingPaymentMethodId)
          return
        }

        if (verification.error) {
          setError(verification.error)
          setIsProcessing(false)
          return
        }

        toast.success("Card added successfully")
        onSuccess(pmId)
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="animate-in space-y-4 rounded-xl border border-gray-200 bg-[#f9fbf9] p-4 fade-in slide-in-from-top-2">
      <div className="mb-2 flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-primary" />
        <span className="text-[14px] font-bold text-base-content">
          Enter card details
        </span>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <CardElement
          onChange={(e) => {
            if (e.error) {
              setError(e.error.message)
            } else {
              setError(null)
            }
          }}
          options={{
            hidePostalCode: true,
            style: {
              base: {
                fontSize: "14px",
                color: "#1a1a1a",
                "::placeholder": {
                  color: "#aab7c4",
                },
              },
              invalid: {
                color: "#9e2146",
              },
            },
          }}
        />
      </div>

      {error && (
        <div className="flex animate-in items-center gap-2 rounded-lg bg-red-50 p-3 text-[13px] font-medium text-red-600 fade-in slide-in-from-top-1">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isProcessing || !stripe}
          className="flex flex-1 items-center justify-center rounded-full bg-base-content py-2.5 text-[14px] font-bold text-white shadow-sm transition-all hover:bg-black active:scale-95 disabled:opacity-50"
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Save and use card"
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          className="rounded-full border border-gray-200 bg-white px-6 py-2.5 text-[14px] font-bold text-gray-600 transition-all hover:bg-gray-50 active:scale-95 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
