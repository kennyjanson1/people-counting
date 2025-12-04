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

interface Detection {
  id: number
  x: number
  y: number
  width: number
  height: number
  confidence: number
  gender: "male" | "female"
  label: string
}

export class DetectionClient {
  private eventSource: EventSource | null = null
  private ws: WebSocket | null = null
  private listeners: ((stats: DetectionStats) => void)[] = []
  private detectionListeners: ((detections: Detection[]) => void)[] = []

  // ============================
  // CONNECT TO SSE STREAM (PORT 5000)
  // ============================
  connectStream(onUpdate: (stats: DetectionStats) => void): void {
    this.listeners.push(onUpdate)

    if (this.eventSource) {
      this.eventSource.close()
    }

    this.eventSource = new EventSource("http://localhost:5000/api/stream")

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

  // ============================
  // CONNECT TO WEBSOCKET FOR REAL-TIME PROCESSING
  // ============================
  connectWebSocket(onDetections: (detections: Detection[]) => void, onStats: (stats: DetectionStats) => void): void {
    this.detectionListeners.push(onDetections)
    this.listeners.push(onStats)

    this.disconnect()

    this.ws = new WebSocket("ws://localhost:5000/ws")

    this.ws.onopen = () => {
      console.log("WebSocket connected")
    }

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.detections) {
          this.detectionListeners.forEach((listener) => listener(data.detections))
        }
        if (data.stats) {
          this.listeners.forEach((listener) => listener(data.stats))
        }
      } catch (err) {
        console.error("Failed to parse WebSocket data:", err)
      }
    }

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error)
    }

    this.ws.onclose = () => {
      console.log("WebSocket closed")
    }
  }

  // ============================
  // SEND FRAME TO BACKEND VIA WEBSOCKET
  // ============================
  sendFrame(frameData: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(frameData)
    }
  }

  // ============================
  // UPLOAD VIDEO → BACKEND 5000
  // ============================
  async uploadVideo(file: File): Promise<DetectionStats> {
    const formData = new FormData()
    formData.append("video", file)
    formData.append("inputType", "upload")

    const response = await fetch("http://localhost:5000/api/process-video", {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      throw new Error("Failed to process video")
    }

    return await response.json()
  }

  // ============================
  // START WEBCAM STREAM → BACKEND 5000 (LEGACY)
  // ============================
  async startWebcamStream(): Promise<void> {
    const response = await fetch("http://localhost:5000/api/process-video", {
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
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.listeners = []
    this.detectionListeners = []
  }
}

export const detectionClient = new DetectionClient()
