"use server"
import { eq, and, isNull } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { getAppSession } from "@/lib/auth-session"
import { db } from "@/db"
import { licenses, domains } from "@/db/schema"
import { getStripe } from "@/lib/stripe"
import { createAuditLog } from "@/lib/audit"
import { enqueueLicenseMetadataExportJob } from "@/lib/queue"

export async function cancelLicenseSubscription(licenseId: string) {
  try {
    const session = await getAppSession()
    if (!session) {
      return { error: "Authentication required" }
    }

    // 1. Verify existence and ownership
    const [license] = await db
      .select()
      .from(licenses)
      .where(
        and(eq(licenses.id, licenseId), eq(licenses.userId, session.userId))
      )
      .limit(1)

    if (!license) {
      return { error: "License not found" }
    }

    // 2. Validate it's a cancelable subscription
    const isSetupIntent = license.stripeSubscriptionId?.startsWith("seti_")

    // 3. If it's a trial without a real subscription (or a SetupIntent), we revoke immediately
    if (!license.stripeSubscriptionId || isSetupIntent) {
      await db.transaction(async (tx) => {
        // 1. Update license status
        await tx
          .update(licenses)
          .set({
            status: "canceled",
            revokedReason: "trial_canceled", // or "subscription_deleted"
            isLifetime: false,
            isTrial: false,
            trialEndsAt: null,
            updatedAt: new Date(),
          })
          .where(eq(licenses.id, licenseId))

        // 2. Fetch active domains and deactivate them
        const activeDomains = await tx
          .select()
          .from(domains)
          .where(
            and(eq(domains.licenseId, licenseId), isNull(domains.deletedAt))
          )

        for (const dom of activeDomains) {
          await db
            .update(domains)
            .set({ deletedAt: new Date(), updatedAt: new Date() })
            .where(eq(domains.id, dom.id))
          await enqueueLicenseMetadataExportJob({
            domainName: dom.domainName,
            userId: session.userId,
            action: "delete", // Remove from active set
          })
        }

        // 3. Mark domains as deleted in DB
        // await tx
        //   .update(domains)
        //   .set({ deletedAt: new Date(), updatedAt: new Date() })
        //   .where(and(eq(domains.licenseId, licenseId), isNull(domains.deletedAt)))
      })

      await createAuditLog(
        session.userId,
        "license.trial_cancel_user",
        "license",
        licenseId,
        {
          stripeSubscriptionId: license.stripeSubscriptionId,
          type: isSetupIntent ? "setup_intent" : "trial",
        }
      )

      revalidatePath("/licenses")
      return { success: true }
    }

    // 3. Cancel in Stripe (at period end) for actual subscriptions
    const stripe = getStripe()
    await stripe.subscriptions.update(license.stripeSubscriptionId, {
      cancel_at_period_end: true,
    })

    // 4. Note: Status will be synced by webhook for real subscriptions.
    // For now, we rely on the audit log and Stripe confirmation.

    await createAuditLog(
      session.userId,
      "license.subscription_cancel_requested",
      "license",
      licenseId,
      { stripeSubscriptionId: license.stripeSubscriptionId }
    )

    revalidatePath("/licenses")
    return { success: true }
  } catch (error) {
    console.error("[cancelLicenseSubscription] Error:", error)
    return { error: "Failed to cancel subscription. Please contact support." }
  }
}
