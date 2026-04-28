import { relations, sql } from "drizzle-orm"
import {
  pgTable,
  uuid,
  text,
  varchar,
  integer,
  timestamp,
  index,
  uniqueIndex,
  check,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core"

export const billingCycleEnum = pgEnum("billing_cycle", [
  "monthly",
  "yearly",
  "lifetime",
])

import { users } from "@/db/schema/users"
import { plans } from "@/db/schema/plans"
import { orders } from "@/db/schema/orders"
import { domains } from "@/db/schema/domains"

export const licenses = pgTable(
  "licenses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    planId: uuid("plan_id")
      .notNull()
      .references(() => plans.id),
    totalSlots: integer("total_slots").notNull(),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    sourceOrderId: uuid("source_order_id").references(() => orders.id),
    stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
    isTrial: boolean("is_trial").notNull().default(false),
    trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
    isLifetime: boolean("is_lifetime").notNull().default(false),
    billingCycle: billingCycleEnum("billing_cycle")
      .notNull()
      .default("monthly"),
    nextRenewalDate: timestamp("next_renewal_date", { withTimezone: true }),
    retentionDiscountUsed: boolean("retention_discount_used")
      .notNull()
      .default(false),
    retentionDiscountEndsAt: timestamp("retention_discount_ends_at", {
      withTimezone: true,
    }),
    lastTrialReminderSent: varchar("last_trial_reminder_sent", { length: 20 }),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
    revokedReason: varchar("revoked_reason", { length: 50 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("licenses_user_id_idx").on(table.userId),
    uniqueIndex("licenses_user_id_unique").on(table.userId),
    check("licenses_total_slots_check", sql`${table.totalSlots} >= 1`),
  ]
)

export const licensesRelations = relations(licenses, ({ one, many }) => ({
  user: one(users, {
    fields: [licenses.userId],
    references: [users.id],
  }),
  plan: one(plans, {
    fields: [licenses.planId],
    references: [plans.id],
  }),
  sourceOrder: one(orders, {
    fields: [licenses.sourceOrderId],
    references: [orders.id],
  }),
  domains: many(domains),
}))
