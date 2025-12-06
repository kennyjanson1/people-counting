// Client untuk berkomunikasi dengan backend Python
interface DetectionStats {
  maleCount: number
  femaleCount: number
  totalCount: number
  fps: number
  timestamp?: number
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
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  // ============================
  // GET WEBSOCKET URL BASED ON ENVIRONMENT
  // ============================
  private getWebSocketUrl(): string {
    // Priority 1: Environment variable
    if (process.env.NEXT_PUBLIC_WS_URL) {
      console.log('[WS] Using env var:', process.env.NEXT_PUBLIC_WS_URL)
      return process.env.NEXT_PUBLIC_WS_URL
    }

    // Priority 2: Detect environment
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      
      console.log('[WS] Auto-detecting environment:', { hostname, protocol })
      
      // Production (Hugging Face Space)
      if (hostname.includes('hf.space')) {
        const url = `${protocol}//${hostname}/ws`
        console.log('[WS] Detected HF Space:', url)
        return url
      }
      
      // Production (Vercel + custom backend)
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        const url = 'wss://knnyjnson-people-counting.hf.space/ws'
        console.log('[WS] Detected production:', url)
        return url
      }
      
      // Local development - PORT 7860
      const url = 'ws://localhost:7860/ws'
      console.log('[WS] Detected local development:', url)
      return url
    }

    // Fallback
    console.log('[WS] Using fallback URL')
    return 'ws://localhost:7860/ws'
  }

  // ============================
  // CONNECT TO WEBSOCKET FOR REAL-TIME PROCESSING
  // ============================
  connectWebSocket(onDetections: (detections: Detection[]) => void, onStats: (stats: DetectionStats) => void): void {
    // Prevent multiple connections
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log("[WS] Already connected")
      return
    }

    this.detectionListeners.push(onDetections)
    this.listeners.push(onStats)

    const wsUrl = this.getWebSocketUrl()
    console.log(`[WS] Connecting to ${wsUrl}`)
    
    this.ws = new WebSocket(wsUrl)

    this.ws.onopen = () => {
      console.log("[WS] ✓ Connected successfully")
      this.reconnectAttempts = 0 // Reset on successful connection
    }

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        // Handle ping/pong
        if (data.type === 'ping') {
          return
        }
        
        if (data.error) {
          console.warn("[WS] Server error:", data.error)
          return
        }
        
        if (data.detections) {
          const detections = data.detections

          this.detectionListeners.forEach((listener) => listener(detections))

          // Jika tidak ada orang → paksa reset semua ke 0
          if (detections.length === 0) {
            const emptyStats = {
              maleCount: 0,
              femaleCount: 0,
              totalCount: 0,
              fps: data.fps ?? 0,
            }
            this.listeners.forEach((listener) => listener(emptyStats))
            return
          }
        }

        if (data.stats) {
          const normalized = {
            maleCount: data.stats.current_male ?? 0,
            femaleCount: data.stats.current_female ?? 0,
            totalCount: data.stats.current_count ?? 0,
            fps: data.fps ?? 0,
          }

          this.listeners.forEach((listener) => listener(normalized))
        }

      } catch (err) {
        console.error("[WS] Failed to parse message:", err)
      }
    }

    this.ws.onerror = (error) => {
      console.error("[WS] ❌ Connection error:", error)
    }

    this.ws.onclose = () => {
      console.log("[WS] Connection closed")
      this.ws = null
      
      // Auto-reconnect with exponential backoff
      if (this.detectionListeners.length > 0 && this.reconnectAttempts < this.maxReconnectAttempts) {
        const delay = Math.pow(2, this.reconnectAttempts) * 1000 // 1s, 2s, 4s, 8s, 16s
        this.reconnectAttempts++
        console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
        setTimeout(() => {
          this.connectWebSocket(onDetections, onStats)
        }, delay)
      } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error("[WS] ❌ Max reconnection attempts reached. Please refresh the page or check if backend is running.")
      }
    }
  }

  // ============================
  // SEND FRAME TO BACKEND VIA WEBSOCKET
  // ============================
  sendFrame(frameData: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(frameData)
    } else {
      console.warn("[WS] Cannot send frame: WebSocket not connected")
    }
  }

  // ============================
  // CHECK CONNECTION STATUS
  // ============================
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }

  // ============================
  // DISCONNECT
  // ============================
  disconnect(): void {
    if (this.ws) {
      console.log("[WS] Disconnecting...")
      this.ws.close()
      this.ws = null
    }
    this.listeners = []
    this.detectionListeners = []
    this.reconnectAttempts = 0
  }
}

export const detectionClient = new DetectionClient()