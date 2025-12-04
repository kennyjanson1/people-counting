import { NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000"

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/stats`)

    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`)
    }

    const data = await response.json()

    const maleCount = data.maleCount ?? data.male_count ?? data.male_in ?? 0
    const femaleCount = data.femaleCount ?? data.female_count ?? data.female_in ?? 0
    const totalCount = data.totalCount ?? data.total_count ?? data.current_count ?? (maleCount + femaleCount)

    return NextResponse.json({
      maleCount,
      femaleCount,
      totalCount,
      fps: data.fps ?? 0,
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
