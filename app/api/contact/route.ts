import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { contacts } from "@/db/schema"
import { z } from "zod"

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(200),
  email: z
    .string()
    .email("Invalid email address")
    .max(320)
    .transform((v) => v.toLowerCase().trim()),
  subject: z.string().min(5, "Subject must be at least 5 characters").max(200),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(2000),
})

// In-memory IP rate limiter. Good enough for spam/DoS suppression on a
// single Node process; a clustered deployment would want Redis instead.
// Keyed by client IP, value tracks request timestamps within the window.
const RATE_LIMIT_WINDOW_MS = 60_000 // 1 minute
const RATE_LIMIT_MAX = 5 // 5 submissions / minute / IP
const ipHits = new Map<string, number[]>()

function clientIp(request: NextRequest): string {
  // Trust order: x-forwarded-for (left-most), x-real-ip, then a static
  // fallback. The route is intended to run behind Vercel/CF which set
  // x-forwarded-for; if neither header is present we just bucket all
  // such requests together.
  const xff = request.headers.get("x-forwarded-for")
  if (xff) return xff.split(",")[0].trim()
  const real = request.headers.get("x-real-ip")
  if (real) return real
  return "unknown"
}

function rateLimit(ip: string): boolean {
  const now = Date.now()
  const cutoff = now - RATE_LIMIT_WINDOW_MS
  const hits = (ipHits.get(ip) || []).filter((t) => t > cutoff)
  if (hits.length >= RATE_LIMIT_MAX) {
    ipHits.set(ip, hits)
    return false
  }
  hits.push(now)
  ipHits.set(ip, hits)

  // Opportunistic GC so the map doesn't grow unbounded under attack.
  if (ipHits.size > 10_000) {
    for (const [k, v] of ipHits) {
      const filtered = v.filter((t) => t > cutoff)
      if (filtered.length === 0) ipHits.delete(k)
      else ipHits.set(k, filtered)
    }
  }
  return true
}

export async function POST(request: NextRequest) {
  const ip = clientIp(request)
  if (!rateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again in a minute." },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const parsed = contactSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid contact data", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { name, email, subject, message } = parsed.data

  try {
    await db.insert(contacts).values({
      name,
      email,
      subject,
      message,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Contact API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
