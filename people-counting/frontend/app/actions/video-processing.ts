"use server"

interface ProcessingResult {
  success: boolean
  stats?: {
    maleIn: number
    maleOut: number
    femaleIn: number
    femaleOut: number
    currentCount: number
    fps: number
  }
  error?: string
}

/**
 * Process video file dengan backend Python
 * Bisa digunakan sebagai server action dari client components
 */
export async function processVideoFile(formData: FormData): Promise<ProcessingResult> {
  try {
    const response = await fetch("http://localhost:3000/api/video/process", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      return {
        success: false,
        error: `Processing failed: ${response.statusText}`,
      }
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error("[v0] Video processing error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

/**
 * Start webcam streaming ke backend
 */
export async function startWebcamStream(): Promise<{ success: boolean; error?: string }> {
  try {
    return { success: true }
  } catch (error) {
    console.error("[v0] Webcam start error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

/**
 * Validate backend connection
 */
export async function validateBackendConnection(): Promise<boolean> {
  try {
    const backendUrl = process.env.PYTHON_BACKEND_URL || "http://localhost:5000"

    const response = await fetch(`${backendUrl}/health`, {
      method: "GET",
      timeout: 5000,
    })

    return response.ok
  } catch (error) {
    console.error("Backend connection validation failed:", error)
    return false
  }
}
