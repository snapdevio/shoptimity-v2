import { format, formatDistanceToNow } from "date-fns"

/**
 * Consistently format dates to avoid hydration mismatches between server and client.
 * Default format: "MMM d, yyyy" (e.g., "Mar 30, 2026")
 */
export function formatDate(
  date: Date | string | number,
  formatStr: string = "MMM d, yyyy"
) {
  const d = new Date(date)

  // Check for invalid dates to avoid crashes
  if (isNaN(d.getTime())) {
    return "Invalid Date"
  }

  return format(d, formatStr)
}

/**
 * Format date with time.
 * Default format: "MMM d, yyyy HH:mm"
 */
export function formatDateTime(
  date: Date | string | number,
  formatStr: string = "MMM d, yyyy HH:mm"
) {
  return formatDate(date, formatStr)
}

/**
 * Format date relative to now (e.g., "in 15 minutes", "2 days ago")
 */
export function formatDateRelative(date: Date | string | number) {
  const d = new Date(date)
  if (isNaN(d.getTime())) return "Invalid Date"
  return formatDistanceToNow(d, { addSuffix: true })
}

/**
 * Format a Stripe-style amount-in-minor-units (cents) as a localized currency
 * string. Centralized so every screen renders prices the same way regardless
 * of whether the backend hands us `amount` or `amount_total`.
 *
 * @param amountInCents Stripe amount in the smallest currency unit
 * @param currency ISO 4217 code; case-insensitive, falls back to "USD"
 */
export function formatCurrency(
  amountInCents: number | null | undefined,
  currency: string | null | undefined = "USD"
): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: (currency || "USD").toUpperCase(),
  }).format((amountInCents ?? 0) / 100)
}

/**
 * Calendar-day remaining count to a future date, used for trial end labels.
 * Compares date-only (local midnight) so "tomorrow" reads as 1 day even if
 * the timestamp is a few hours away.
 */
export function formatDaysRemaining(date: Date | string | number) {
  const d = new Date(date)
  if (isNaN(d.getTime())) return "Invalid Date"

  const startOfDay = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const days = Math.ceil((startOfDay(d) - startOfDay(new Date())) / 86400000)

  if (days < 0) return "Ended"
  if (days === 0) return "Ends today"
  if (days === 1) return "1 day left"
  return `Ends ${days} days left`
}
