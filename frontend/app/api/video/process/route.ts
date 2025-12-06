import { type NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "https://knnyjnson-people-counting.hf.space"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const backendFormData = new FormData()
    for (const [key, value] of formData) {
      backendFormData.append(key, value)
    }

    const response = await fetch(`${BACKEND_URL}/api/process-video`, {
      method: "POST",
      body: backendFormData,
    })

    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`)
    }

    const data = await response.json()

    // Normalize backend counts to per-frame stats
    const counts = data.counts || {}
    const maleCount = counts.maleCount ?? counts.male_count ?? counts.male_in ?? 0
    const femaleCount = counts.femaleCount ?? counts.female_count ?? counts.female_in ?? 0
    const totalCount = counts.totalCount ?? counts.total_count ?? counts.current_count ?? (maleCount + femaleCount)

    return NextResponse.json({
      success: true,
      stats: {
        maleCount,
        femaleCount,
        totalCount,
        fps: counts.fps ?? 30,
      },
    })
  } catch (error) {
    console.error("[v0] Video processing error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
