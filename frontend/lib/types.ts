// Type definitions untuk detection dan tracking
export interface DetectedObject {
  id: number
  x: number
  y: number
  width: number
  height: number
  confidence: number
  gender: "male" | "female" | "unknown"
  class: string
}

export interface DetectionFrame {
  timestamp: number
  objects: DetectedObject[]
  maleCount: number
  femaleCount: number
  totalCount: number
}

export interface Statistics {
  maleIn: number
  maleOut: number
  femaleIn: number
  femaleOut: number
  currentCount: number
  fps: number
  framesProcessed: number
}
