"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Detection {
  id: number
  x: number
  y: number
  width: number
  height: number
  confidence: number
  gender: "male" | "female" | "unknown"
  label: string
}

interface VideoRendererProps {
  videoRef: React.RefObject<HTMLVideoElement>
  detections?: Detection[]
  linePosition?: number
  isProcessing?: boolean
  fps?: number
}

export function VideoRenderer({
  videoRef,
  detections = [],
  linePosition,
  isProcessing = false,
  fps = 0,
}: VideoRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 640, height: 480 })

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      setDimensions({
        width: video.videoWidth,
        height: video.videoHeight,
      })
    }

    video.addEventListener("loadedmetadata", handleLoadedMetadata)
    return () => video.removeEventListener("loadedmetadata", handleLoadedMetadata)
  }, [videoRef])

  useEffect(() => {
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Update canvas dimensions
    canvas.width = dimensions.width
    canvas.height = dimensions.height

    const drawFrame = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw detection boxes
      detections.forEach((detection) => {
        const color = detection.gender === "male" ? "#0099FF" : "#FF69B4"

        // Draw bounding box
        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.strokeRect(detection.x, detection.y, detection.width, detection.height)

        // Draw label background
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
        const labelWidth = 150
        const labelHeight = 24
        ctx.fillRect(detection.x, detection.y - labelHeight - 2, labelWidth, labelHeight)

        // Draw label text
        ctx.fillStyle = "#FFFFFF"
        ctx.font = "bold 12px Arial"
        ctx.fillText(`${detection.label} #${detection.id}`, detection.x + 4, detection.y - 8)

        // Draw confidence
        ctx.fillStyle = color
        ctx.font = "10px Arial"
        ctx.fillText(
          `${(detection.confidence * 100).toFixed(0)}%`,
          detection.x + 4,
          detection.y + detection.height + 12,
        )
      })

      // Draw reference line
      if (linePosition !== undefined) {
        ctx.strokeStyle = "rgba(255, 0, 0, 0.5)"
        ctx.lineWidth = 2
        ctx.setLineDash([5, 5])
        ctx.beginPath()
        ctx.moveTo(linePosition, 0)
        ctx.lineTo(linePosition, dimensions.height)
        ctx.stroke()
        ctx.setLineDash([])

        // Draw line label
        ctx.fillStyle = "rgba(255, 0, 0, 0.7)"
        ctx.fillRect(linePosition - 30, 5, 60, 18)
        ctx.fillStyle = "#FFFFFF"
        ctx.font = "bold 11px Arial"
        ctx.fillText("Reference", linePosition - 28, 17)
      }

      requestAnimationFrame(drawFrame)
    }

    drawFrame()
  }, [detections, dimensions, linePosition])

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Live Feed</CardTitle>
            <CardDescription>Real-time video with AI detection</CardDescription>
          </div>
          <div className="flex gap-2">
            {isProcessing && (
              <div className="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 rounded text-xs">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-600 dark:text-red-400 font-medium">Live</span>
              </div>
            )}
            {fps > 0 && <div className="px-2 py-1 bg-muted rounded text-xs font-medium">{fps.toFixed(1)} FPS</div>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div
          ref={containerRef}
          className="relative bg-black overflow-hidden"
          style={{
            aspectRatio: `${dimensions.width} / ${dimensions.height}`,
          }}
        >
          <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover" />
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        </div>
      </CardContent>
    </Card>
  )
}
