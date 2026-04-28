"use server"

import { db } from "@/db"
import { users, licenses, plans } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { getAppSession } from "@/lib/auth-session"
import { getStripe } from "@/lib/stripe"
import { revalidatePath } from "next/cache"
import Stripe from "stripe"

export async function getUserCards() {
  const session = await getAppSession()
  if (!session) return []

  try {
    const [user] = await db
      .select({ stripeCustomerId: users.stripeCustomerId })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1)

    if (!user?.stripeCustomerId) return []

    const stripe = getStripe()
    const [paymentMethods, customer] = await Promise.all([
      stripe.paymentMethods.list({
        customer: user.stripeCustomerId,
        type: "card",
      }),
      stripe.customers.retrieve(
        user.stripeCustomerId
      ) as Promise<Stripe.Customer>,
    ])

    const defaultPM = customer.invoice_settings?.default_payment_method

    // Map Stripe object to our simplified Card interface
    return paymentMethods.data.map((pm) => ({
      id: pm.id,
      last4: pm.card?.last4 || "****",
      brand: pm.card?.brand || "unknown",
      cardExpMonth: pm.card?.exp_month || 0,
      cardExpYear: pm.card?.exp_year || 0,
      cardholderName: pm.billing_details.name,
      isDefault: pm.id === defaultPM,
    }))
  } catch (error) {
    console.error("[getUserCards] Error:", error)
    return []
  }
}

export async function setDefaultCard(paymentMethodId: string) {
  const session = await getAppSession()
  if (!session) return { error: "Unauthorized" }

  try {
    const [user] = await db
      .select({ stripeCustomerId: users.stripeCustomerId })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1)

    if (!user?.stripeCustomerId) return { error: "Customer not found" }

    const stripe = getStripe()
    await stripe.customers.update(user.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    })

    revalidatePath("/billing")
    return { success: true }
  } catch (error) {
    console.error("[setDefaultCard] Error:", error)
    return { error: "Failed to set default card" }
  }
}

export async function removeCard(paymentMethodId: string) {
  const session = await getAppSession()
  if (!session) return { error: "Unauthorized" }

  try {
    const [user] = await db
      .select({ stripeCustomerId: users.stripeCustomerId })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1)

    const stripe = getStripe()

    if (user?.stripeCustomerId) {
      const pms = await stripe.paymentMethods.list({
        customer: user.stripeCustomerId,
        type: "card",
      })

      // Prevent removing the last card
      if (pms.data.length <= 1) {
        return {
          error:
            "At least one payment method is required. Please add a new card before removing this one.",
        }
      }

      // Detach the card
      await stripe.paymentMethods.detach(paymentMethodId)

      // If we removed the card, and there are cards left, ensure one is default
      const remaining = pms.data.filter((p) => p.id !== paymentMethodId)
      if (remaining.length > 0) {
        // Check if the customer has a default set. If the one we deleted was default, set a new one.
        const customer = (await stripe.customers.retrieve(
          user.stripeCustomerId
        )) as any
        if (
          customer.invoice_settings?.default_payment_method ===
          paymentMethodId ||
          !customer.invoice_settings?.default_payment_method
        ) {
          await stripe.customers.update(user.stripeCustomerId, {
            invoice_settings: {
              default_payment_method: remaining[0].id,
            },
          })
        }
      }
    } else {
      // No customer ID means something is wrong, but technically no cards either
      return { error: "Customer not found" }
    }

    revalidatePath("/billing")
    return { success: true }
  } catch (error) {
    console.error("[removeCard] Error:", error)
    return { error: "Failed to remove card" }
  }
}

export async function createSetupSession() {
  const session = await getAppSession()
  if (!session) return { error: "Unauthorized" }

  try {
    const [user] = await db
      .select({ stripeCustomerId: users.stripeCustomerId, email: users.email })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1)

    const stripe = getStripe()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://shoptimity.com"

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "setup",
      currency: "usd",
      customer: user?.stripeCustomerId || undefined,
      customer_email: user?.stripeCustomerId ? undefined : user?.email,
      success_url: `${appUrl}/billing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/billing`,
    })

    return { url: checkoutSession.url }
  } catch (error) {
    console.error("[createSetupSession] Error:", error)
    return { error: "Failed to create setup session" }
  }
}

