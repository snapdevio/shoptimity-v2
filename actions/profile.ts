"use server"

import { db } from "@/db"
import { users } from "@/db/schema"
import { eq } from "drizzle-orm"
import { getAppSession } from "@/lib/auth-session"
import { createAuditLog } from "@/lib/audit"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const updateNameSchema = z.object({
  name: z.string().min(1).max(200),
})

export async function updateName(formData: FormData) {
  const session = await getAppSession()
  if (!session) throw new Error("Unauthorized")

  const parsed = updateNameSchema.safeParse({
    name: formData.get("name"),
  })

  if (!parsed.success) {
    return { error: "Name is required" }
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1)

  if (!user) {
    return { error: "User not found" }
  }

  await db
    .update(users)
    .set({ name: parsed.data.name, updatedAt: new Date() })
    .where(eq(users.id, user.id))

  await createAuditLog(
    session.userId,
    "profile.name_updated",
    "user",
    user.id,
    {}
  )

  revalidatePath("/profile")
  return { success: true }
}
