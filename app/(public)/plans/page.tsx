export const dynamic = "force-dynamic"

import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Pricing Plans | Shoptimity Shopify Theme",
  description:
    "Choose the best plan for your business. Affordable pricing for Shoptimity Shopify theme licenses. Start building your high-converting store today.",
  alternates: {
    canonical: "https://shoptimity.com/plans",
  },
}
import { getActivePlans } from "@/actions/admin-plans"
import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Check } from "lucide-react"
import { CouponCode } from "@/components/site/CouponCode"
import CTABadges from "@/components/site/CTABadges"

export default async function PlansPage() {
  const displayPlans = await getActivePlans()

  function formatPrice(cents: number) {
    return `$${(cents / 100).toFixed(0)}`
  }

  return (
    <div className="bg-base-100 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-heading text-4xl font-bold tracking-tight sm:text-5xl">
            Simple, Transparent Pricing
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Choose the plan that matches your needs. All plans include full
            platform access and template downloads.
          </p>
        </div>

        {/* Discount Card */}
        <div className="mx-auto my-8 mb-12 max-w-4xl px-4">
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-brand-orange to-brand-pink p-px shadow-lg">
            <div className="relative flex flex-col items-center justify-between gap-6 rounded-3xl bg-white p-6 md:flex-row md:px-6">
              <div className="flex flex-col gap-1 text-center md:text-left">
                <h3 className="font-heading text-lg font-bold md:text-3xl">
                  Special Offer :{" "}
                  <span className="font-[Lexend,'sans-serif'] text-primary">
                    Flat 5% OFF
                  </span>
                </h3>
                <p className="max-w-md text-muted-foreground">
                  Ready to upgrade? Use our coupon code at checkout to save 5%
                  on any plan today.
                </p>
              </div>
              <div className="shrink-0">
                <CouponCode code="SHOP5" />
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-3">
          {displayPlans.map((plan, index) => {
            const features = Array.isArray(plan.features)
              ? (plan.features as string[])
              : []
            const isPopular = index === 1

            return (
              <Card
                key={plan.id}
                className={cn(
                  "flex h-full flex-col",
                  isPopular
                    ? "relative overflow-visible shadow-xl ring-2 ring-primary"
                    : "border-base-200"
                )}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                    Most Popular
                  </div>
                )}

                <CardHeader className="text-center">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>
                    {plan.slots} license {plan.slots === 1 ? "slot" : "slots"}
                  </CardDescription>
                  <div className="mt-4">
                    <div className="mt-1 flex items-baseline justify-center gap-1">
                      <span className="font-heading text-4xl font-bold">
                        {formatPrice(plan.finalPrice)}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground line-through">
                      {formatPrice(plan.regularPrice)}
                    </span>
                  </div>
                </CardHeader>

                <CardFooter className="flex-col gap-2">
                  <a
                    href={`/api/checkout?planId=${plan.id}&quantity=${plan.slots}`}
                    className={cn(
                      buttonVariants({
                        variant: isPopular ? "default" : "outline",
                      }),
                      "w-full capitalize"
                    )}
                  >
                    {plan.trialDays > 0
                      ? "Start Free Trial Now"
                      : "get started"}
                  </a>
                </CardFooter>

                <CardContent className="flex-1">
                  <ul className="space-y-3">
                    {features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
          <CTABadges
            trialDays={displayPlans[0].trialDays}
            className="items-center justify-center lg:col-span-3 lg:text-[14px]"
          />
        </div>
      </div>
    </div>
  )
}
