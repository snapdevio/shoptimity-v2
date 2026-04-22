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
