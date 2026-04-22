import { existsSync } from "fs"
if (existsSync(".env")) process.loadEnvFile()

import { db } from "../db"
import { user } from "../db/schema/auth"
import { eq } from "drizzle-orm"

async function main() {
  const email = process.argv[2]

  if (!email) {
    console.error("Usage: pnpm make-admin <email>")
    process.exit(1)
  }

  const [found] = await db
    .select({ id: user.id, email: user.email, role: user.role })
    .from(user)
    .where(eq(user.email, email.toLowerCase().trim()))
    .limit(1)

  if (!found) {
    console.error(`User with email "${email}" not found.`)
    process.exit(1)
  }

  if (found.role === "admin") {
    console.log(`User "${email}" is already an admin.`)
    process.exit(0)
  }

  await db
    .update(user)
    .set({ role: "admin", updatedAt: new Date() })
    .where(eq(user.id, found.id))

  console.log(`User "${email}" has been promoted to admin.`)
  process.exit(0)
}

main().catch((err) => {
  console.error("Failed:", err)
  process.exit(1)
})
