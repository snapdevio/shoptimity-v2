"use server"

import { db } from "@/db"
import { templates } from "@/db/schema"
import { eq, desc, sql, or, ilike } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getAppSession } from "@/lib/auth-session"
import { PutObjectCommand } from "@aws-sdk/client-s3"
import { deleteR2Object, getR2Client } from "@/lib/r2"

async function requireAdmin() {
  const session = await getAppSession()
  if (!session || session.role !== "admin") {
    throw new Error("Forbidden")
  }
  return session
}

export async function uploadTemplateImage(formData: FormData) {
  try {
    await requireAdmin()
    const file = formData.get("file") as File
    if (!file) return { success: false, error: "No file provided" }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const sanitized = sanitizeFilename(file.name)
    const filename = `${Date.now()}-${sanitized}`
    const key = `assets/templates/${filename}`

    const client = getR2Client()
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    )

    const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_ENDPOINT}/${key}`
    return { success: true, url: publicUrl }
  } catch (error) {
    console.error("Failed to upload image:", error)
    return { success: false, error: "Failed to upload image" }
  }
}

function sanitizeFilename(name: string): string {
  // Extract extension
  const parts = name.split(".")
  const ext = parts.pop() || ""
  const base = parts.join(".")

  // Sanitize base: lowercase, replace spaces with dashes, remove special chars
  const sanitizedBase = base
    .toLowerCase()
    .replace(/\s+/g, "-") // spaces to dashes
    .replace(/[^a-z0-9-_]/g, "") // remove special chars except dashes/underscores
    .replace(/-+/g, "-") // collapse multiple dashes
    .trim()

  return `${sanitizedBase}.${ext}`
}

function getR2KeyFromUrl(url: string | null): string | null {
  if (!url) return null
  const publicEndpoint = process.env.NEXT_PUBLIC_R2_PUBLIC_ENDPOINT
  if (!publicEndpoint) return null

  if (url.startsWith(publicEndpoint)) {
    return url.replace(`${publicEndpoint}/`, "")
  }
  return null
}

export async function uploadTemplateZip(formData: FormData) {
  try {
    await requireAdmin()
    const file = formData.get("file") as File
    if (!file) return { success: false, error: "No file provided" }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const sanitized = sanitizeFilename(file.name)
    const filename = `${Date.now()}-${sanitized}`
    const key = `templates/${filename}`

    const client = getR2Client()
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: "application/zip",
      })
    )

    const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_ENDPOINT}/${key}`
    return { success: true, url: publicUrl }
  } catch (error) {
    console.error("Failed to upload ZIP to R2:", error)
    return { success: false, error: "Failed to upload ZIP" }
  }
}

const templateSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional().nullable(),
  img: z.string().optional().nullable(),
  bg: z.string().optional().nullable(),
  downloadLink: z
    .string()
    .url("Invalid download URL")
    .optional()
    .nullable()
    .or(z.literal("")),
  previewLink: z
    .string()
    .url("Invalid preview URL")
    .optional()
    .nullable()
    .or(z.literal("")),
  logo: z.string().optional().nullable(),
  banner: z.string().optional().nullable(),
  startSize: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val) return true
        const num = parseFloat(val)
        return !isNaN(num) && num >= 0 && num <= 5
      },
      { message: "Star size must be between 0 and 5" }
    ),
  shortDesc: z.string().optional().nullable(),
  cro: z.string().optional().nullable(),
  aov: z.string().optional().nullable(),
  rev: z.string().optional().nullable(),
  status: z.enum(["active", "inactive"]).default("active"),
  position: z.number().int().default(0),
})

