"use server"

import { db } from "@/db"
import { contacts } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
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

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(200),
  email: z.string().email("Invalid email address").max(320),
  subject: z.string().min(5, "Subject must be at least 5 characters").max(200),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(5000),
})

const statusSchema = z.enum(["pending", "responded", "archived"])
const idSchema = z.string().uuid()

export async function submitContactForm(data: z.infer<typeof contactSchema>) {
  try {
    const validated = contactSchema.parse(data)

    await db.insert(contacts).values({
      name: validated.name,
      email: validated.email,
      subject: validated.subject,
      message: validated.message,
    })

    revalidatePath("/admin/contacts")

    return { success: true }
  } catch (error) {
    console.error("Failed to submit contact form:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.flatten() }
    }
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function getContacts() {
  try {
    // Admin-only: contact submissions contain PII (names, emails, free-form
    // messages). Without this gate the action was readable by any caller
    // — server actions are reachable from the browser for anyone who can
    // observe the action ID, including unauthenticated visitors.
    await requireAdmin()
    return await db.select().from(contacts).orderBy(desc(contacts.createdAt))
  } catch (error) {
    console.error("Failed to fetch contacts:", error)
    return []
  }
}

export async function updateContactStatus(id: string, status: string) {
  try {
    await requireAdmin()

    const parsedId = idSchema.safeParse(id)
    if (!parsedId.success) {
      return { success: false, error: "Invalid contact id" }
    }
    const parsedStatus = statusSchema.safeParse(status)
    if (!parsedStatus.success) {
      return { success: false, error: "Invalid status value" }
    }

    await db
      .update(contacts)
      .set({ status: parsedStatus.data, updatedAt: new Date() })
      .where(eq(contacts.id, parsedId.data))

    revalidatePath("/admin/contacts")
    return { success: true }
  } catch (error) {
    console.error("Failed to update contact status:", error)
    return { success: false, error: "Failed to update status" }
  }
}