export async function createSetupIntent() {
  const session = await getAppSession()
  if (!session) return { error: "Unauthorized" }

  try {
    const [user] = await db
      .select({
        stripeCustomerId: users.stripeCustomerId,
        email: users.email,
        name: users.name,
      })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1)

    if (!user) return { error: "User not found" }

    const stripe = getStripe()
    let customerId = user.stripeCustomerId

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || user.email.split("@")[0],
        metadata: { userId: session.userId },
      })
      customerId = customer.id

      await db
        .update(users)
        .set({ stripeCustomerId: customerId })
        .where(eq(users.id, session.userId))
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
    })

    return { clientSecret: setupIntent.client_secret }
  } catch (error) {
    console.error("[createSetupIntent] Error:", error)
    return { error: "Failed to create setup intent" }
  }
}

export async function checkDuplicateCard(paymentMethodId: string) {
  const session = await getAppSession()
  if (!session) return { error: "Unauthorized" }

  try {
    const [user] = await db
      .select({ stripeCustomerId: users.stripeCustomerId })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1)

    if (!user?.stripeCustomerId) return { error: "Customer not found" }

    const stripe = getStripe()

    // Retrieve the new payment method to get its fingerprint
    const newPM = await stripe.paymentMethods.retrieve(paymentMethodId)
    const newFingerprint = newPM.card?.fingerprint

    if (!newFingerprint) return { success: true } // Should not happen for cards

    // List all existing payment methods
    const existingPMs = await stripe.paymentMethods.list({
      customer: user.stripeCustomerId,
      type: "card",
    })

    // Check if any other PM has the same fingerprint
    const duplicate = existingPMs.data.find(
      (pm) =>
        pm.id !== paymentMethodId && pm.card?.fingerprint === newFingerprint
    )

    if (duplicate) {
      // Detach the newly created PM since it's a duplicate
      await stripe.paymentMethods.detach(paymentMethodId)
      return {
        error: "This card is already added to your account.",
        isDuplicate: true,
        existingPaymentMethodId: duplicate.id,
      }
    }

    return { success: true }
  } catch (error) {
    console.error("[checkDuplicateCard] Error:", error)
    return { error: "Failed to verify card" }
  }
}

export async function cancelSubscription(subscriptionId: string) {
  const session = await getAppSession()
  if (!session) return { error: "Unauthorized" }

  try {
    const stripe = getStripe()

    // Handle Trial Cancellations (Setup Intents)
    if (subscriptionId.startsWith("seti_")) {
      await db
        .update(licenses)
        .set({
          status: "revoked",
          revokedReason: "trial_canceled",
          updatedAt: new Date(),
        })
        .where(eq(licenses.stripeSubscriptionId, subscriptionId))

      revalidatePath("/billing")
      return { success: true }
    }

    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    })

    // Update local DB for immediate feedback
    await db
      .update(licenses)
      .set({
        cancelAtPeriodEnd: true,
        updatedAt: new Date(),
      })
      .where(eq(licenses.stripeSubscriptionId, subscriptionId))

    revalidatePath("/billing")
    return {
      success: true,
      cancelAt: (subscription as any).current_period_end,
    }
  } catch (error) {
    console.error("[cancelSubscription] Error:", error)
    return { error: "Failed to cancel subscription" }
  }
}

export async function reactivateSubscription(subscriptionId: string) {
  const session = await getAppSession()
  if (!session) return { error: "Unauthorized" }

  try {
    const stripe = getStripe()
    await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    })

    // Update local DB for immediate feedback
    await db
      .update(licenses)
      .set({
        cancelAtPeriodEnd: false,
        updatedAt: new Date(),
      })
      .where(eq(licenses.stripeSubscriptionId, subscriptionId))

    revalidatePath("/billing")
    return { success: true }
  } catch (error) {
    console.error("[reactivateSubscription] Error:", error)
    return { error: "Failed to reactivate subscription" }
  }
}

