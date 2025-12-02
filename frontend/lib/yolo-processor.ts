// Helper functions untuk YOLO processing dan frame handling

export interface FrameData {
  timestamp: number
  frameNumber: number
  detections: Detection[]
}

export interface Detection {
  id: number
  x: number
  y: number
  width: number
  height: number
  confidence: number
  gender: "male" | "female" | "unknown"
  label: string
}

export class YOLOProcessor {
  private canvas: OffscreenCanvas | null = null
  private ctx: OffscreenCanvasRenderingContext2D | null = null

  /**
   * Draw detections on canvas
   */
  drawDetections(canvas: HTMLCanvasElement, detections: Detection[], linePosition: number): void {
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Draw reference line
    ctx.strokeStyle = "#FF0000"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(linePosition, 0)
    ctx.lineTo(linePosition, canvas.height)
    ctx.stroke()

    // Draw detections
    detections.forEach((detection) => {
      const color = detection.gender === "male" ? "#0099FF" : "#FF69B4"

      // Draw bounding box
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.strokeRect(detection.x, detection.y, detection.width, detection.height)

      // Draw label
      ctx.fillStyle = color
      ctx.font = "bold 14px Arial"
      ctx.fillText(`${detection.label} (${detection.id})`, detection.x, detection.y - 5)

      // Draw confidence
      ctx.fillStyle = "rgba(0,0,0,0.7)"
      ctx.fillRect(detection.x, detection.y - 25, 100, 20)
      ctx.fillStyle = "#FFFFFF"
      ctx.font = "12px Arial"
      ctx.fillText(`${(detection.confidence * 100).toFixed(1)}%`, detection.x + 5, detection.y - 10)
    })
  }

  /**
   * Extract frame from video
   */
  async extractFrame(video: HTMLVideoElement, canvas: HTMLCanvasElement): Promise<ImageData | null> {
    try {
      const ctx = canvas.getContext("2d")
      if (!ctx) return null

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      return ctx.getImageData(0, 0, canvas.width, canvas.height)
    } catch (err) {
      console.error("Frame extraction error:", err)
      return null
    }
  }

  /**
   * Calculate centroid dari bounding box
   */
  calculateCentroid(x: number, y: number, width: number, height: number): [number, number] {
    return [x + width / 2, y + height / 2]
  }

  /**
   * Check if person crossed line
   */
  checkLineCrossing(previousX: number, currentX: number, linePosition: number): "in" | "out" | null {
    if (previousX > linePosition && currentX < linePosition) {
      return "out"
    } else if (previousX < linePosition && currentX > linePosition) {
      return "in"
    }
    return null
  }

  /**
   * Calculate distance between two points (untuk centroid tracking)
   */
  calculateDistance(point1: [number, number], point2: [number, number]): number {
    const dx = point1[0] - point2[0]
    const dy = point1[1] - point2[1]
    return Math.sqrt(dx * dx + dy * dy)
  }

  /**
   * Parse detection response dari backend
   */
  parseDetectionResponse(data: any): FrameData {
    return {
      timestamp: data.timestamp || Date.now(),
      frameNumber: data.frameNumber || 0,
      detections: data.detections || [],
    }
  }
}

export const yoloProcessor = new YOLOProcessor()
