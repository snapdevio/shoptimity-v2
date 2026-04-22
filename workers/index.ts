import { PgBoss } from "pg-boss"

import { registerEmailWorker } from "@/workers/email-worker"
import { registerMetadataWorker } from "@/workers/metadata-worker"

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error("[workers] DATABASE_URL environment variable is required")
    process.exit(1)
  }

  const boss = new PgBoss({ connectionString })

  boss.on("error", (error: Error) => {
    console.error("[workers] pg-boss error:", error)
  })

  await boss.start()
  // console.log("[workers] pg-boss started")

  await registerEmailWorker(boss)
  await registerMetadataWorker(boss)

  // console.log("[workers] All workers registered and running")

  async function shutdown() {
    // console.log("[workers] Shutting down gracefully...")
    try {
      await boss.stop({ graceful: true, timeout: 30_000 })
      // console.log("[workers] pg-boss stopped")
    } catch (error) {
      console.error("[workers] Error during shutdown:", error)
    }
    process.exit(0)
  }

  process.on("SIGTERM", shutdown)
  process.on("SIGINT", shutdown)
}

main().catch((error) => {
  console.error("[workers] Fatal error:", error)
  process.exit(1)
})
