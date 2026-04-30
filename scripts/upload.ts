import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import * as fs from "fs"
import * as path from "path"
import "dotenv/config"

// Configuration
const VIDEO_URL = "https://license.shoptimity.com/shoptimity-v2/video/step.mp4"
const TEMPLATES_BASE_URL = "https://license.shoptimity.com/shoptimity-v2/templates"
const OG_IMAGE_URL = "https://license.shoptimity.com/shoptimity-v2/assets/og.png"
const SETUP_ASSETS_BASE_URL = "https://license.shoptimity.com/shoptimity-v2/assets/setup"

// Shared R2 Client
let _client: S3Client | null = null
function getR2Client() {
  if (!_client) {
    _client = new S3Client({
      region: "auto",
      endpoint: process.env.R2_ENDPOINT!,
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    })
  }
  return _client
}

/**
 * Sanitizes a filename: lowercase, spaces to dashes, remove special chars.
 * Keeps extensions lowercase.
 */
function sanitizeFilename(name: string): string {
  const parts = name.split(".")
  const ext = (parts.pop() || "").toLowerCase()
  const base = parts.join(".")

  const sanitizedBase = base
    .toLowerCase()
    .replace(/\s+/g, "-") // spaces to dashes
    .replace(/[^a-z0-9-_]/g, "") // remove special chars
    .replace(/-+/g, "-") // collapse multiple dashes
    .trim()

  return sanitizedBase ? `${sanitizedBase}.${ext}` : name.toLowerCase()
}

/**
 * Purges Cloudflare cache for a list of URLs.
 */
async function purgeCloudflareCache(urls: string[]) {
  if (urls.length === 0) return

  const zoneId = process.env.CF_ZONE_ID
  const apiToken = process.env.CF_API_TOKEN

  if (!zoneId || !apiToken) {
    console.warn(
      "\n:warning:  CF_ZONE_ID or CF_API_TOKEN not set — skipping Cloudflare cache purge."
    )
    return
  }

  console.log(
    `\n:globe_with_meridians: Purging Cloudflare cache for ${urls.length} URL(s)...`
  )

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ files: urls }),
      }
    )

    const data = (await res.json()) as { success: boolean; errors: unknown[] }
    if (!res.ok || !data.success) {
      console.error(":x: Cloudflare purge failed:", data.errors)
    } else {
      console.log(":white_check_mark: Cloudflare cache purged successfully.")
    }
  } catch (error) {
    console.error(":x: Failed to purge Cloudflare cache:", error)
  }
}

/**
 * Uploads a single file to R2.
 */
async function uploadToR2(key: string, body: Buffer, contentType: string) {
  const client = getR2Client()
  const bucket = process.env.R2_BUCKET_NAME!

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "no-cache, no-store, must-revalidate",
    })
  )
}

/**
 * Handle template ZIP uploads with local renaming and sanitization.
 */
async function uploadTemplates(purgeQueue: string[]) {
  const templatesDir = path.join(process.cwd(), "public", "templates")

  if (!fs.existsSync(templatesDir)) {
    console.warn(":warning:  public/templates/ directory not found.")
    return
  }

  const files = fs.readdirSync(templatesDir).filter((f) => f.endsWith(".zip"))

  if (files.length === 0) {
    console.warn(":warning:  No .zip files found in public/templates/.")
    return
  }

  console.log(`\n:package: Processing ${files.length} template zip(s)...\n`)

  for (const file of files) {
    const sanitized = sanitizeFilename(file)
    let currentFile = file
    let filePath = path.join(templatesDir, file)

    // Rename local file if not standardized
    if (file !== sanitized) {
      const newPath = path.join(templatesDir, sanitized)
      console.log(
        `   :arrows_counterclockwise: Renaming: "${file}" → "${sanitized}"`
      )
      try {
        fs.renameSync(filePath, newPath)
        currentFile = sanitized
        filePath = newPath
      } catch (err) {
        console.error(`   :x: Failed to rename ${file}:`, err)
      }
    }

    const fileBuffer = fs.readFileSync(filePath)
    const key = `templates/${currentFile}`
    const sizeKB = (fileBuffer.byteLength / 1024).toFixed(1)

    console.log(
      `:rocket: Uploading ${currentFile} (${sizeKB} KB) → R2 Key: ${key}`
    )

    try {
      await uploadToR2(key, fileBuffer, "application/zip")
      console.log(`   :white_check_mark: Success!`)
      purgeQueue.push(`${TEMPLATES_BASE_URL}/${currentFile}`)
    } catch (error) {
      console.error(`   :x: Failed to upload ${currentFile}:`, error)
    }
  }
}

