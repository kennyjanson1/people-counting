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
  private ws: WebSocket | null = null
  private listeners: ((stats: DetectionStats) => void)[] = []
  private detectionListeners: ((detections: Detection[]) => void)[] = []

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

  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.listeners = []
    this.detectionListeners = []
  }
}

export const detectionClient = new DetectionClient()
