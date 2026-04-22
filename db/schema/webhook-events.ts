import {
  pgTable,
  uuid,
  varchar,
  boolean,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core"

export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: varchar("event_id", { length: 255 }).notNull().unique(),
    type: varchar("type", { length: 255 }).notNull(),
    processed: boolean("processed").notNull().default(false),
    processingError: text("processing_error"),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("webhook_events_processed_idx").on(table.processed)]
)
