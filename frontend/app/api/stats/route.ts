import { NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000"

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/stats`)

    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`)
    }

    const data = await response.json()

    return NextResponse.json({
      maleIn: data.male_in,
      maleOut: data.male_out,
      femaleIn: data.female_in,
      femaleOut: data.female_out,
      currentCount: data.current_count,
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
