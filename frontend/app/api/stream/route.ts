// Server-Sent Events untuk real-time updates
import { type NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "https://knnyjnson-people-counting.hf.space"

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder()

  const customReadable = new ReadableStream({
    async start(controller) {
      try {
        const response = await fetch(`${BACKEND_URL}/api/stream`)

        if (!response.ok) throw new Error("Stream connection failed")

        const reader = response.body?.getReader()
        if (!reader) throw new Error("No response body")

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          // Transform backend format ke frontend format
          const text = new TextDecoder().decode(value)
          const lines = text.split("\n")
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.substring(6))
                // Normalize incoming stream data to new per-frame keys
                const maleCount = data.maleCount ?? data.male_count ?? data.male_in ?? 0
                const femaleCount = data.femaleCount ?? data.female_count ?? data.female_in ?? 0
                const totalCount = data.totalCount ?? data.total_count ?? data.current_count ?? (maleCount + femaleCount)
                const transformed = `data: ${JSON.stringify({
                  maleCount,
                  femaleCount,
                  totalCount,
                  fps: data.fps ?? 0,
                  timestamp: Date.now(),
                })}\n\n`
                controller.enqueue(encoder.encode(transformed))
              } catch (e) {
                // Ignore parse errors
              }
            }
          }
        }
      } catch (error) {
        console.error("[v0] Stream error:", error)
        controller.error(error)
      } finally {
        controller.close()
      }
    },
  })

  return new NextResponse(customReadable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
