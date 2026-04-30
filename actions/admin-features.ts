"use server"

import { db } from "@/db"
import { featureCategories, features, planFeatures } from "@/db/schema"
import { eq, sql, ilike, asc, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getAppSession } from "@/lib/auth-session"

// Allowlists for client-supplied sort fields. See note in admin-plans.ts.
const CATEGORY_SORT_COLUMNS = {
  position: featureCategories.position,
  name: featureCategories.name,
  slug: featureCategories.slug,
  createdAt: featureCategories.createdAt,
  updatedAt: featureCategories.updatedAt,
} as const

const FEATURE_SORT_COLUMNS = {
  position: features.position,
  name: features.name,
  slug: features.slug,
  createdAt: features.createdAt,
  updatedAt: features.updatedAt,
} as const

async function requireAdmin() {
  const session = await getAppSession()
  if (!session || session.role !== "admin") {
    throw new Error("Forbidden")
  }
  return session
}

// --- Feature Categories ---

const categorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  isActive: z.boolean(),
  position: z.number().int().default(0),
})

export async function upsertCategory(data: z.infer<typeof categorySchema>) {
  try {
    await requireAdmin()
    const validated = categorySchema.parse(data)

    if (validated.id) {
      await db
        .update(featureCategories)
        .set({ ...validated, updatedAt: new Date() })
        .where(eq(featureCategories.id, validated.id))
    } else {
      await db.insert(featureCategories).values(validated)
    }

    revalidatePath("/admin/feature-categories")
    revalidatePath("/plans")
    return { success: true }
  } catch (error) {
    console.error("Failed to upsert category:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function deleteCategory(id: string) {
  try {
    await requireAdmin()
    await db.delete(featureCategories).where(eq(featureCategories.id, id))
    revalidatePath("/admin/feature-categories")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete category:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function getAllCategories(params?: {
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
    const sortField = params?.sortField || "position"
    const sortOrder = params?.sortOrder || "asc"

    const whereClause = search
      ? ilike(featureCategories.name, `%${search}%`)
      : undefined
    const sortColumn =
      CATEGORY_SORT_COLUMNS[sortField as keyof typeof CATEGORY_SORT_COLUMNS] ||
      featureCategories.position
    const order = sortOrder === "desc" ? desc(sortColumn) : asc(sortColumn)

    const data = await db
      .select()
      .from(featureCategories)
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(order)

    const totalCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(featureCategories)
      .where(whereClause)

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
    console.error("Failed to fetch all categories:", error)
    return {
      data: [],
      metadata: { total: 0, page: 1, limit: 10, totalPages: 0 },
    }
  }
}

// --- Features ---

const featureSchema = z.object({
  id: z.string().uuid().optional(),
  categoryId: z.string().uuid(),
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  isActive: z.boolean(),
  position: z.number().int().default(0),
  isHighlight: z.boolean().default(false),
})

export async function upsertFeature(data: z.infer<typeof featureSchema>) {
  try {
    await requireAdmin()
    const validated = featureSchema.parse(data)

    if (validated.id) {
      await db
        .update(features)
        .set({ ...validated, updatedAt: new Date() })
        .where(eq(features.id, validated.id))
    } else {
      await db.insert(features).values(validated)
    }

    revalidatePath("/admin/features")
    revalidatePath("/plans")
    return { success: true }
  } catch (error) {
    console.error("Failed to upsert feature:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function deleteFeature(id: string) {
  try {
    await requireAdmin()
    await db.delete(features).where(eq(features.id, id))
    revalidatePath("/admin/features")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete feature:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function getAllFeatures(params?: {
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
    const sortField = params?.sortField || "position"
    const sortOrder = params?.sortOrder || "asc"

    const whereClause = search ? ilike(features.name, `%${search}%`) : undefined
    const sortColumn =
      FEATURE_SORT_COLUMNS[sortField as keyof typeof FEATURE_SORT_COLUMNS] ||
      features.position
    const order = sortOrder === "desc" ? desc(sortColumn) : asc(sortColumn)

    const data = await db
      .select({
        id: features.id,
        name: features.name,
        slug: features.slug,
        categoryId: features.categoryId,
        categoryName: featureCategories.name,
        isActive: features.isActive,
        position: features.position,
        isHighlight: features.isHighlight,
      })
      .from(features)
      .leftJoin(
        featureCategories,
        eq(features.categoryId, featureCategories.id)
      )
      .where(whereClause)
      .limit(limit)
      .offset(offset)
      .orderBy(order)

    const totalCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(features)
      .where(whereClause)

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
    console.error("Failed to fetch all features:", error)
    return {
      data: [],
      metadata: { total: 0, page: 1, limit: 10, totalPages: 0 },
    }
  }
}

// --- Plan Features Mapping ---

export async function updatePlanFeature(
  planId: string,
  featureId: string,
  isEnabled: boolean
) {
  try {
    await requireAdmin()
    await db
      .insert(planFeatures)
      .values({ planId, featureId, isEnabled })
      .onConflictDoUpdate({
        target: [planFeatures.planId, planFeatures.featureId],
        set: { isEnabled },
      })

    revalidatePath("/plans")
    return { success: true }
  } catch (error) {
    console.error("Failed to update plan feature:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function bulkUpdatePlanFeatures(
  planId: string,
  featureIds: string[]
) {
  try {
    await requireAdmin()

    // 1. Disable all features for this plan first (or delete if you prefer)
    // We'll use a clean sweep approach for the provided features
    await db.transaction(async (tx) => {
      // Get all active features
      const allFeatures = await tx
        .select({ id: features.id })
        .from(features)
        .where(eq(features.isActive, true))

      for (const feature of allFeatures) {
        const isEnabled = featureIds.includes(feature.id)
        await tx
          .insert(planFeatures)
          .values({ planId, featureId: feature.id, isEnabled })
          .onConflictDoUpdate({
            target: [planFeatures.planId, planFeatures.featureId],
            set: { isEnabled },
          })
      }
    })

    revalidatePath("/plans")
    return { success: true }
  } catch (error) {
    console.error("Failed to bulk update plan features:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function getPlanFeatureMappings(planId: string) {
  try {
    return await db
      .select()
      .from(planFeatures)
      .where(eq(planFeatures.planId, planId))
  } catch (error) {
    console.error("Failed to fetch plan feature mappings:", error)
    return []
  }
}

export async function getPlanFeatures() {
  try {
    return await db.select().from(planFeatures)
  } catch (error) {
    console.error("Failed to fetch plan features:", error)
    return []
  }
}

export async function getGroupedFeatures() {
  try {
    const categories = await db
      .select()
      .from(featureCategories)
      .where(eq(featureCategories.isActive, true))
      .orderBy(featureCategories.position)

    const allFeatures = await db
      .select()
      .from(features)
      .where(eq(features.isActive, true))
      .orderBy(features.position)

    const mappings = await db.select().from(planFeatures)

    return categories.map((cat) => ({
      ...cat,
      features: allFeatures
        .filter((f) => f.categoryId === cat.id)
        .map((f) => ({
          ...f,
          plans: mappings.filter((m) => m.featureId === f.id),
        })),
    }))
  } catch (error) {
    console.error("Failed to fetch grouped features:", error)
    return []
  }
}
