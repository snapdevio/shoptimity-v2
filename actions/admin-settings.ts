"use server"

import { db } from "@/db"
import { settings } from "@/db/schema/settings"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { getAppSession } from "@/lib/auth-session"

async function requireAdmin() {
  if (process.env.NODE_ENV === "development") {
    return { userId: "dev-user", role: "admin", email: "admin@localhost" }
  }
  const session = await getAppSession()
  if (!session || session.role !== "admin") {
    throw new Error("Forbidden")
  }
  return session
}

export async function getSettings(key: string = "general_settings") {
  try {
    const [result] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, key))
      .limit(1)

    return result?.value || {}
  } catch (error) {
    console.error("Failed to fetch settings:", error)
    return {}
  }
}

export async function updateSettings(
  value: Record<string, any>,
  key: string = "general_settings"
) {
  try {
    const session = await requireAdmin()

    const [existing] = await db
      .select()
      .from(settings)
      .where(eq(settings.key, key))
      .limit(1)

    if (existing) {
      await db
        .update(settings)
        .set({
          value,
          updatedBy: session.userId,
          updatedAt: new Date(),
        })
        .where(eq(settings.key, key))
    } else {
      await db.insert(settings).values({
        key,
        value,
        updatedBy: session.userId,
      })
    }

    revalidatePath("/admin")
    return { success: true }
  } catch (error) {
    console.error("Failed to update settings:", error)
    return { success: false, error: "Failed to update settings" }
  }
}
