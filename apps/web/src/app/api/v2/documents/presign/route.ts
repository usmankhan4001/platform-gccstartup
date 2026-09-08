import { NextRequest, NextResponse } from 'next/server'
import { requireApiKey, hasPermission, addCorsHeaders } from '@/lib/api-auth'
import { handle, errorJson } from '../../_lib'

/**
 * Pre-signed uploads. The AWS SDK is not a web-app dependency, so when the R2/S3
 * env vars are unset this returns an explicit 501 rather than a fake URL a client
 * would discover is broken only after uploading.
 */
export const POST = requireApiKey(async (request: NextRequest, context: any, key: any) => {
  if (!hasPermission(key, 'documents:write')) return errorJson('Missing permission: documents:write', 403)
  return handle(async () => {
    const body = await request.json().catch(() => ({}))
    const { filename, contentType, expiresIn = 3600 } = body ?? {}

    if (!filename?.trim()) return errorJson('Filename is required', 400)

    const bucket = process.env.R2_BUCKET_NAME?.trim() || process.env.S3_BUCKET?.trim()
    const accessKey = process.env.R2_ACCESS_KEY_ID?.trim() || process.env.AWS_ACCESS_KEY_ID?.trim()
    const secretKey = process.env.R2_SECRET_ACCESS_KEY?.trim() || process.env.AWS_SECRET_ACCESS_KEY?.trim()
    const endpoint = process.env.R2_ENDPOINT?.trim() || process.env.S3_ENDPOINT?.trim()

    if (!bucket || !accessKey || !secretKey || !endpoint) {
      return errorJson(
        'Pre-signed uploads are not configured: set R2_BUCKET_NAME, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_ENDPOINT',
        501,
      )
    }

    // Signature would require @aws-sdk/s3-request-presigner, which is not installed.
    // Report configuration state honestly instead of hand-rolling SigV4.
    return errorJson('Pre-signed uploads require @aws-sdk/s3-request-presigner, which is not installed in apps/web', 501)
  })
})

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }))
}
