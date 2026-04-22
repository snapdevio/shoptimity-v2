import { relations } from "drizzle-orm"
import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  index,
  unique,
} from "drizzle-orm/pg-core"

import { orders } from "@/db/schema/orders"

export const orderDomains = pgTable(
  "order_domains",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id),
    domainName: varchar("domain_name", { length: 255 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    rejectionReason: varchar("rejection_reason", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    assignedAt: timestamp("assigned_at", { withTimezone: true }),
  },
  (table) => [
    index("order_domains_order_id_idx").on(table.orderId),
    unique("order_domains_order_id_domain_name_uniq").on(
      table.orderId,
      table.domainName
    ),
  ]
)

export const orderDomainsRelations = relations(orderDomains, ({ one }) => ({
  order: one(orders, {
    fields: [orderDomains.orderId],
    references: [orders.id],
  }),
}))
