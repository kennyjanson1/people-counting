import { type NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000"

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

    return NextResponse.json({
      success: true,
      stats: {
        maleIn: data.counts.male_in,
        maleOut: data.counts.male_out,
        femaleIn: data.counts.female_in,
        femaleOut: data.counts.female_out,
        currentCount: data.counts.current_count,
        fps: 30, // default FPS
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