export async function createTemplate(data: z.infer<typeof templateSchema>) {
  try {
    await requireAdmin()
    const validated = templateSchema.parse(data)

    await db.insert(templates).values({
      title: validated.title,
      description: validated.description,
      img: validated.img,
      bg: validated.bg,
      downloadLink: validated.downloadLink,
      previewLink: validated.previewLink,
      logo: validated.logo,
      banner: validated.banner,
      startSize: validated.startSize,
      shortDesc: validated.shortDesc,
      cro: validated.cro,
      aov: validated.aov,
      rev: validated.rev,
      status: validated.status,
      position: validated.position,
    })

    revalidatePath("/admin/templates")
    revalidatePath("/templates")
    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error("Failed to create template:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.flatten() }
    }
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function updateTemplate(data: z.infer<typeof templateSchema>) {
  try {
    await requireAdmin()
    const validated = templateSchema.parse(data)
    if (!validated.id)
      return { success: false, error: "ID is required for update" }

    // R2 Cleanup logic
    const oldTemplate = await db.query.templates.findFirst({
      where: eq(templates.id, validated.id),
    })

    if (oldTemplate) {
      // If image changed, delete old one
      if (
        validated.img &&
        oldTemplate.img &&
        validated.img !== oldTemplate.img
      ) {
        const oldImgKey = getR2KeyFromUrl(oldTemplate.img)
        if (oldImgKey) await deleteR2Object(oldImgKey)
      }
      // If zip changed, delete old one
      if (
        validated.downloadLink &&
        oldTemplate.downloadLink &&
        validated.downloadLink !== oldTemplate.downloadLink
      ) {
        const oldZipKey = getR2KeyFromUrl(oldTemplate.downloadLink)
        if (oldZipKey) await deleteR2Object(oldZipKey)
      }
      // If logo changed, delete old one
      if (
        validated.logo &&
        oldTemplate.logo &&
        validated.logo !== oldTemplate.logo
      ) {
        const oldLogoKey = getR2KeyFromUrl(oldTemplate.logo)
        if (oldLogoKey) await deleteR2Object(oldLogoKey)
      }
      // If banner changed, delete old one
      if (
        validated.banner &&
        oldTemplate.banner &&
        validated.banner !== oldTemplate.banner
      ) {
        const oldBannerKey = getR2KeyFromUrl(oldTemplate.banner)
        if (oldBannerKey) await deleteR2Object(oldBannerKey)
      }
    }

    await db
      .update(templates)
      .set({
        title: validated.title,
        description: validated.description,
        img: validated.img,
        bg: validated.bg,
        downloadLink: validated.downloadLink,
        previewLink: validated.previewLink,
        logo: validated.logo,
        banner: validated.banner,
        startSize: validated.startSize,
        shortDesc: validated.shortDesc,
        cro: validated.cro,
        aov: validated.aov,
        rev: validated.rev,
        status: validated.status,
        position: validated.position,
        updatedAt: new Date(),
      })
      .where(eq(templates.id, validated.id))

    // console.log(`Successfully updated template: ${validated.id}`, {
    //   title: validated.title,
    //   downloadLink: validated.downloadLink,
    // })

    revalidatePath("/admin/templates")
    revalidatePath("/templates")
    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error("Failed to update template:", error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.flatten() }
    }
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function deleteTemplate(id: string) {
  try {
    await requireAdmin()

    // R2 Cleanup before deleting DB record
    const template = await db.query.templates.findFirst({
      where: eq(templates.id, id),
    })

    if (template) {
      const imgKey = getR2KeyFromUrl(template.img)
      if (imgKey) await deleteR2Object(imgKey)

      const zipKey = getR2KeyFromUrl(template.downloadLink)
      if (zipKey) await deleteR2Object(zipKey)

      const logoKey = getR2KeyFromUrl(template.logo)
      if (logoKey) await deleteR2Object(logoKey)

      const bannerKey = getR2KeyFromUrl(template.banner)
      if (bannerKey) await deleteR2Object(bannerKey)
    }

    await db.delete(templates).where(eq(templates.id, id))

    revalidatePath("/admin/templates")
    revalidatePath("/templates")
    revalidatePath("/")

    return { success: true }
  } catch (error) {
    console.error("Failed to delete template:", error)
    return { success: false, error: "Failed to delete template" }
  }
}

export async function getAllTemplates(page = 1, search = "", pageSize = 10) {
  try {
    await requireAdmin()

    const offset = (page - 1) * pageSize
    const whereClause = search
      ? or(
          ilike(templates.title, `%${search}%`),
          ilike(templates.description, `%${search}%`),
          ilike(templates.shortDesc, `%${search}%`),
          ilike(templates.bg, `%${search}%`),
          ilike(templates.status, `%${search}%`),
          ilike(templates.cro, `%${search}%`),
          ilike(templates.aov, `%${search}%`),
          ilike(templates.rev, `%${search}%`),
          ilike(templates.startSize, `%${search}%`),
          sql`to_char(${templates.createdAt}, 'Mon DD, YYYY HH24:MI') ilike ${`%${search}%`}`
        )
      : undefined

    const [data, total] = await Promise.all([
      db
        .select()
        .from(templates)
        .where(whereClause)
        .orderBy(
          sql`CASE WHEN ${templates.position} = 0 THEN 999 ELSE ${templates.position} END ASC`,
          desc(templates.createdAt)
        )
        .limit(pageSize)
        .offset(offset),
      db
        .select({ value: sql<number>`count(*)` })
        .from(templates)
        .where(whereClause),
    ])

    const totalCount = Number(total[0]?.value || 0)

    return {
      data: data.map((t) => ({
        ...t,
        status: t.status as "active" | "inactive",
      })),
      total: totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    }
  } catch (error) {
    console.error("Failed to fetch all templates:", error)
    return {
      data: [],
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0,
    }
  }
}

export async function getActiveTemplates() {
  try {
    return await db
      .select()
      .from(templates)
      .where(eq(templates.status, "active"))
      .orderBy(
        sql`CASE WHEN ${templates.position} = 0 THEN 999 ELSE ${templates.position} END ASC`,
        desc(templates.createdAt)
      )
  } catch (error) {
    console.error("Failed to fetch active templates:", error)
    return []
  }
}