export async function applyRetentionDiscount(
  licenseId: string,
  subscriptionId: string,
  discountPercent: number,
  duration: number,
  billingCycle: "monthly" | "yearly",
  couponCode?: string | null
) {
  const session = await getAppSession()
  if (!session) return { error: "Unauthorized" }

  try {
    const stripe = getStripe()

    // 1. Verify ownership and state
    const [license] = await db
      .select()
      .from(licenses)
      .where(and(eq(licenses.id, licenseId), eq(licenses.userId, session.userId)))
      .limit(1)

    if (!license) return { error: "License not found" }
    if (license.retentionDiscountUsed) return { error: "Retention discount already used for this license" }

    let couponId = ""

    if (couponCode) {
      // Validate the provided coupon code first
      try {
        const stripeCoupon = await stripe.coupons.retrieve(couponCode)
        couponId = stripeCoupon.id
      } catch (e) {
        console.warn(`Configured retention coupon ${couponCode} not found in Stripe, falling back to dynamic creation.`)
      }
    }

    const durationInMonths =
      billingCycle === "yearly" ? duration * 12 : duration

    if (!couponId) {
      const coupon = await stripe.coupons.create({
        percent_off: discountPercent,
        duration: "repeating",
        duration_in_months: durationInMonths,
        name: `${discountPercent}% Retention Discount`,
      })
      couponId = coupon.id
    }

    // 3. Apply it to the subscription and ensure it's not set to cancel
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      discounts: [{ coupon: couponId }],
      cancel_at_period_end: false, // Ensure they stay subscribed
    })

    // 4. Update local DB
    const nextPaymentDate = new Date(((subscription as any).current_period_end * 1000))

    await db.update(licenses).set({
      retentionDiscountUsed: true,
      retentionDiscountEndsAt: new Date(
        Date.now() + durationInMonths * 30 * 24 * 60 * 60 * 1000
      ),
      cancelAtPeriodEnd: false,
      updatedAt: new Date(),
    }).where(eq(licenses.id, licenseId))

    revalidatePath("/billing")
    revalidatePath("/billing/cancel")

    return {
      success: true,
      nextPaymentDate: nextPaymentDate.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      amountDue: subscription.items.data[0].price.unit_amount
        ? Math.round(subscription.items.data[0].price.unit_amount * (1 - discountPercent / 100))
        : 0
    }
  } catch (error) {
    console.error("[applyRetentionDiscount] Error:", error)
    return { error: "Failed to apply discount. Please try again." }
  }
}

export async function getBillingInfo() {
  const session = await getAppSession()
  if (!session) return null

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1)

    if (!user) return null

    // If we have address in DB, return it (faster)
    if (user.addressLine1 || user.country) {
      return {
        line1: user.addressLine1 || "",
        line2: user.addressLine2 || "",
        city: user.city || "",
        state: user.state || "",
        postalCode: user.postalCode || "",
        country: user.country || "",
        company: user.company || "",
      }
    }

    // Fallback to Stripe if DB is empty
    if (!user.stripeCustomerId) return null

    const stripe = getStripe()
    const customer = await stripe.customers.retrieve(user.stripeCustomerId)

    if (!customer || (customer as any).deleted) return null

    const activeCustomer = customer as Stripe.Customer

    return {
      line1: activeCustomer.address?.line1 || "",
      line2: activeCustomer.address?.line2 || "",
      city: activeCustomer.address?.city || "",
      state: activeCustomer.address?.state || "",
      postalCode: activeCustomer.address?.postal_code || "",
      country: activeCustomer.address?.country || "",
      company: (activeCustomer.metadata?.company as string) || "",
    }
  } catch (error) {
    console.error("[getBillingInfo] Error:", error)
    return null
  }
}

export async function updateBillingInfo(data: {
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  zipCode: string
  country: string
  company?: string
}) {
  const session = await getAppSession()
  if (!session) return { error: "Unauthorized" }

  try {
    const [user] = await db
      .select({ stripeCustomerId: users.stripeCustomerId })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1)

    if (!user?.stripeCustomerId) return { error: "Customer not found" }

    // Update Stripe
    const stripe = getStripe()
    await stripe.customers.update(user.stripeCustomerId, {
      address: {
        line1: data.addressLine1,
        line2: data.addressLine2,
        city: data.city,
        state: data.state,
        postal_code: data.zipCode,
        country: data.country,
      },
      metadata: {
        company: data.company || "",
      },
    })

    // Update local database
    await db
      .update(users)
      .set({
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2,
        city: data.city,
        state: data.state,
        postalCode: data.zipCode,
        country: data.country,
        company: data.company || null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.userId))

    revalidatePath("/billing")
    revalidatePath("/checkout")
    return { success: true }
  } catch (error) {
    console.error("[updateBillingInfo] Error:", error)
    return { error: "Failed to update billing info" }
  }
}

