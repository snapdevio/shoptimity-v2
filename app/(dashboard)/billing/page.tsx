import { getAppSession } from "@/lib/auth-session"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { licenses, plans, users } from "@/db/schema"
import { and, eq, desc, or } from "drizzle-orm"
import { BillingClient } from "./billing-client"
import { getStripe } from "@/lib/stripe"
import { payments as paymentsTable } from "@/db/schema"

export default async function BillingPage() {
  const session = await getAppSession()
  if (!session) {
    redirect("/login?redirect=/billing")
  }

  // Fetch user to get stripeCustomerId
  const [userRecord] = await db
    .select({ stripeCustomerId: users.stripeCustomerId })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1)

  let cards: any[] = []
  let defaultPaymentMethodId: string | null = null
  let initialBillingInfo = {
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "United Arab Emirates",
    company: "",
  }

  if (userRecord?.stripeCustomerId) {
    const stripe = getStripe()
    const [customer, paymentMethods] = await Promise.all([
      stripe.customers.retrieve(userRecord.stripeCustomerId),
      stripe.paymentMethods.list({
        customer: userRecord.stripeCustomerId,
        type: "card",
      }),
    ])

    if (!customer.deleted) {
      const c = customer as any
      defaultPaymentMethodId =
        (c.invoice_settings?.default_payment_method as string) || null
      initialBillingInfo = {
        line1: c.address?.line1 || "",
        line2: c.address?.line2 || "",
        city: c.address?.city || "",
        state: c.address?.state || "",
        postalCode: c.address?.postal_code || "",
        country: c.address?.country || "United Arab Emirates",
        company: c.metadata?.company || "",
      }
    }

    cards = paymentMethods.data.map((pm) => ({
      id: pm.id,
      last4: pm.card?.last4 || "****",
      brand: pm.card?.brand || "unknown",
      cardExpMonth: pm.card?.exp_month || 0,
      cardExpYear: pm.card?.exp_year || 0,
      cardholderName: pm.billing_details.name,
      isDefault: pm.id === defaultPaymentMethodId,
    }))
  }

  // Fetch active license and plan
  const [activeLicense] = await db
    .select({
      id: licenses.id,
      status: licenses.status,
      plan: {
        name: plans.name,
        finalPrice: plans.finalPrice,
        mode: plans.mode,
        yearlyDiscountPercentage: plans.yearlyDiscountPercentage,
      },
      billingCycle: licenses.billingCycle,
      stripeSubscriptionId: licenses.stripeSubscriptionId,
      trialEndsAt: licenses.trialEndsAt,
      nextRenewalDate: licenses.nextRenewalDate,
      cancelAtPeriodEnd: licenses.cancelAtPeriodEnd,
    })
    .from(licenses)
    .leftJoin(plans, eq(licenses.planId, plans.id))
    .where(
      and(
        eq(licenses.userId, session.userId),
        or(eq(licenses.status, "active"), eq(licenses.status, "trialing"))
      )
    )
    .limit(1)

  // Fetch payment history with plan details
  const userPayments = await db
    .select({
      id: paymentsTable.id,
      amount: paymentsTable.amount,
      currency: paymentsTable.currency,
      status: paymentsTable.status,
      stripeInvoiceUrl: paymentsTable.stripeInvoiceUrl,
      createdAt: paymentsTable.createdAt,
      appliedPromoCode: paymentsTable.appliedPromoCode,
      planName: plans.name,
    })
    .from(paymentsTable)
    .leftJoin(plans, eq(paymentsTable.planId, plans.id))
    .where(eq(paymentsTable.userId, session.userId))
    .orderBy(desc(paymentsTable.createdAt))
    .limit(20)

  // Fetch Next Payment Date from DB or Trial
  let nextPaymentDate: number | null = null

  if (activeLicense?.status === "trialing" && activeLicense.trialEndsAt) {
    nextPaymentDate = Math.floor(
      new Date(activeLicense.trialEndsAt).getTime() / 1000
    )
  } else if (activeLicense?.nextRenewalDate) {
    nextPaymentDate = Math.floor(
      new Date(activeLicense.nextRenewalDate).getTime() / 1000
    )
  }

  if (!nextPaymentDate && activeLicense?.stripeSubscriptionId) {
    const stripe = getStripe()
    try {
      const subscription = await stripe.subscriptions.retrieve(
        activeLicense.stripeSubscriptionId
      )
      if ("current_period_end" in subscription) {
        nextPaymentDate = (subscription as any).current_period_end as number
      }
    } catch (err) {
      console.error("Failed to fetch subscription for next payment date:", err)
    }
  }

  return (
    <BillingClient
      initialCards={cards}
      activeLicense={activeLicense}
      initialBillingInfo={initialBillingInfo}
      userPayments={userPayments}
      nextPaymentDate={nextPaymentDate}
    />
  )
}
