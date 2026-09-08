import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ data: [], total: 0 })
}
export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}))
  return NextResponse.json({ data: body })
}