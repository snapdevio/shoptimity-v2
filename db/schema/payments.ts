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
import { orders } from "@/db/schema/orders"

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    stripeSessionId: varchar("stripe_session_id", { length: 255 })
      .notNull()
      .unique(),
    stripePaymentIntentId: varchar("stripe_payment_intent_id", {
      length: 255,
    }),
    stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
    stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
    stripeInvoiceId: varchar("stripe_invoice_id", { length: 255 }),
    stripeInvoiceUrl: text("stripe_invoice_url"),
    amount: integer("amount").notNull(),
    currency: varchar("currency", { length: 10 }).notNull(),
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("payments_user_id_idx").on(table.userId),
    check("payments_amount_check_v2", sql`${table.amount} >= 0`),
  ]
)

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
  orders: many(orders),
}))
