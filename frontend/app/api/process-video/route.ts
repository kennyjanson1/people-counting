import { type NextRequest, NextResponse } from "next/server"

// This route will receive video frames and return detection results
// Integration with your Python YOLO app via HTTP
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const videoBlob = formData.get("video") as Blob
    const inputType = formData.get("inputType") as string

    if (!videoBlob) {
      return NextResponse.json({ error: "No video provided" }, { status: 400 })
    }

    // Convert blob to buffer
    const buffer = Buffer.from(await videoBlob.arrayBuffer())

    // TODO: Send to Python backend running on localhost:5000
    // Example: POST request to your Flask/FastAPI app with the video
    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || "https://knnyjnson-people-counting.hf.space"

    const response = await fetch(`${pythonBackendUrl}/api/detect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
      },
      body: buffer,
    })

    if (!response.ok) {
      throw new Error(`Python backend error: ${response.statusText}`)
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Video processing error:", error)
    return NextResponse.json({ error: "Failed to process video" }, { status: 500 })
  }
}
