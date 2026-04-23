import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { db } from "@/db"
import { licenses, plans, users } from "@/db/schema"
import { and, eq } from "drizzle-orm"
import { z } from "zod"
import { createAuditLog } from "@/lib/audit"
import { getAppSession } from "@/lib/auth-session"

const checkoutSchema = z.object({
  email: z
    .string()
    .email()
    .transform((v) => v.toLowerCase().trim()),
  contactName: z.string().min(1).max(200),
  planId: z.string().uuid(),
  licenseQuantity: z.number().int().min(1).max(100),
  domains: z.array(z.string()).max(300).optional(),
  isYearly: z.boolean().optional(),
})

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!)
}

async function createCheckoutSession({
  stripe,
  plan,
  isTrial,
  userEmail,
  contactName,
  licenseQuantity,
  domains,
  appUrl,
  isYearlyPlan,
}: {
  stripe: Stripe
  plan: any
  isTrial: boolean
  userEmail?: string
  contactName?: string
  licenseQuantity: number
  domains?: string[]
  appUrl: string
  isYearlyPlan?: boolean
}) {
  // Direct Check: Use all domains if they fit in 300 chars, otherwise fallback to first 3
  const domainsJson = domains ? JSON.stringify(domains) : ""
  const domainsMetadata =
    domainsJson.length <= 300
      ? domainsJson
      : JSON.stringify(domains!.slice(0, 3))

  const metadata = {
    plan_id: plan.id,
    license_quantity: String(licenseQuantity || 1),
    contact_name: contactName || "",
    domains: domainsMetadata,
    is_trial: isTrial ? "true" : "false",
    is_lifetime: "true",
    type: isTrial ? "trial_setup" : "lifetime_purchase",
  }

  return await stripe.checkout.sessions.create({
    mode: isTrial ? "setup" : "payment",
    customer_email: userEmail || undefined,
    customer_creation: "always", // Ensure a customer is ALWAYS created to get customer ID in webhook
    metadata,
    ...(isTrial
      ? {
          currency: plan.currency || "usd",
          setup_intent_data: {
            metadata,
          },
          custom_text: {
            submit: {
              message: `Start your ${plan.trialDays}-day free trial now. You will only be charged after the trial ends.`,
            },
          },
        }
      : {
          line_items: [
            {
              price_data: {
                currency: plan.currency || "usd",
                product_data: {
                  name: `${plan.name} (${isYearlyPlan ? "Yearly" : "Lifetime"} ${plan.slots > 1 ? "Licenses" : "License"})`,
                  description: `${isYearlyPlan ? "1-Year" : "Lifetime"} access for ${plan.slots} domain${plan.slots > 1 ? "s" : ""}.`,
                },
                unit_amount:
                  isYearlyPlan && plan.yearlyDiscount
                    ? Math.round(
                        plan.finalPrice * (1 - plan.yearlyDiscount / 100)
                      )
                    : plan.finalPrice,
              },
              quantity: 1, // Quantity of the plan is always 1 as the price accounts for everything
            },
          ],
          payment_intent_data: {
            metadata: {
              ...metadata,
              email: userEmail || "",
            },
          },
          allow_promotion_codes: true,
        }),
    success_url: `${appUrl}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/pricing`,
  })
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const planId = searchParams.get("planId")
  const quantityStr = searchParams.get("quantity") || "1"
  const quantity = parseInt(quantityStr, 10)
  const isYearly = searchParams.get("isYearly") === "true"

  if (!planId) {
    return NextResponse.redirect(new URL("/pricing", request.url))
  }

  // Get plan details
  const [plan] = await db
    .select()
    .from(plans)
    .where(and(eq(plans.id, planId), eq(plans.isActive, true)))
    .limit(1)

  if (!plan) {
    return NextResponse.redirect(new URL("/pricing", request.url))
  }

  // Get user session for pre-filling and security
  const session = await getAppSession()

  if (!session) {
    return NextResponse.redirect(
      new URL("/login?redirect=/pricing", request.url)
    )
  }

  let contactName = ""
  let userEmail = session.email
  const [userRecord] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1)
  contactName = userRecord?.name || ""

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://shoptimity.com"
  const stripe = getStripe()

  // Check trial eligibility if logged in
  let isTrialEligible = plan.trialDays > 0

  if (session && isTrialEligible) {
    const existingLicenses = await db
      .select({ id: licenses.id, isTrial: licenses.isTrial })
      .from(licenses)
      .where(
        and(eq(licenses.userId, session.userId), eq(licenses.planId, planId))
      )
      .limit(1)

    if (existingLicenses.length > 0) {
      // User already had/has a license for this plan
      isTrialEligible = false
    }
  }

  const domain = searchParams.get("domain")
  const domains = domain ? [domain] : undefined

  try {
    const isTrial = isTrialEligible
    const stripeSession = await createCheckoutSession({
      stripe,
      plan,
      isTrial,
      userEmail: userEmail || undefined,
      contactName,
      licenseQuantity: quantity,
      domains,
      appUrl,
      isYearlyPlan: isYearly,
    })

    // await createAuditLog(
    //   session?.userId || null,
    //   "checkout.direct_redirect",
    //   "checkout",
    //   stripeSession.id,
    //   {
    //     email: userEmail,
    //     planId,
    //     licenseQuantity: quantity,
    //   }
    // )

    return NextResponse.redirect(new URL(stripeSession.url!, request.url))
  } catch (err) {
    console.error("Stripe direct checkout error:", err)
    return NextResponse.redirect(new URL("/pricing", request.url))
  }
}

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }
  const parsed = checkoutSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid checkout data", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { email, contactName, planId, licenseQuantity, domains, isYearly } =
    parsed.data

  // Get plan
  const [plan] = await db
    .select()
    .from(plans)
    .where(and(eq(plans.id, planId), eq(plans.isActive, true)))
    .limit(1)

  if (!plan || !plan.isActive) {
    return NextResponse.json(
      { error: "Plan not found or inactive" },
      { status: 404 }
    )
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://shoptimity.com"
  const stripe = getStripe()

  // Find user by email if possible to check trial history
  let isTrialEligible = plan.trialDays > 0
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (existingUser && isTrialEligible) {
    const existingLicenses = await db
      .select({ id: licenses.id })
      .from(licenses)
      .where(
        and(eq(licenses.userId, existingUser.id), eq(licenses.planId, planId))
      )
      .limit(1)

    if (existingLicenses.length > 0) {
      isTrialEligible = false
    }
  }

  try {
    const isTrial = isTrialEligible
    const session = await createCheckoutSession({
      stripe,
      plan,
      isTrial,
      userEmail: email,
      contactName,
      licenseQuantity,
      domains,
      appUrl,
      isYearlyPlan: isYearly,
    })

    // await createAuditLog(null, "checkout.initiated", "checkout", session.id, {
    //   email,
    //   planId,
    //   licenseQuantity,
    // })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error("Stripe checkout error:", err)
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    )
  }
}
