import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { usePostHog } from "posthog-js/react"
import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { ArrowLeft, Loader2, Check, CreditCard, Plus } from "lucide-react"
import { getUserCards } from "@/actions/billing"
import { useEffect } from "react"

interface CheckoutFormProps {
  initialEmail?: string
  initialName?: string
  initialDomain?: string
}

export function CheckoutForm({
  initialEmail = "",
  initialName = "",
  initialDomain = "",
}: CheckoutFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const posthog = usePostHog()
  const planId = searchParams.get("planId")

  const [email, setEmail] = useState(initialEmail)
  const [name, setName] = useState(initialName)
  const [domains, setDomains] = useState<string[]>(() => {
    const q = searchParams.get("quantity")
    const initialQuantity = q ? Math.max(1, parseInt(q || "1", 10)) : 1
    const arr = new Array(initialQuantity).fill("")
    if (initialDomain && arr.length > 0) {
      arr[0] = initialDomain
    }
    return arr
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [savedCards, setSavedCards] = useState<any[]>([])
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)

  useEffect(() => {
    async function loadCards() {
      const cards = await getUserCards()
      setSavedCards(cards)
      const def = cards.find((c) => c.isDefault)
      if (def) setSelectedCardId(def.id)
    }
    loadCards()
  }, [])

  function updateDomainValue(index: number, value: string) {
    const newDomains = [...domains]
    newDomains[index] = value
    setDomains(newDomains)
  }

  function validate() {
    const errors: Record<string, string> = {}
    if (!email.trim()) {
      errors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address"
    }
    if (!name.trim()) {
      errors.name = "Name is required"
    }
    domains.forEach((d, i) => {
      const normalized = d.toLowerCase().trim()
      if (
        normalized &&
        !/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(normalized)
      ) {
        errors[`domain-${indexToKey(i)}`] =
          "Only *.myshopify.com domains are allowed"
      }
    })
    return errors
  }

  function indexToKey(index: number) {
    return index.toString()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    const errors = validate()
    setFieldErrors(errors)

    if (Object.keys(errors).length > 0) return

    posthog.capture("checkout_started", {
      planId,
      email: email.trim(),
      licenseQuantity: domains.length,
    })

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          email: email.trim(),
          contactName: name.trim(),
          licenseQuantity: domains.length,
          domains: domains.filter((d) => d.trim() !== ""),
          paymentCardId: selectedCardId,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(
          data.message || "Something went wrong. Please try again."
        )
      }

      const data = await res.json()
      if (data.url) {
        router.push(data.url)
      } else {
        throw new Error("No checkout URL returned. Please try again.")
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!planId) {
    return (
      <div className="py-20 sm:py-24">
        <div className="mx-auto max-w-md px-4 text-center">
          <h1 className="font-heading text-2xl font-bold">No Plan Selected</h1>
          <p className="mt-4 text-muted-foreground">
            Please select a plan from our pricing page to continue.
          </p>
          <Link href="/plans" className={cn(buttonVariants(), "mt-6")}>
            View Pricing
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="py-12 sm:py-20">
      <div className="mx-auto max-w-lg px-4 sm:px-6">
        <Link
          href="/plans"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "mb-6"
          )}
        >
          <ArrowLeft data-icon="inline-start" />
          Back to Pricing
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Complete Your Order</CardTitle>
            <CardDescription>
              Fill in your details below to proceed to payment.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  aria-invalid={!!fieldErrors.name}
                />
                {fieldErrors.name && (
                  <p className="text-sm text-destructive">{fieldErrors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  aria-invalid={!!fieldErrors.email}
                />
                {fieldErrors.email && (
                  <p className="text-sm text-destructive">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>
                    License Slots & Shopify Domains
                    <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <p className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                    {domains.length} License{domains.length !== 1 ? "s" : ""}
                  </p>
                </div>

                <div className="space-y-2.5">
                  {domains.map((domain, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <span className="absolute top-1/2 left-3 -translate-y-1/2 text-[10px] font-bold text-muted-foreground uppercase opacity-50">
                            Domain {index + 1}
                          </span>
                          <Input
                            className={cn("pl-20", {
                              "border-destructive focus-visible:ring-destructive":
                                !!fieldErrors[`domain-${indexToKey(index)}`],
                            })}
                            value={domain}
                            onChange={(e) =>
                              updateDomainValue(index, e.target.value)
                            }
                            placeholder="mystore.myshopify.com"
                          />
                        </div>
                      </div>
                      {fieldErrors[`domain-${indexToKey(index)}`] && (
                        <p className="text-[10px] text-destructive">
                          {fieldErrors[`domain-${indexToKey(index)}`]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <p className="text-start text-xs text-muted-foreground">
                  Only <strong>*.myshopify.com</strong> domains are allowed
                  (e.g., your-store.myshopify.com). Each license slot costs the
                  plan base price. You can leave domains blank and assign them
                  later in your dashboard.
                </p>
              </div>

              {savedCards.length > 0 && (
                <div className="space-y-3">
                  <Label>Select Payment Method</Label>
                  <div className="grid gap-2">
                    {savedCards.map((card) => (
                      <div
                        key={card.id}
                        onClick={() => setSelectedCardId(card.id)}
                        className={cn(
                          "flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all hover:bg-slate-50",
                          selectedCardId === card.id
                            ? "border-primary bg-primary/5 ring-1 ring-primary"
                            : "border-slate-200"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-4 w-4 text-slate-400" />
                          <div className="text-sm">
                            <span className="font-bold uppercase">
                              {card.brand}
                            </span>
                            <span className="ml-2 text-slate-500">
                              •••• {card.last4}
                            </span>
                          </div>
                        </div>
                        {selectedCardId === card.id && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    ))}
                    <div
                      onClick={() => setSelectedCardId(null)}
                      className={cn(
                        "flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all hover:bg-slate-50",
                        selectedCardId === null
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-slate-200"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Plus className="h-4 w-4 text-slate-400" />
                        <span className="text-sm font-medium">
                          Use a new card
                        </span>
                      </div>
                      {selectedCardId === null && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full cursor-pointer"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2
                      className="animate-spin"
                      data-icon="inline-start"
                    />
                    Processing...
                  </>
                ) : (
                  "Proceed to Payment"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
