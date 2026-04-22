import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
} from "drizzle-orm/pg-core"

export const templates = pgTable("templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  img: varchar("img", { length: 255 }),
  bg: varchar("bg", { length: 50 }),
  downloadLink: varchar("download_link", { length: 500 }),
  previewLink: varchar("preview_link", { length: 500 }),
  logo: varchar("logo", { length: 500 }),
  banner: varchar("banner", { length: 500 }),
  startSize: varchar("start_size", { length: 255 }),
  shortDesc: text("short_desc"),
  cro: varchar("cro", { length: 100 }),
  aov: varchar("aov", { length: 100 }),
  rev: varchar("rev", { length: 100 }),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
})
