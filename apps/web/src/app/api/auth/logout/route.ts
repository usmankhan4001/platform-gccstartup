import { NextRequest, NextResponse } from 'next/server'
import { endSession } from '@/lib/auth/session'

export async function POST(request: NextRequest) {
  const cookie = await endSession(request)
  return NextResponse.json({ success: true }, { headers: { 'Set-Cookie': cookie } })
}
