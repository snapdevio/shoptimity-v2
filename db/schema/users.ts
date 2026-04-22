import { relations } from "drizzle-orm"

import { user } from "@/db/schema/auth"
import { licenses } from "@/db/schema/licenses"
import { domains } from "@/db/schema/domains"
import { payments } from "@/db/schema/payments"
import { orders } from "@/db/schema/orders"
import { auditLogs } from "@/db/schema/audit-logs"

// Re-export Better Auth's user table as `users` for backward compatibility
export const users = user

export const usersRelations = relations(user, ({ many }) => ({
  licenses: many(licenses),
  domains: many(domains),
  payments: many(payments),
  orders: many(orders),
  auditLogs: many(auditLogs),
}))
