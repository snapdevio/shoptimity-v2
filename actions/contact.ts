"use server"

import { db } from "@/db"
import { contacts } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
})

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
    return await db.select().from(contacts).orderBy(desc(contacts.createdAt))
  } catch (error) {
    console.error("Failed to fetch contacts:", error)
    return []
  }
}

export async function updateContactStatus(id: string, status: string) {
  try {
    await db
      .update(contacts)
      .set({ status, updatedAt: new Date() })
      .where(eq(contacts.id, id))

    revalidatePath("/admin/contacts")
    return { success: true }
  } catch (error) {
    console.error("Failed to update contact status:", error)
    return { success: false, error: "Failed to update status" }
  }
}
