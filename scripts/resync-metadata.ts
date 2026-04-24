import "dotenv/config"
import { db } from "../db"
import { domains, licenses, plans, planFeatures, features } from "../db/schema"
import { isNull, eq, and } from "drizzle-orm"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"

async function resyncAllMetadata() {
  console.log("🚀 Starting direct re-sync of all license metadata to R2...")

  const allDomains = await db
    .select()
    .from(domains)
    .where(isNull(domains.deletedAt))

  console.log(
    `📦 Found ${allDomains.length} active domains. Initializing R2...`
  )

  const r2 = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT!,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })

  for (const domainRecord of allDomains) {
    try {
      const [license] = await db
        .select()
        .from(licenses)
        .where(eq(licenses.id, domainRecord.licenseId))
        .limit(1)

      if (!license) {
        console.warn(
          `⚠️  License not found for domain ${domainRecord.domainName}`
        )
        continue
      }

      const [plan] = await db
        .select()
        .from(plans)
        .where(eq(plans.id, license.planId))
        .limit(1)

      if (!plan) {
        console.warn(`⚠️  Plan not found for license ${license.id}`)
        continue
      }

      const planFeaturesList = await db
        .select({ slug: features.slug })
        .from(planFeatures)
        .innerJoin(features, eq(planFeatures.featureId, features.id))
        .where(
          and(
            eq(planFeatures.planId, license.planId),
            eq(planFeatures.isEnabled, true)
          )
        )

      const featureSlugs = planFeaturesList.map((f) => f.slug)

      const metadata = {
        license: true,
        is_trial: license.isTrial,
        trial_ends_at: license.trialEndsAt
          ? license.trialEndsAt.toISOString()
          : null,
        plan_name: plan.name,
        features: featureSlugs,
      }

      await r2.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME!,
          Key: `license/${domainRecord.domainName}.json`,
          Body: JSON.stringify(metadata, null, 2),
          ContentType: "application/json",
        })
      )

      console.log(
        `✅ Updated ${domainRecord.domainName} (${featureSlugs.length} features)`
      )
    } catch (err) {
      console.error(`❌ Failed to update ${domainRecord.domainName}:`, err)
    }
  }

  console.log("✨ All metadata files have been force-synced to R2!")
  process.exit(0)
}

resyncAllMetadata().catch((err) => {
  console.error("❌ Re-sync failed:", err)
  process.exit(1)
})
