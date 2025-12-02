import { type NextRequest, NextResponse } from "next/server"

// Health check endpoint
export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "people-counting-api",
  })
}
