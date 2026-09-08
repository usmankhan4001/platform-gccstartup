import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  return NextResponse.json({ suggestion: null, message: 'AI copilot will be connected to the database' })
}