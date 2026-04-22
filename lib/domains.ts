import {
  normalizeDomain as normalize,
  domainSchema,
} from "@/validators/domains"
import { validateDomain as validateDomainFormat } from "@/validators/domains"

/**
 * Normalizes a domain input: lowercase, trim, strip protocol/www/trailing slash.
 *
 * Re-exported from validators for convenience.
 */
export const normalizeDomain = normalize

export interface DomainValidationResult {
  valid: boolean
  error?: string
}

/**
 * Validates a normalized domain string against allowed patterns.
 * Returns an object with `valid` and optional `error` message.
 */
export function validateDomain(domain: string): DomainValidationResult {
  if (!domain || domain.length === 0) {
    return { valid: false, error: "Domain is required" }
  }

  if (domain.length > 255) {
    return { valid: false, error: "Domain is too long (max 255 characters)" }
  }

  if (!validateDomainFormat(domain)) {
    return {
      valid: false,
      error:
        "Invalid domain format. Only Shopify domains (*.myshopify.com) are allowed.",
    }
  }

  return { valid: true }
}

/**
 * Parses and validates a raw domain string input using the Zod schema.
 * Returns the normalized, validated domain string on success.
 * Throws a ZodError on failure.
 */
export function parseDomain(input: string): string {
  return domainSchema.parse(input)
}

/**
 * Safely parses a domain input. Returns the normalized domain or null.
 */
export function safeParseDomain(input: string): string | null {
  const result = domainSchema.safeParse(input)
  return result.success ? result.data : null
}
