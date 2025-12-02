// Client untuk berkomunikasi dengan backend Python
interface DetectionStats {
  maleIn: number
  maleOut: number
  femaleIn: number
  femaleOut: number
  currentCount: number
  fps: number
  timestamp: number
}

export class DetectionClient {
  private eventSource: EventSource | null = null
  private listeners: ((stats: DetectionStats) => void)[] = []

  // Connect ke server-sent events stream
  connectStream(onUpdate: (stats: DetectionStats) => void): void {
    this.listeners.push(onUpdate)

    if (this.eventSource) {
      this.eventSource.close()
    }

    this.eventSource = new EventSource("/api/stream")

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        this.listeners.forEach((listener) => listener(data))
      } catch (err) {
        console.error("[v0] Failed to parse detection data:", err)
      }
    }

    this.eventSource.onerror = () => {
      console.error("[v0] Stream connection error")
      this.disconnect()
    }
  }

  // Upload dan process video file
  async uploadVideo(file: File): Promise<DetectionStats> {
    const formData = new FormData()
    formData.append("video", file)
    formData.append("inputType", "upload")

    const response = await fetch("/api/process-video", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error("Failed to process video")
    }

    return await response.json()
  }

  // Start webcam streaming
  async startWebcamStream(): Promise<void> {
    const response = await fetch("/api/process-video", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputType: "webcam" }),
    })

    if (!response.ok) {
      throw new Error("Failed to start webcam stream")
    }
  }

  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }
    this.listeners = []
  }
}

export const detectionClient = new DetectionClient()
