"use server"

import { db } from "@/db"
import { plans } from "@/db/schema"
import { eq, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getAppSession } from "@/lib/auth-session"

async function requireAdmin() {
  const session = await getAppSession()
  if (!session || session.role !== "admin") {
    throw new Error("Forbidden")
  }
  return session
}

const updatePlanSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  slots: z.number().int().min(1),
  regularPrice: z.number().int().min(0),
  finalPrice: z.number().int().min(0),
  currency: z.string().min(1).max(10),
  stripePaymentLink: z.string().url().nullable().optional(),
  isActive: z.boolean(),
  features: z.array(z.string()).optional(),
  position: z.number().int().default(0),
  trialDays: z.number().int().min(0).default(0),
})

export async function updatePlan(data: z.infer<typeof updatePlanSchema>) {
  try {
    await requireAdmin()
    const validated = updatePlanSchema.parse(data)
    await db
      .update(plans)
      .set({
        name: validated.name,
        slots: validated.slots,
        regularPrice: validated.regularPrice,
        finalPrice: validated.finalPrice,
        currency: validated.currency,
        stripePaymentLink: validated.stripePaymentLink,
        isActive: validated.isActive,
        features: validated.features,
        position: validated.position,
        trialDays: validated.trialDays,
        updatedAt: new Date(),
      })
      .where(eq(plans.id, validated.id))

    revalidatePath("/admin/plans")
    revalidatePath("/plans")
    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error("Failed to update plan:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.flatten() }
    }
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function getActivePlans() {
  try {
    return await db
      .select()
      .from(plans)
      .where(eq(plans.isActive, true))
      .orderBy(
        sql`CASE WHEN ${plans.position} = 0 THEN 999 ELSE ${plans.position} END ASC`,
        plans.slots
      )
  } catch (error) {
    console.error("Failed to fetch active plans:", error)
    return []
  }
}

export async function getAllPlans() {
  try {
    await requireAdmin()
    return await db
      .select()
      .from(plans)
      .orderBy(
        sql`CASE WHEN ${plans.position} = 0 THEN 999 ELSE ${plans.position} END ASC`,
        plans.slots
      )
  } catch (error) {
    console.error("Failed to fetch all plans:", error)
    return []
  }
}
