import { relations } from "drizzle-orm"
import {
  pgTable,
  uuid,
  varchar,
  integer,
  jsonb,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core"

import { licenses } from "@/db/schema/licenses"
import { orders } from "@/db/schema/orders"

export const plans = pgTable("plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slots: integer("slots").notNull(),
  regularPrice: integer("regular_price").notNull(),
  finalPrice: integer("final_price").notNull(),
  currency: varchar("currency", { length: 10 }).notNull().default("usd"),
  features: jsonb("features"),
  isActive: boolean("is_active").notNull().default(true),
  stripePaymentLink: varchar("stripe_payment_link", { length: 255 }),
  trialDays: integer("trial_days").notNull().default(0),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const plansRelations = relations(plans, ({ many }) => ({
  licenses: many(licenses),
  orders: many(orders),
}))
