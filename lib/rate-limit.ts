interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes to prevent memory leaks
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000
let cleanupTimer: ReturnType<typeof setInterval> | null = null

function ensureCleanupTimer(): void {
  if (cleanupTimer) return
  cleanupTimer = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store) {
      if (entry.resetAt <= now) {
        store.delete(key)
      }
    }
  }, CLEANUP_INTERVAL_MS)
  // Allow the process to exit even if the timer is running
  if (
    cleanupTimer &&
    typeof cleanupTimer === "object" &&
    "unref" in cleanupTimer
  ) {
    cleanupTimer.unref()
  }
}

export interface RateLimitResult {
  allowed: boolean
  /** Seconds until the rate limit window resets. Present when `allowed` is false. */
  retryAfter?: number
}

/**
 * Checks whether a request identified by `key` is within the rate limit.
 *
 * @param key       - A unique identifier for the rate-limited resource (e.g. `magic:email@example.com`).
 * @param limit     - Maximum number of requests allowed in the window.
 * @param windowMs  - Duration of the rate limit window in milliseconds.
 * @returns An object indicating whether the request is allowed.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  ensureCleanupTimer()

  const now = Date.now()
  const entry = store.get(key)

  // No existing entry or window has expired — start fresh
  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true }
  }

  // Within the window
  if (entry.count < limit) {
    entry.count += 1
    return { allowed: true }
  }

  // Limit exceeded
  const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
  return { allowed: false, retryAfter }
}

// ---------- Pre-configured checkers ----------

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000
const ONE_HOUR_MS = 60 * 60 * 1000

/**
 * Rate-limits magic link requests by email address.
 * Max 3 requests per email per 15-minute window.
 */
export function checkMagicLinkEmailLimit(email: string): RateLimitResult {
  return checkRateLimit(
    `magic:email:${email.toLowerCase()}`,
    3,
    FIFTEEN_MINUTES_MS
  )
}

/**
 * Rate-limits magic link requests by IP address.
 * Max 10 requests per IP per hour.
 */
export function checkMagicLinkIpLimit(ip: string): RateLimitResult {
  return checkRateLimit(`magic:ip:${ip}`, 10, ONE_HOUR_MS)
}
