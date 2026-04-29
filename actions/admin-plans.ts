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
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(255),
  mode: z.enum(["monthly", "yearly", "free", "lifetime"]),
  slots: z.number().int().min(1),
  regularPrice: z.number().int().min(0),
  finalPrice: z.number().int().min(0),
  currency: z.string().min(1).max(10),
  stripePaymentLink: z.string().url().nullable().optional(),
  isActive: z.boolean(),
  features: z.array(z.string()).optional(),
  position: z.number().int().default(0),
  trialDays: z.number().int().min(0).default(0),
  yearlyDiscountPercentage: z.number().int().min(0).nullable().optional(),
  yearlyDiscountCouponCode: z.string().nullable().optional(),
  couponCode: z.string().nullable().optional(),
  hasYearlyPlan: z.boolean().default(false),
  badge: z.string().max(255).nullable().optional(),
  monthlyCancelDiscount: z.number().int().min(0).default(0),
  yearlyCancelDiscount: z.number().int().min(0).default(0),
  monthlyCancelCouponCode: z.string().nullable().optional(),
  yearlyCancelCouponCode: z.string().nullable().optional(),
  monthlyCancelDuration: z.number().int().min(1).default(3),
  yearlyCancelDuration: z.number().int().min(1).default(1),
  cancelApplyDiscount: z.boolean().default(false),
})

export async function upsertPlan(data: z.infer<typeof updatePlanSchema>) {
  try {
    await requireAdmin()
    const validated = updatePlanSchema.parse(data)

    const planId =
      validated.id ||
      (
        await db
          .insert(plans)
          .values({
            ...validated,
            id: undefined,
          })
          .returning({ id: plans.id })
      )[0].id

    if (validated.id) {
      await db
        .update(plans)
        .set({
          ...validated,
          updatedAt: new Date(),
        })
        .where(eq(plans.id, validated.id))
    }

    revalidatePath("/admin/plans")
    revalidatePath("/plans")
    revalidatePath("/pricing")
    revalidatePath("/")

    return { success: true, id: planId }
  } catch (error) {
    console.error("Failed to upsert plan:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function deletePlan(id: string) {
  try {
    await requireAdmin()
    await db.delete(plans).where(eq(plans.id, id))
    revalidatePath("/admin/plans")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete plan:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function getActivePlans() {
  try {
    return await db
      .select()
      .from(plans)
      .where(eq(plans.isActive, true))
      .orderBy(plans.position, plans.slots)
  } catch (error) {
    console.error("Failed to fetch active plans:", error)
    return []
  }
}

export async function getAllPlans(params?: {
  page?: number
  limit?: number
  search?: string
  sortField?: string
  sortOrder?: "asc" | "desc"
}) {
  try {
    await requireAdmin()
    const page = params?.page || 1
    const limit = params?.limit || 10
    const offset = (page - 1) * limit
    const search = params?.search || ""
    const sortField = (params?.sortField as any) || "position"
    const sortOrder = params?.sortOrder || "asc"

    let query = db.select().from(plans)

    // TODO: Add search filter if needed, but for plans it's usually a small list.
    // For consistency with other pages, we'll implement it.

    // Sort logic
    const order =
      sortOrder === "asc"
        ? sql`${(plans as any)[sortField]} ASC`
        : sql`${(plans as any)[sortField]} DESC`

    const data = await db
      .select()
      .from(plans)
      .limit(limit)
      .offset(offset)
      .orderBy(order)

    const totalCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(plans)

    return {
      data,
      metadata: {
        total: totalCount[0].count,
        page,
        limit,
        totalPages: Math.ceil(totalCount[0].count / limit),
      },
    }
  } catch (error) {
    console.error("Failed to fetch all plans:", error)
    return {
      data: [],
      metadata: { total: 0, page: 1, limit: 10, totalPages: 0 },
    }
  }
}
