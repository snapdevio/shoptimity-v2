"use server"

import { db } from "@/db"
import { settings } from "@/db/schema/settings"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { getAppSession } from "@/lib/auth-session"

async function requireAdmin() {
  const session = await getAppSession()
  if (!session || session.role !== "admin") {
    throw new Error("Forbidden")
  }
  return session
}

// Settings buckets that are intentionally exposed to the public site
// (pricing page copy, retention-offer timeout, etc). Any other key is
// treated as admin-only — this prevents an unauthenticated caller from
// reading buckets that may store API keys, webhook URLs, or other secrets
// just by guessing the key.
const PUBLIC_SETTINGS_KEYS = new Set<string>(["general_settings"])

export async function getSettings(key: string = "general_settings") {
  try {
    if (!PUBLIC_SETTINGS_KEYS.has(key)) {
      // Non-public bucket — must be admin to read.
      await requireAdmin()
    }

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

    const updatedBy = session.userId === "dev-user" ? null : session.userId

    if (existing) {
      // Merge the new values into the existing JSON object
      const newValue = {
        ...(existing.value as Record<string, any>),
        ...value,
      }

      await db
        .update(settings)
        .set({
          value: newValue,
          updatedBy,
          updatedAt: new Date(),
        })
        .where(eq(settings.key, key))
    } else {
      await db.insert(settings).values({
        key,
        value,
        updatedBy,
      })
    }

    revalidatePath("/admin")
    return { success: true }
  } catch (error) {
    console.error("Failed to update settings:", error)
    return { success: false, error: "Failed to update settings" }
  }
}
