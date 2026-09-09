// Media upload handler for chat attachments (images, PDFs, voice notes).
import { NextRequest, NextResponse } from 'next/server'
import { authGuard, AuthError } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    await authGuard(request, ['admin', 'super_admin', 'staff'])
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    throw error
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const mimeType = file.type || 'application/octet-stream'
    const dataUrl = `data:${mimeType};base64,${base64}`

    return NextResponse.json({
      url: dataUrl,
      fileName: file.name,
      fileSize: file.size,
      mimeType,
    })
  } catch (error) {
    console.error('Error uploading media', error)
    return NextResponse.json({ error: 'Failed to upload media file' }, { status: 500 })
  }
}
