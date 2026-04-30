// Single source of truth for the cancellation-reason options surfaced on
// /billing/cancel. Both the UI (radio list) and the server action (validator
// + persistence) read from this list — keeping them in lockstep so the column
// values in `licenses.cancellation_reason` stay aligned with what the user
// actually saw.

export const CANCELLATION_REASONS = [
  "Too expensive",
  "Missing features",
  "Technical issues",
  "Switching to a competitor",
  "No longer need it",
  "Other",
] as const

export type CancellationReason = (typeof CANCELLATION_REASONS)[number]

const REASON_SET = new Set<string>(CANCELLATION_REASONS)

export function isKnownCancellationReason(
  value: string | null | undefined
): value is CancellationReason {
  return !!value && REASON_SET.has(value)
}
