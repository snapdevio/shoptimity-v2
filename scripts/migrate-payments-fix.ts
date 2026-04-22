import { db } from "../db"
import { sql } from "drizzle-orm"

async function main() {
  console.log("🚀 Starting database migration for $0 checkout support...")

  try {
    await db.transaction(async (tx) => {
      console.log("1. making stripe_payment_intent_id nullable...")
      await tx.execute(
        sql`ALTER TABLE payments ALTER COLUMN stripe_payment_intent_id DROP NOT NULL;`
      )

      console.log("2. making stripe_customer_id nullable...")
      await tx.execute(
        sql`ALTER TABLE payments ALTER COLUMN stripe_customer_id DROP NOT NULL;`
      )

      console.log("3. dropping old amount check constraint...")
      await tx.execute(
        sql`ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_amount_check;`
      )

      console.log("4. adding new amount check constraint (>= 0)...")
      await tx.execute(
        sql`ALTER TABLE payments ADD CONSTRAINT payments_amount_check_v2 CHECK (amount >= 0);`
      )
    })

    console.log("✅ Migration completed successfully!")
  } catch (err) {
    console.error("❌ Migration failed:", err)
    process.exit(1)
  }

  process.exit(0)
}

main()
