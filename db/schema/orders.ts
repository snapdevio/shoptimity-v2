import { relations, sql } from "drizzle-orm"
import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  timestamp,
  index,
  check,
} from "drizzle-orm/pg-core"

import { users } from "@/db/schema/users"
import { payments } from "@/db/schema/payments"
import { plans } from "@/db/schema/plans"
import { orderDomains } from "@/db/schema/order-domains"
import { licenses } from "@/db/schema/licenses"

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    paymentId: uuid("payment_id")
      .notNull()
      .references(() => payments.id),
    planId: uuid("plan_id")
      .notNull()
      .references(() => plans.id),
    licenseQuantity: integer("license_quantity").notNull(),
    contactName: varchar("contact_name", { length: 255 }).notNull(),
    contactPhone: varchar("contact_phone", { length: 50 }),
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("orders_user_id_idx").on(table.userId),
    index("orders_payment_id_idx").on(table.paymentId),
    index("orders_status_idx").on(table.status),
    check("orders_license_quantity_check", sql`${table.licenseQuantity} >= 1`),
  ]
)

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  payment: one(payments, {
    fields: [orders.paymentId],
    references: [payments.id],
  }),
  plan: one(plans, {
    fields: [orders.planId],
    references: [plans.id],
  }),
  orderDomains: many(orderDomains),
  licenses: many(licenses),
}))
