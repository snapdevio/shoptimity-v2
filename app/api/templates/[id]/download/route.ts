import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { users, licenses, templates } from "@/db/schema"
import { eq, and, or } from "drizzle-orm"
import { z } from "zod"
import { getAppSession } from "@/lib/auth-session"
import { getTemplateDownloadUrl } from "@/lib/r2"

const templateIdSchema = z.string().uuid()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: rawTemplateId } = await params

  // Validate the path param strictly. Without this, a value like
  // `..%2Fsecret` would interpolate into the R2 key and let an
  // authenticated user reach unintended objects in the bucket.
  const parsedId = templateIdSchema.safeParse(rawTemplateId)
  if (!parsedId.success) {
    return NextResponse.json({ error: "Invalid template id" }, { status: 400 })
  }
  const templateId = parsedId.data

  // Check auth
  const session = await getAppSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Verify user exists
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1)

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  // Allow any license that is active (free, paid, cancelled-but-in-period)
  // or trialing — all plans including free unlock template downloads.
  const activeLicenses = await db
    .select({ id: licenses.id })
    .from(licenses)
    .where(
      and(
        eq(licenses.userId, user.id),
        or(eq(licenses.status, "active"), eq(licenses.status, "trialing"))
      )
    )
    .limit(1)

  if (activeLicenses.length === 0) {
    return NextResponse.json(
      { error: "Active license required to download templates" },
      { status: 403 }
    )
  }

  // Confirm the template actually exists before signing a URL — otherwise
  // an attacker could probe the bucket for arbitrary `<uuid>.zip` keys
  // through this endpoint.
  const [template] = await db
    .select({ id: templates.id, status: templates.status })
    .from(templates)
    .where(eq(templates.id, templateId))
    .limit(1)

  if (!template || template.status !== "active") {
    return NextResponse.json({ error: "Template not found" }, { status: 404 })
  }

  // Generate presigned URL for the template
  const templateKey = `templates/${templateId}.zip`

  try {
    const downloadUrl = await getTemplateDownloadUrl(templateKey)
    return NextResponse.redirect(downloadUrl)
  } catch (err) {
    console.error("Template download error:", err)
    return NextResponse.json(
      { error: "Template not found or download failed" },
      { status: 404 }
    )
  }
}
