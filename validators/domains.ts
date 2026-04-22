import { z } from "zod"

/**
 * Normalizes a domain input: lowercase, trim whitespace, strip protocol,
 * strip www. prefix, and remove trailing slashes.
 */
export function normalizeDomain(input: string): string {
  let domain = input.toLowerCase().trim()

  // Remove protocol (http:// or https://)
  domain = domain.replace(/^https?:\/\//, "")

  // Remove trailing slash(es)
  domain = domain.replace(/\/+$/, "")

  // Remove www. prefix
  domain = domain.replace(/^www\./, "")

  return domain
}

// Shopify domain: *.myshopify.com
const SHOPIFY_DOMAIN_PATTERN = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/

// Custom domain: standard domain format (no IP addresses)
const CUSTOM_DOMAIN_PATTERN =
  /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/

// IP address pattern to reject
const IP_PATTERN = /^(\d{1,3}\.){3}\d{1,3}$|^\[?[0-9a-fA-F:]+\]?$/

/**
 * Validates that a normalized domain string matches an allowed pattern
 * (Shopify store domain or standard custom domain). Rejects IP addresses
 * and malformed inputs.
 */
export function validateDomain(domain: string): boolean {
  if (!domain || domain.length > 255) return false

  // Reject IP addresses
  if (IP_PATTERN.test(domain)) return false

  // Each label must be <= 63 chars
  const labels = domain.split(".")
  if (labels.some((label) => label.length > 63 || label.length === 0)) {
    return false
  }

  return SHOPIFY_DOMAIN_PATTERN.test(domain)
}

/**
 * Zod schema for a single domain string. Normalizes and validates the domain.
 */
export const domainSchema = z
  .string()
  .min(1, "Domain is required")
  .max(255, "Domain is too long")
  .transform(normalizeDomain)
  .refine(validateDomain, {
    message:
      "Invalid domain format. Only Shopify domains (*.myshopify.com) are allowed.",
  })

export type DomainInput = z.input<typeof domainSchema>

/**
 * Schema for assigning a domain to a license.
 */
export const assignDomainSchema = z.object({
  domainName: domainSchema,
  licenseId: z.uuid("Invalid license ID"),
})

export type AssignDomainInput = z.infer<typeof assignDomainSchema>
