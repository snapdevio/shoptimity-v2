"use server"

import { db } from "@/db"
import { domains, licenses } from "@/db/schema"
import { eq, and, isNull, sql, count } from "drizzle-orm"
import { getAppSession } from "@/lib/auth-session"
import { normalizeDomain, validateDomain } from "@/lib/domains"
import { createAuditLog } from "@/lib/audit"
import { enqueueLicenseMetadataExportJob } from "@/lib/queue"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const assignDomainSchema = z.object({
  domainName: z.string().min(1).max(253),
  licenseId: z.string().uuid(),
})

const updateDomainSchema = z.object({
  domainId: z.string().uuid(),
  domainName: z.string().min(1).max(253),
})

const deleteDomainSchema = z.object({
  domainId: z.string().uuid(),
})

export async function assignDomain(formData: FormData) {
  const session = await getAppSession()
  if (!session) throw new Error("Unauthorized")

  const parsed = assignDomainSchema.safeParse({
    domainName: formData.get("domainName"),
    licenseId: formData.get("licenseId"),
  })

  if (!parsed.success) {
    return {
      error: "Invalid input. Please check the domain name and try again.",
    }
  }

  const normalized = normalizeDomain(parsed.data.domainName)
  const validation = validateDomain(normalized)
  if (!validation.valid) {
    return { error: validation.error }
  }

  // Use transaction with FOR UPDATE lock to prevent race conditions
  try {
    await db.transaction(async (tx) => {
      // Lock the license row and verify ownership
      const [license] = await tx
        .select()
        .from(licenses)
        .where(
          and(
            eq(licenses.id, parsed.data.licenseId),
            eq(licenses.userId, session.userId),
            sql`${licenses.status} IN ('active', 'trialing') AND ${licenses.status} != 'revoked'`
          )
        )
        .for("update")

      if (!license) {
        throw new Error("License not found or not active")
      }

      // Count active domains for this license
      const [{ value: activeDomainCount }] = await tx
        .select({ value: count() })
        .from(domains)
        .where(
          and(eq(domains.licenseId, license.id), isNull(domains.deletedAt))
        )

      if (activeDomainCount >= license.totalSlots) {
        throw new Error("All slots for this license are in use")
      }

      // Check global uniqueness
      const [existing] = await tx
        .select({ id: domains.id })
        .from(domains)
        .where(
          and(eq(domains.domainName, normalized), isNull(domains.deletedAt))
        )
        .limit(1)

      if (existing) {
        throw new Error("This domain is already assigned to another license")
      }

      // Insert domain
      await tx.insert(domains).values({
        licenseId: license.id,
        userId: session.userId,
        domainName: normalized,
      })
    })

    // Enqueue metadata export
    await enqueueLicenseMetadataExportJob({
      domainName: normalized,
      userId: session.userId,
      action: "upsert",
    })

    await createAuditLog(
      session.userId,
      "domain.created",
      "domain",
      normalized,
      { licenseId: parsed.data.licenseId }
    )

    revalidatePath("/licenses")
    return { success: true }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to assign domain"
    return { error: message }
  }
}

export async function updateDomain(formData: FormData) {
  const session = await getAppSession()
  if (!session) throw new Error("Unauthorized")

  const parsed = updateDomainSchema.safeParse({
    domainId: formData.get("domainId"),
    domainName: formData.get("domainName"),
  })

  if (!parsed.success) {
    return { error: "Invalid input" }
  }

  const normalized = normalizeDomain(parsed.data.domainName)
  const validation = validateDomain(normalized)
  if (!validation.valid) {
    return { error: validation.error }
  }

  try {
    await db.transaction(async (tx) => {
      // Verify ownership
      const [domain] = await tx
        .select()
        .from(domains)
        .where(
          and(
            eq(domains.id, parsed.data.domainId),
            eq(domains.userId, session.userId),
            isNull(domains.deletedAt)
          )
        )
        .for("update")

      if (!domain) {
        throw new Error("Domain not found")
      }

      // Check global uniqueness for new name
      if (domain.domainName !== normalized) {
        const [existing] = await tx
          .select({ id: domains.id })
          .from(domains)
          .where(
            and(eq(domains.domainName, normalized), isNull(domains.deletedAt))
          )
          .limit(1)

        if (existing) {
          throw new Error("This domain is already assigned to another license")
        }
      }

      const oldDomainName = domain.domainName

      // Update domain
      await tx
        .update(domains)
        .set({ domainName: normalized, updatedAt: new Date() })
        .where(eq(domains.id, domain.id))

      // Delete old metadata and create new
      if (oldDomainName !== normalized) {
        await enqueueLicenseMetadataExportJob({
          domainName: oldDomainName,
          userId: session.userId,
          action: "delete",
        })
      }
    })

    await enqueueLicenseMetadataExportJob({
      domainName: normalized,
      userId: session.userId,
      action: "upsert",
    })

    await createAuditLog(
      session.userId,
      "domain.updated",
      "domain",
      parsed.data.domainId,
      { newDomainName: normalized }
    )

    revalidatePath("/licenses")
    return { success: true }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update domain"
    return { error: message }
  }
}

export async function deleteDomain(formData: FormData) {
  const session = await getAppSession()
  if (!session) throw new Error("Unauthorized")

  const parsed = deleteDomainSchema.safeParse({
    domainId: formData.get("domainId"),
  })

  if (!parsed.success) {
    return { error: "Invalid input" }
  }

  try {
    let domainName = ""

    await db.transaction(async (tx) => {
      const [domain] = await tx
        .select()
        .from(domains)
        .where(
          and(
            eq(domains.id, parsed.data.domainId),
            eq(domains.userId, session.userId),
            isNull(domains.deletedAt)
          )
        )
        .for("update")

      if (!domain) {
        throw new Error("Domain not found")
      }

      domainName = domain.domainName

      // Soft delete
      await tx
        .update(domains)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(eq(domains.id, domain.id))
    })

    // Delete metadata from R2
    await enqueueLicenseMetadataExportJob({
      domainName,
      userId: session.userId,
      action: "delete",
    })

    await createAuditLog(
      session.userId,
      "domain.deleted",
      "domain",
      parsed.data.domainId,
      { domainName }
    )

    revalidatePath("/licenses")
    return { success: true }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to delete domain"
    return { error: message }
  }
}

export async function verifyStoreDomain(domain: string): Promise<boolean> {
  // SSRF guard: the function does an outbound `fetch()` on a
  // caller-supplied host. Without these checks an unauthenticated user
  // could probe internal services (e.g. `localhost:8080`,
  // `169.254.169.254`, `*.internal`) and observe response codes. We:
  //   1. Require an authenticated session (no anonymous probing).
  //   2. Run the input through the same Shopify-domain validator used at
  //      assignment time, so only `*.myshopify.com` hosts pass.
  //   3. Strip any path/query/fragment that snuck through normalization.
  const session = await getAppSession()
  if (!session) return false

  const normalized = normalizeDomain(domain)
  const validation = validateDomain(normalized)
  if (!validation.valid) return false

  // Belt-and-suspenders: even after validation, pin the URL to the bare
  // host so a malformed input that slipped past the regex can't carry a
  // path or alternate authority.
  const url = `https://${normalized}/`

  try {
    const shopResponse = await fetch(url, {
      method: "HEAD",
      redirect: "manual",
      // 5s timeout via AbortSignal so a slow target can't tie up the
      // server action.
      signal: AbortSignal.timeout(5000),
    })

    return (
      shopResponse.ok ||
      (shopResponse.status >= 300 && shopResponse.status < 400)
    )
  } catch {
    return false
  }
}
