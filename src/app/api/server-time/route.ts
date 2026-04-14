import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Next.js server clock; fallback when backend GET /api/v1/server-time is unavailable. */
export async function GET() {
  return NextResponse.json({
    serverTime: new Date().toISOString(),
  });
}