export async function previewSubscriptionUpgrade(licenseId: string) {
  const session = await getAppSession()
  if (!session) return { error: "Unauthorized" }

  try {
    const [license] = await db
      .select()
      .from(licenses)
      .where(
        and(eq(licenses.id, licenseId), eq(licenses.userId, session.userId))
      )
      .limit(1)

    if (!license || !license.stripeSubscriptionId)
      return { error: "Subscription not found" }
    if (license.billingCycle === "yearly")
      return { error: "Already on a yearly plan" }

    const stripe = getStripe()
    const subscription = await stripe.subscriptions.retrieve(
      license.stripeSubscriptionId
    )
    if (!subscription.items.data.length)
      return { error: "No subscription items found" }

    const subscriptionItem = subscription.items.data[0]
    const currentProductId = subscriptionItem.price.product as string

    // Find the yearly plan details for the current plan name
    const [currentPlan] = await db
      .select()
      .from(plans)
      .where(eq(plans.id, license.planId))
      .limit(1)
    if (!currentPlan) return { error: "Plan not found" }

    const [yearlyPlan] = await db
      .select()
      .from(plans)
      .where(and(eq(plans.name, currentPlan.name), eq(plans.mode, "yearly")))
      .limit(1)

    if (!yearlyPlan) return { error: "Yearly equivalent plan not found" }

    // Calculate final price for yearly plans
    const discount = currentPlan.yearlyDiscountPercentage || 0
    const discountedMonthly = Math.round(
      currentPlan.finalPrice * (1 - discount / 100)
    )
    const finalYearlyAmount = discountedMonthly * 12

    // Preview the upcoming invoice with the upgrade
    const upcomingInvoice = await stripe.invoices.createPreview({
      customer: subscription.customer as string,
      subscription: license.stripeSubscriptionId,
      subscription_details: {
        items: [
          {
            id: subscriptionItem.id,
            price_data: {
              currency: yearlyPlan.currency || "usd",
              product: currentProductId,
              unit_amount: finalYearlyAmount,
              recurring: { interval: "year" },
            },
          },
        ],
      },
    })

    return {
      success: true,
      preview: {
        currentPlan: currentPlan.name,
        newPlan: yearlyPlan.name,
        creditAmount:
          upcomingInvoice.lines.data.find((line: any) => line.amount < 0)
            ?.amount || 0,
        chargeAmount: upcomingInvoice.amount_due,
        currency: upcomingInvoice.currency,
        yearlyPlanId: yearlyPlan.id,
        finalYearlyAmount,
      },
    }
  } catch (error) {
    console.error("[previewSubscriptionUpgrade] Error:", error)
    return { error: "Failed to preview upgrade" }
  }
}

export async function upgradeSubscriptionToYearly(
  licenseId: string,
  yearlyPlanId: string,
  finalYearlyAmount: number
) {
  const session = await getAppSession()
  if (!session) return { error: "Unauthorized" }

  try {
    const [license] = await db
      .select()
      .from(licenses)
      .where(
        and(eq(licenses.id, licenseId), eq(licenses.userId, session.userId))
      )
      .limit(1)

    if (!license || !license.stripeSubscriptionId)
      return { error: "Subscription not found" }

    const [yearlyPlan] = await db
      .select()
      .from(plans)
      .where(eq(plans.id, yearlyPlanId))
      .limit(1)
    if (!yearlyPlan) return { error: "Yearly plan not found" }

    const stripe = getStripe()
    const subscription = await stripe.subscriptions.retrieve(
      license.stripeSubscriptionId
    )
    const subscriptionItem = subscription.items.data[0]
    const currentProductId = subscriptionItem.price.product as string

    // Update the subscription with proration
    const updatedSubscription = await stripe.subscriptions.update(
      license.stripeSubscriptionId,
      {
        items: [
          {
            id: subscriptionItem.id,
            price_data: {
              currency: yearlyPlan.currency || "usd",
              product: currentProductId,
              unit_amount: finalYearlyAmount,
              recurring: { interval: "year" },
            },
          },
        ],
        proration_behavior: "always_invoice", // Creates immediate invoice with credits
      }
    )

    // Update local DB
    await db
      .update(licenses)
      .set({
        planId: yearlyPlan.id,
        billingCycle: "yearly",
        nextRenewalDate: new Date(
          (updatedSubscription as any).current_period_end * 1000
        ),
        updatedAt: new Date(),
      })
      .where(eq(licenses.id, licenseId))

    // Handle invoice payment immediately if open
    const latestInvoiceId = updatedSubscription.latest_invoice as string
    if (latestInvoiceId) {
      const latestInvoice = await stripe.invoices.retrieve(latestInvoiceId)
      if (latestInvoice.status === "open") {
        await stripe.invoices.pay(latestInvoice.id).catch((err) => {
          console.error("Failed to pay invoice immediately", err)
        })
      }
    }

    revalidatePath("/billing")
    return { success: true, message: "Subscription upgraded successfully" }
  } catch (error: any) {
    console.error("[upgradeSubscriptionToYearly] Error:", error)
    return { error: error.message || "Failed to upgrade subscription" }
  }
}

