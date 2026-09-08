import { S3Client, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { logger } from '../utils/logger'

function getR2Client(): S3Client | null {
  const accountId = process.env.R2_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY

  if (!accountId || !accessKeyId || !secretAccessKey) {
    logger.warn('R2: missing R2_ACCOUNT_ID or R2 credentials in environment')
    return null
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  })
}

function getBucket(): string {
  return process.env.R2_BUCKET ?? ''
}

/**
 * Generate a pre-signed upload URL for R2.
 * @param key - Object key (path) in the bucket
 * @param contentType - MIME type of the file
 * @param expiresIn - URL lifetime in seconds (default 3600)
 * @returns Pre-signed upload URL or null if not configured
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 3600,
): Promise<string | null> {
  const client = getR2Client()
  if (!client) return null

  const command = new PutObjectCommand({
    Bucket: getBucket(),
    Key: key,
    ContentType: contentType,
  })

  return getSignedUrl(client, command, { expiresIn })
}

/**
 * Generate a pre-signed download URL for R2.
 * @param key - Object key (path) in the bucket
 * @param expiresIn - URL lifetime in seconds (default 3600)
 * @returns Pre-signed download URL or null if not configured
 */
export async function getPresignedDownloadUrl(
  key: string,
  expiresIn: number = 3600,
): Promise<string | null> {
  const client = getR2Client()
  if (!client) return null

  const command = new GetObjectCommand({
    Bucket: getBucket(),
    Key: key,
  })

  return getSignedUrl(client, command, { expiresIn })
}

/**
 * Delete a file from R2.
 * @param key - Object key to delete
 */
export async function deleteFile(key: string): Promise<void> {
  const client = getR2Client()
  if (!client) return

  await client.send(
    new DeleteObjectCommand({ Bucket: getBucket(), Key: key }),
  )
}

/**
 * List files in R2 under a prefix.
 * @param prefix - Key prefix to filter by
 * @returns Array of object keys
 */
export async function listFiles(prefix: string): Promise<string[]> {
  const client = getR2Client()
  if (!client) return []

  const keys: string[] = []
  let continuationToken: string | undefined

  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: getBucket(),
        Prefix: prefix,
        ContinuationToken: continuationToken,
      }),
    )

    if (response.Contents) {
      for (const obj of response.Contents) {
        if (obj.Key) keys.push(obj.Key)
      }
    }

    continuationToken = response.NextContinuationToken
  } while (continuationToken)

  return keys
}
