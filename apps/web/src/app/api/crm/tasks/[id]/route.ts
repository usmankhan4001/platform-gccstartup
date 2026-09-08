import { NextResponse } from 'next/server'
export async function GET() { return NextResponse.json({ data: [] }) }
export async function POST(request: Request) { const body = await request.json().catch(() => ({})); return NextResponse.json({ data: body }) }
export async function PATCH(request: Request) { const body = await request.json().catch(() => ({})); return NextResponse.json({ data: body }) }
export async function DELETE() { return NextResponse.json({ success: true }) }
