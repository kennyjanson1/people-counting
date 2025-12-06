"use server"

interface ProcessingResult {
  success: boolean
  stats?: {
    maleCount: number
    femaleCount: number
    totalCount: number
    fps: number
  }
  error?: string
}

// Ambil backend URL dari environment variable, fallback ke huggingface space URL
const backendUrl = process.env.PYTHON_BACKEND_URL || "https://knnyjnson-people-counting.hf.space"

/**
 * Process video file dengan backend Python
 * Bisa digunakan sebagai server action dari client components
 */
export async function processVideoFile(formData: FormData): Promise<ProcessingResult> {
  try {
    const response = await fetch(`${backendUrl}/api/video/process`, {
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
 * Validate backend connection
 */
export async function validateBackendConnection(): Promise<boolean> {
  try {
    const response = await fetch(`${backendUrl}/health`, {
      method: "GET",
      // Note: fetch API di Node.js atau Next.js tidak support timeout secara native,
      // bisa gunakan AbortController jika perlu timeout lebih advanced
    })

    return response.ok
  } catch (error) {
    console.error("Backend connection validation failed:", error)
    return false
  }
}
