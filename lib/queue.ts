import { PgBoss } from "pg-boss"

let _boss: PgBoss | null = null
let _startPromise: Promise<PgBoss> | null = null

/**
 * Returns the singleton pg-boss instance, ensuring it is started.
 * Creates it lazily on first call and handles the asynchronous startup.
 */
export async function getBoss(): Promise<PgBoss> {
  if (_startPromise) return _startPromise

  _startPromise = (async () => {
    if (!_boss) {
      const dbUrl = process.env.DATABASE_URL
      if (!dbUrl) throw new Error("DATABASE_URL is not set")
      _boss = new PgBoss(dbUrl)
    }

    // Check if already started elsewhere or start it now
    await _boss.start()
    return _boss
  })()

  return _startPromise
}

/**
 * Starts the pg-boss instance. Should be called once at application startup.
 */
export async function startBoss(): Promise<void> {
  await getBoss()
}

// ---------- Queue names ----------

const QUEUE_EMAIL = "email-delivery"
const QUEUE_LICENSE_METADATA_EXPORT = "license-metadata-export"
const QUEUE_LICENSE_METADATA_DELETE = "license-metadata-delete"

// ---------- Job data types ----------

export interface EmailJobData {
  template: string
  to: string
  subject?: string
  html?: string
  props?: Record<string, unknown>
}

export interface LicenseMetadataExportJobData {
  domainName: string
  userId: string
  action: string
  licenseId?: string
  planId?: string
  status?: string
  totalSlots?: number
}

export interface LicenseMetadataDeleteJobData {
  domainName: string
}

// ---------- Enqueue helpers ----------

/**
 * Enqueues an email sending job.
 */
export async function enqueueEmailJob(
  data: EmailJobData
): Promise<string | null> {
  const boss = await getBoss()
  return boss.send(QUEUE_EMAIL, data, {
    retryLimit: 5,
    retryDelay: 30,
    retryBackoff: true,
    expireInSeconds: 3600,
  })
}

/**
 * Enqueues a license metadata export job (upload to R2).
 */
export async function enqueueLicenseMetadataExportJob(
  data: LicenseMetadataExportJobData
): Promise<string | null> {
  const boss = await getBoss()
  return boss.send(QUEUE_LICENSE_METADATA_EXPORT, data, {
    retryLimit: 3,
    retryDelay: 15,
    retryBackoff: true,
    expireInSeconds: 1800,
  })
}

/**
 * Enqueues a license metadata delete job (delete from R2).
 */
export async function enqueueLicenseMetadataDeleteJob(
  data: LicenseMetadataDeleteJobData
): Promise<string | null> {
  const boss = await getBoss()
  return boss.send(QUEUE_LICENSE_METADATA_DELETE, data, {
    retryLimit: 3,
    retryDelay: 15,
    retryBackoff: true,
    expireInSeconds: 1800,
  })
}
