import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

import * as schema from "@/db/schema"

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL environment variable is not defined. Please check your .env file."
  )
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_SSL === "false"
      ? false
      : { rejectUnauthorized: false },
})

export const db = drizzle({ client: pool, schema })
