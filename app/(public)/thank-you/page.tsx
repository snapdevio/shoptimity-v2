import { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Thank You for Your Purchase | Shoptimity",
  description:
    "Your order is complete. Welcome to Shoptimity! Follow the instructions to download and install your new theme.",
  alternates: {
    canonical: "https://shoptimity.com/thank-you",
  },
  robots: {
    index: false,
    follow: false,
  },
}
import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  CheckCircle,
  Mail,
  PlayCircle,
  ReceiptText,
  ShieldCheck,
  CreditCard,
  Package,
} from "lucide-react"
import { getStripe } from "@/lib/stripe"
import { db } from "@/db"
import { plans } from "@/db/schema"
import { eq } from "drizzle-orm"

interface ThankYouPageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function ThankYouPage({
  searchParams,
}: ThankYouPageProps) {
  const params = await searchParams
  const sessionId = params.session_id as string | undefined
  const planIdParam = params.planId as string | undefined
  const isYearlyParam = params.isYearly === "true"

  // Two entry points:
  // 1. Stripe Checkout (hosted) returns with `?session_id=cs_...`. We resolve
  //    the session and its line items for the order summary.
  // 2. In-app checkout (saved card flow in /checkout) skips the hosted UI
  //    entirely and lands here with `?planId=...&isYearly=...`. There is no
  //    Stripe session to fetch — we render a plan-only confirmation.
  if (!sessionId && !planIdParam) {
    redirect("/")
  }

  let session: Awaited<
    ReturnType<ReturnType<typeof getStripe>["checkout"]["sessions"]["retrieve"]>
  > | null = null
  if (sessionId) {
    try {
      const stripe = getStripe()
      session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["line_items"],
      })
    } catch (error) {
      console.error("Error fetching checkout session:", error)
      redirect("/")
    }
  }

  const currency = session?.currency?.toUpperCase() || "USD"
  // Resolve plan: prefer the Stripe session metadata, fall back to the
  // explicit planId param from the in-app flow.
  const planId =
    (session?.metadata?.plan_id as string | undefined) || planIdParam
  const [plan] = planId
    ? await db
        .select()
        .from(plans)
        .where(eq(plans.id, planId))
        .limit(1)
    : [null]

  const isFreePlan = session
    ? session.amount_total === 0 || session.metadata?.type === "free_plan"
    : (plan?.finalPrice ?? 0) === 0
  const lineItems = session?.line_items?.data || []

  const slotsPerUnit = plan?.slots || 1

  // Map display items: use line items if available, or a virtual item built
  // from the resolved plan (free trial via Stripe, or in-app saved-card flow).
  const planAmount = plan
    ? isYearlyParam && plan.mode === "monthly"
      ? plan.finalPrice * 12
      : plan.finalPrice
    : 0
  const displayItems =
    lineItems.length > 0
      ? lineItems.map((item) => ({
          id: item.id,
          description: item.description,
          amount: item.amount_total,
          quantity: item.quantity || 1,
        }))
      : plan
        ? [
            {
              id: "plan-item",
              description: `${plan.name}${
                isYearlyParam ? " (Yearly)" : ""
              }`,
              amount: isFreePlan ? 0 : planAmount,
              quantity: 1,
            },
          ]
        : []

  return (
    <div className="py-20 sm:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="text-center">
          <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle className="size-8 text-primary" />
          </div>
          <h1 className="mt-6 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            {isFreePlan
              ? "Free Plan Activated Successfully!"
              : "Thank You for Your Purchase!"}
          </h1>
          <div className="mt-4 space-y-2">
            <p className="text-lg text-muted-foreground">
              {isFreePlan
                ? "Your Free Plan has been activated."
                : "Your order has been successfully processed. You are all set to start managing your Shopify licenses."}
            </p>
            {isFreePlan && (
              <p className="text-base text-muted-foreground">
                You can now start managing your Shopify domains.{" "}
                <Link
                  href="/login"
                  className="cursor-pointer font-semibold text-primary underline decoration-primary/30 underline-offset-4 transition-colors hover:decoration-primary"
                >
                  Click here
                </Link>
              </p>
            )}
          </div>
        </div>

        {(session || (plan && displayItems.length > 0)) && (
          <Card className="mt-10 gap-2 overflow-hidden border-primary/20 py-0">
            <CardHeader className="border-b px-6 py-3 [.border-b]:pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ReceiptText className="size-5 text-primary" />
                  <CardTitle>Order Summary</CardTitle>
                </div>
                <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold tracking-wider text-primary uppercase">
                  {isFreePlan ? (
                    <>
                      <ShieldCheck className="size-3" />
                      Free
                    </>
                  ) : (
                    <>
                      <CreditCard className="size-3" />
                      Paid
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {displayItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 p-6 transition-colors hover:bg-muted/5"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex size-10 items-center justify-center rounded-full bg-muted/50 text-muted-foreground">
                        <Package className="size-5" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <p className="font-bold text-foreground">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-2 text-sm font-medium text-primary">
                          <ShieldCheck className="size-3.5" />
                          <span>
                            {slotsPerUnit}{" "}
                            {slotsPerUnit === 1 ? "License" : "Licenses"}{" "}
                            Included
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-foreground">
                      {item.amount > 0
                        ? new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: currency,
                          }).format(item.amount / 100)
                        : "Free"}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mt-10">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Mail className="size-5 text-primary" />
              <CardTitle>Check Your Email</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              We have sent an order confirmation to the email address you
              provided during checkout. You can now use your email to log in to
              your dashboard where you can manage your licenses, assign domains,
              and download templates.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              If you do not see the email within a few minutes, please check
              your spam folder.
            </p>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <PlayCircle className="size-5 text-primary" />
              <CardTitle>Getting Started Tutorial</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              Watch this quick tutorial to learn how to set up your licenses and
              start using Shoptimity.
            </p>
            <div className="aspect-video overflow-hidden rounded-lg bg-muted">
              <video
                className="size-full"
                controls
                preload="metadata"
                src={
                  process.env.NEXT_PUBLIC_R2_PUBLIC_ENDPOINT
                    ? `${process.env.NEXT_PUBLIC_R2_PUBLIC_ENDPOINT}/video/step.mp4`
                    : ""
                }
                title="Shoptimity Setup Tutorial"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/licenses"
            className={cn(buttonVariants(), "cursor-pointer")}
          >
            Go to Licenses
          </Link>
          <Link
            href="/setup"
            className={cn(
              "cursor-pointer",
              buttonVariants({ variant: "outline" })
            )}
          >
            View Setup Guide
          </Link>
        </div>
      </div>
    </div>
  )
}
