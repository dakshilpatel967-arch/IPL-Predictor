import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ message: 'IPL Predictor API ready. Frontend uses Supabase directly.' })
}
