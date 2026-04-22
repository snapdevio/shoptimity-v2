import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

let _client: S3Client | null = null

export function getR2Client(): S3Client {
  if (!_client) {
    _client = new S3Client({
      region: "auto",
      endpoint: process.env.R2_ENDPOINT!,
      forcePathStyle: false,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    })
  }
  return _client
}

export async function uploadLicenseMetadata(
  domainName: string,
  data: Record<string, unknown>
): Promise<void> {
  const client = getR2Client()

  await client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: `licenses/${domainName}.json`,
      Body: JSON.stringify(data),
      ContentType: "application/json",
    })
  )
}

export async function deleteLicenseMetadata(domainName: string): Promise<void> {
  const client = getR2Client()

  await client.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: `licenses/${domainName}.json`,
    })
  )
}

export async function deleteR2Object(key: string): Promise<void> {
  const client = getR2Client()

  await client.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
    })
  )
}

export async function getTemplateDownloadUrl(
  templateKey: string,
  expiresInSeconds: number = 3600
): Promise<string> {
  const client = getR2Client()

  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: templateKey,
  })

  return getSignedUrl(client, command, { expiresIn: expiresInSeconds })
}

export async function getPresignedPutUrl(
  key: string,
  contentType: string,
  expiresInSeconds: number = 3600
): Promise<string> {
  const client = getR2Client()

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    ContentType: contentType,
  })

  return getSignedUrl(client, command, { expiresIn: expiresInSeconds })
}