export async function downgradeToFreePlan(licenseId: string) {
  const session = await getAppSession()
  if (!session) return { error: "Unauthorized" }

  try {
    const [license] = await db
      .select()
      .from(licenses)
      .where(
        and(eq(licenses.id, licenseId), eq(licenses.userId, session.userId))
      )
      .limit(1)

    if (!license) return { error: "License not found" }

    const subscriptionId = license.stripeSubscriptionId
    if (!subscriptionId) return { error: "No active Stripe subscription" }

    const stripe = getStripe()

    //     // Matches anything starting with 'seti_' OR anything NOT starting with 'sub_'
    // const invalidPattern = /^(seti_|(?!sub_))/;

    // if (invalidPattern.test(subscriptionId)) {

    // Handle Non-Subscription IDs (Setup Intents, Payment Methods, etc.)
    // If it's not a proper subscription ID (sub_...), we just perform a local downgrade
    if (subscriptionId.startsWith("seti_") || !subscriptionId.startsWith("sub_")) {
      const [freePlan] = await db
        .select()
        .from(plans)
        .where(eq(plans.mode, "free"))
        .limit(1)
      if (freePlan) {
        await db
          .update(licenses)
          .set({
            planId: freePlan.id,
            status: "active",
            isTrial: false,
            totalSlots: freePlan.slots,
            billingCycle: "monthly",
            stripeSubscriptionId: null,
            cancelAtPeriodEnd: false,
            trialEndsAt: null,
            nextRenewalDate: null,
            updatedAt: new Date(),
          })
          .where(eq(licenses.id, licenseId))
      }

      revalidatePath("/billing")
      return {
        success: true,
        message: "Successfully downgraded to the Free plan.",
      }
    }

    // Paid subscription: schedule cancellation at period end to prevent refunds/payment return
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    })

    // Update local DB for immediate feedback in the UI
    await db
      .update(licenses)
      .set({
        cancelAtPeriodEnd: true,
        updatedAt: new Date(),
      })
      .where(eq(licenses.id, licenseId))

    revalidatePath("/billing")

    return {
      success: true,
      message:
        "Your subscription will not renew. You will be automatically moved to the Free plan at the end of your billing cycle.",
      cancelAt: (subscription as any).current_period_end,
    }
  } catch (error: any) {
    console.error("[downgradeToFreePlan] Error:", error)
    return { error: error.message || "Failed to downgrade plan" }
  }
}
export async function validateCoupon(code: string) {
  const session = await getAppSession()
  if (!session) return { error: "Unauthorized" }

  try {
    const stripe = getStripe()
    // First try as promotion code
    const promoCodes = await stripe.promotionCodes.list({
      code: code.trim(),
      active: true,
      expand: ["data.coupon"],
    })

    if (promoCodes.data.length > 0) {
      const promo = promoCodes.data[0] as any
      const coupon = promo.coupon as Stripe.Coupon
      return {
        id: promo.id,
        couponId: coupon.id,
        percentOff: coupon.percent_off,
        amountOff: coupon.amount_off,
        name: coupon.name || code,
      }
    }

    // Then try as raw coupon ID
    try {
      const coupon = await stripe.coupons.retrieve(code.trim())
      if (coupon) {
        return {
          id: coupon.id,
          couponId: coupon.id,
          percentOff: coupon.percent_off,
          amountOff: coupon.amount_off,
          name: coupon.name || code,
        }
      }
    } catch (e) {
      // Ignore retrieve error and return default error below
    }

    return { error: "Invalid or expired discount code" }
  } catch (error) {
    console.error("[validateCoupon] Error:", error)
    return { error: "Invalid discount code" }
  }
}
