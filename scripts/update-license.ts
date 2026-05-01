// Pure Node.js — no npm packages. Run with: npx tsx scripts/update-license.ts
// ─── FILL IN THESE VALUES BEFORE RUNNING ─────────────────────────────────────

const DOMAIN = "*.myshopify.com"

const METADATA = {
  license: true,
  is_trial: false,
  trial_ends_at: null as string | null, // ISO string e.g. "2025-08-01T00:00:00.000Z" or null
  plan_name: "Free", // Free, Pro
}

const R2_ACCOUNT_ID = "<your-account-id>" // e.g. "abc123def456"
const R2_ACCESS_KEY_ID = "<your-r2-access-key-id>"
const R2_SECRET_ACCESS_KEY = "<your-r2-secret-access-key>"
const R2_BUCKET_NAME = "<your-bucket-name>"

// ─────────────────────────────────────────────────────────────────────────────

import * as crypto from "crypto"
import * as https from "https"

function hmac(key: Buffer | string, data: string): Buffer {
  return crypto.createHmac("sha256", key).update(data, "utf8").digest()
}

function sha256hex(data: string): string {
  return crypto.createHash("sha256").update(data, "utf8").digest("hex")
}

function signingKey(
  secretKey: string,
  date: string,
  region: string,
  service: string
): Buffer {
  const kDate = hmac("AWS4" + secretKey, date)
  const kRegion = hmac(kDate, region)
  const kService = hmac(kRegion, service)
  return hmac(kService, "aws4_request")
}

function putObjectR2(
  accountId: string,
  accessKeyId: string,
  secretAccessKey: string,
  bucket: string,
  key: string,
  body: string,
  contentType: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const host = `${accountId}.r2.cloudflarestorage.com`
    const path = `/${bucket}/${key}`
    const region = "auto"
    const service = "s3"
    const now = new Date()
    const amzDate =
      now
        .toISOString()
        .replace(/[:\-]|\.\d{3}/g, "")
        .slice(0, 15) + "Z" // yyyyMMddTHHmmssZ
    const dateStamp = amzDate.slice(0, 8) // yyyyMMdd
    const bodyHash = sha256hex(body)

    const canonicalHeaders =
      `content-type:${contentType}\n` +
      `host:${host}\n` +
      `x-amz-content-sha256:${bodyHash}\n` +
      `x-amz-date:${amzDate}\n`

    const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date"

    const canonicalRequest = [
      "PUT",
      path,
      "", // query string
      canonicalHeaders,
      signedHeaders,
      bodyHash,
    ].join("\n")

    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`
    const stringToSign = [
      "AWS4-HMAC-SHA256",
      amzDate,
      credentialScope,
      sha256hex(canonicalRequest),
    ].join("\n")

    const signature = hmac(
      signingKey(secretAccessKey, dateStamp, region, service),
      stringToSign
    ).toString("hex")

    const authorization =
      `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, ` +
      `SignedHeaders=${signedHeaders}, Signature=${signature}`

    const options: https.RequestOptions = {
      hostname: host,
      path,
      method: "PUT",
      headers: {
        "Content-Type": contentType,
        "Content-Length": Buffer.byteLength(body),
        "x-amz-date": amzDate,
        "x-amz-content-sha256": bodyHash,
        Authorization: authorization,
      },
    }

    const req = https.request(options, (res) => {
      let raw = ""
      res.on("data", (chunk) => (raw += chunk))
      res.on("end", () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve()
        } else {
          reject(new Error(`R2 PUT failed — HTTP ${res.statusCode}: ${raw}`))
        }
      })
    })

    req.on("error", reject)
    req.write(body)
    req.end()
  })
}

async function main() {
  const key = `shoptimity-v2/license/${DOMAIN}.json`
  const publicUrl = `https://license.shoptimity.com/${key}`
  const body = JSON.stringify(METADATA, null, 2)

  console.log("━".repeat(60))
  console.log("   🔑 Shoptimity — Manual License Update")
  console.log("━".repeat(60))
  console.log(`\nDomain : ${DOMAIN}`)
  console.log(`R2 Key : ${key}`)
  console.log(`URL    : ${publicUrl}`)
  console.log("\nMetadata:")
  console.log(body)

  console.log("\n🚀 Uploading to R2...")
  await putObjectR2(
    R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_BUCKET_NAME,
    key,
    body,
    "application/json"
  )

  console.log("✅ Done!")
  console.log(`\n🌐 Verify:\n   ${publicUrl}\n`)
}

main().catch((err) => {
  console.error("\n💥 Error:", err)
  process.exit(1)
})
