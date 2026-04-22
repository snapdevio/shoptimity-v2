import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { users, licenses } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { getAppSession } from "@/lib/auth-session"
import { getTemplateDownloadUrl } from "@/lib/r2"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: templateId } = await params

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

  // Check for active license
  const activeLicenses = await db
    .select({ id: licenses.id })
    .from(licenses)
    .where(and(eq(licenses.userId, user.id), eq(licenses.status, "active")))
    .limit(1)

  if (activeLicenses.length === 0) {
    return NextResponse.json(
      { error: "Active license required to download templates" },
      { status: 403 }
    )
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
