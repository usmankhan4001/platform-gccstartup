import { NextRequest, NextResponse } from 'next/server'
import { requireApiKey, addCorsHeaders } from '@/lib/api-auth'
import { errorJson, handle } from '../../_lib'

/**
 * Companies are not modelled in the platform database yet — the CRM carries a free
 * text `contacts.company` field instead. Rather than pretend, the endpoint degrades
 * gracefully with a machine-readable explanation so API consumers can branch on it.
 */
export const GET = requireApiKey(async (request: NextRequest, context: any, key: any) => {
  return handle(async () => {
    return errorJson('Companies are not modelled in the platform database; contacts.company is a free-text field', 501)
  })
})

export const POST = requireApiKey(async (request: NextRequest, context: any, key: any) => {
  return handle(async () => {
    return errorJson('Companies are not modelled in the platform database; contacts.company is a free-text field', 501)
  })
})

export async function OPTIONS() {
  return addCorsHeaders(new NextResponse(null, { status: 204 }))
}
