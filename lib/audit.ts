import { db } from "@/db"
import { auditLogs } from "@/db/schema"

// Accept both the top-level db instance and a transaction object.
// Using a minimal structural type to avoid coupling to specific Drizzle generics.
type DbOrTx = {
  insert: typeof db.insert
}

/**
 * Creates an audit log entry.
 *
 * @param actorUserId - The user who performed the action (null for system actions).
 * @param action      - A short identifier for the action, e.g. "license.create".
 * @param entityType  - The type of entity affected, e.g. "license", "domain".
 * @param entityId    - The ID of the affected entity.
 * @param metadata    - Optional JSON-serializable metadata for additional context.
 * @param tx          - Optional database transaction to use instead of the default connection.
 */
export async function createAuditLog(
  actorUserId: string | null,
  action: string,
  entityType: string,
  entityId: string,
  metadata?: Record<string, unknown>,
  tx?: DbOrTx
): Promise<void> {
  const conn = tx ?? db
  await conn.insert(auditLogs).values({
    actorUserId,
    action,
    entityType,
    entityId,
    metadataJson: metadata ?? null,
  })
}