async function uploadAsset(
  localPath: string,
  r2Key: string,
  contentType: string,
  publicUrl: string,
  purgeQueue: string[]
) {
  const filePath = path.join(process.cwd(), localPath)

  if (!fs.existsSync(filePath)) {
    console.warn(`:warning:  ${localPath} not found — skipping.`)
    return
  }

  const fileBuffer = fs.readFileSync(filePath)
  const sizeMB = (fileBuffer.byteLength / (1024 * 1024)).toFixed(2)

  console.log(
    `:rocket: Uploading ${localPath} (${sizeMB} MB) → R2 Key: ${r2Key}`
  )

  try {
    await uploadToR2(r2Key, fileBuffer, contentType)
    console.log(`   :white_check_mark: Success!`)
    purgeQueue.push(publicUrl)
  } catch (error) {
    console.error(`   :x: Failed to upload ${localPath}:`, error)
  }
}

/**
 * Handle setup asset image uploads.
 */
async function uploadSetupAssets(purgeQueue: string[]) {
  const setupDir = path.join(process.cwd(), "public", "new")

  if (!fs.existsSync(setupDir)) {
    console.warn(":warning:  public/assets/setup/ directory not found.")
    return
  }

  const files = fs
    .readdirSync(setupDir)
    .filter((f) => /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(f))

  if (files.length === 0) {
    console.warn(":warning:  No image files found in public/assets/setup/.")
    return
  }

  console.log(
    `\n:camera_with_flash: Processing ${files.length} setup asset(s)...\n`
  )

  for (const file of files) {
    const filePath = path.join(setupDir, file)
    const fileBuffer = fs.readFileSync(filePath)
    const key = `shoptimity-v2/assets/setup/${file}`
    const ext = path.extname(file).toLowerCase()
    const contentType =
      ext === ".svg" ? "image/svg+xml" : `image/${ext.replace(".", "")}`
    const sizeKB = (fileBuffer.byteLength / 1024).toFixed(1)

    console.log(`:rocket: Uploading ${file} (${sizeKB} KB) → R2 Key: ${key}`)

    try {
      await uploadToR2(key, fileBuffer, contentType)
      console.log(`   :white_check_mark: Success!`)
      purgeQueue.push(`${SETUP_ASSETS_BASE_URL}/${file}`)
    } catch (error) {
      console.error(`   :x: Failed to upload ${file}:`, error)
    }
  }
}

async function main() {
  console.log("━".repeat(60))
  console.log("   :gem: Shoptimity R2 Asset Manager")
  console.log("━".repeat(60))

  const purgeQueue: string[] = []

  // 1. Templates (Renaming + Uploading)
  // await uploadTemplates(purgeQueue)

  // 2. Setup Assets
  await uploadSetupAssets(purgeQueue)

  // 3. Main Video
  // await uploadAsset("public/step.mp4", "video/step.mp4", "video/mp4", VIDEO_URL, purgeQueue);

  // 4. OG Image
  // await uploadAsset("public/og.png", "assets/og.png", "image/png", OG_IMAGE_URL, purgeQueue);

  // 5. Final Cache Purge
  // if (purgeQueue.length > 0) {
  //     await purgeCloudflareCache(purgeQueue)
  // }

  console.log("\n" + "━".repeat(60))
  console.log(
    `   :sparkles: All uploads complete! (${purgeQueue.length} files tracked)`
  )
  console.log("━".repeat(60) + "\n")
}

main().catch((err) => {
  console.error("\n:boom: Critical error during execution:", err)
  process.exit(1)
})
