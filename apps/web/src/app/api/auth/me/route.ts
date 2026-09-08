import { NextRequest, NextResponse } from 'next/server'
import { authGuard } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await authGuard(request)
    return NextResponse.json({ user })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Authentication required' },
      { status: error.status || 401 },
    )
  }
}
