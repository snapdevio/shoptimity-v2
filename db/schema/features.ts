import { relations } from "drizzle-orm"
import {
  pgTable,
  uuid,
  varchar,
  integer,
  boolean,
  timestamp,
  primaryKey,
} from "drizzle-orm/pg-core"

import { plans } from "./plans"

export const featureCategories = pgTable("feature_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const features = pgTable("features", {
  id: uuid("id").primaryKey().defaultRandom(),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => featureCategories.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  isActive: boolean("is_active").notNull().default(true),
  position: integer("position").notNull().default(0),
  isHighlight: boolean("is_highlight").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})

export const planFeatures = pgTable(
  "plan_features",
  {
    planId: uuid("plan_id")
      .notNull()
      .references(() => plans.id, { onDelete: "cascade" }),
    featureId: uuid("feature_id")
      .notNull()
      .references(() => features.id, { onDelete: "cascade" }),
    isEnabled: boolean("is_enabled").notNull().default(false),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.planId, table.featureId] }),
  })
)

export const featureCategoriesRelations = relations(
  featureCategories,
  ({ many }) => ({
    features: many(features),
  })
)

export const featuresRelations = relations(features, ({ one, many }) => ({
  category: one(featureCategories, {
    fields: [features.categoryId],
    references: [featureCategories.id],
  }),
  planFeatures: many(planFeatures),
}))

export const planFeaturesRelations = relations(planFeatures, ({ one }) => ({
  plan: one(plans, {
    fields: [planFeatures.planId],
    references: [plans.id],
  }),
  feature: one(features, {
    fields: [planFeatures.featureId],
    references: [features.id],
  }),
}))
