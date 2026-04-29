import { relations } from "drizzle-orm"
import {
  pgTable,
  uuid,
  varchar,
  integer,
  jsonb,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core"

import { licenses } from "@/db/schema/licenses"
import { orders } from "@/db/schema/orders"
import { planFeatures } from "./features"

export const planModeEnum = pgEnum("plan_mode", [
  "monthly",
  "yearly",
  "free",
  "lifetime",
])

export const plans = pgTable("plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  mode: planModeEnum("mode").notNull().default("monthly"),
  slots: integer("slots").notNull(),
  regularPrice: integer("regular_price").notNull(),
  finalPrice: integer("final_price").notNull(),
  currency: varchar("currency", { length: 10 }).notNull().default("usd"),
  features: jsonb("features"), // Used for card bullet points
  isActive: boolean("is_active").notNull().default(true),
  stripePaymentLink: varchar("stripe_payment_link", { length: 255 }),
  trialDays: integer("trial_days").notNull().default(0),
  couponCode: varchar("coupon_code", { length: 255 }), // Prefill code for this plan
  badge: varchar("badge", { length: 255 }),

  // Custom Yearly Overrides
  hasYearlyPlan: boolean("has_yearly_plan").notNull().default(false),
  yearlyDiscountPercentage: integer("yearly_discount_percent"), // percentage final price
  yearlyDiscountCouponCode: varchar("yearly_discount_coupon_code", {
    length: 255,
  }), // Stripe promo code

  // Cancellation Retention
  cancelApplyDiscount: boolean("cancel_apply_discount")
    .notNull()
    .default(false),
  monthlyCancelDiscount: integer("monthly_cancel_discount").default(0),
  yearlyCancelDiscount: integer("yearly_cancel_discount").default(0),
  monthlyCancelCouponCode: varchar("monthly_cancel_coupon_code", {
    length: 255,
  }),
  yearlyCancelCouponCode: varchar("yearly_cancel_coupon_code", { length: 255 }),
  monthlyCancelDuration: integer("monthly_cancel_duration").default(3), // months
  yearlyCancelDuration: integer("yearly_cancel_duration").default(1), // years

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
  planFeatures: many(planFeatures),
}))
