import { relations, sql } from "drizzle-orm"
import {
  pgTable,
  uuid,
  text,
  varchar,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core"

import { users } from "@/db/schema/users"
import { licenses } from "@/db/schema/licenses"

export const domains = pgTable(
  "domains",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    licenseId: uuid("license_id")
      .notNull()
      .references(() => licenses.id),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    domainName: varchar("domain_name", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("domains_user_id_idx").on(table.userId),
    index("domains_license_id_idx").on(table.licenseId),
    uniqueIndex("domains_domain_name_active_idx")
      .on(table.domainName)
      .where(sql`${table.deletedAt} IS NULL`),
  ]
)

export const domainsRelations = relations(domains, ({ one }) => ({
  license: one(licenses, {
    fields: [domains.licenseId],
    references: [licenses.id],
  }),
  user: one(users, {
    fields: [domains.userId],
    references: [users.id],
  }),
}))
