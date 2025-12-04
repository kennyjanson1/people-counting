"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { X } from "lucide-react"
import { processVideoFile, startWebcamStream } from "@/app/actions/video-processing"
import { detectionClient } from "@/lib/detection-client"
import { VideoRenderer } from "@/components/video-renderer"
import { StatsDashboard } from "@/components/stats-dashboard"
import { ThemeToggle } from "@/components/theme-toggle"

interface LiveAnalyticsProps {
  inputType: "webcam" | "upload"
  onBack: () => void
}

interface Stats {
  maleIn: number
  maleOut: number
  femaleIn: number
  femaleOut: number
  currentCount: number
}

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

export default function LiveAnalytics({ inputType, onBack }: LiveAnalyticsProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [stats, setStats] = useState<Stats>({
    maleIn: 0,
    maleOut: 0,
    femaleIn: 0,
    femaleOut: 0,
    currentCount: 0,
  })
  const [detections, setDetections] = useState<Detection[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fps, setFps] = useState(0)
  const [linePosition, setLinePosition] = useState<number | undefined>()

  useEffect(() => {
    const initializeInput = async () => {
      try {
        if (inputType === "webcam") {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          })
          if (videoRef.current) {
            videoRef.current.srcObject = stream
            setIsProcessing(true)

            // Connect to WebSocket for real-time processing
            detectionClient.connectWebSocket(
              (detections) => {
                setDetections(detections)
              },
              (detectionStats) => {
                setStats({
                  maleIn: detectionStats.maleIn,
                  maleOut: detectionStats.maleOut,
                  femaleIn: detectionStats.femaleIn,
                  femaleOut: detectionStats.femaleOut,
                  currentCount: detectionStats.currentCount,
                })
                setFps(detectionStats.fps)
              }
            )

            // Start sending frames to backend
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            const sendFrame = () => {
              if (videoRef.current && ctx && detectionClient) {
                canvas.width = videoRef.current.videoWidth
                canvas.height = videoRef.current.videoHeight
                ctx.drawImage(videoRef.current, 0, 0)
                const frameData = canvas.toDataURL('image/jpeg', 0.8)
                detectionClient.sendFrame(frameData)
                requestAnimationFrame(sendFrame)
              }
            }
            videoRef.current.onloadedmetadata = () => {
              sendFrame()
            }
          }
        } else {
          fileInputRef.current?.click()
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to initialize input")
      }
    }

    initializeInput()

    return () => {
      detectionClient.disconnect()
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [inputType])

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && videoRef.current) {
      const url = URL.createObjectURL(file)
      videoRef.current.src = url
      setIsProcessing(true)

      try {
        const formData = new FormData()
        formData.append("video", file)

        const result = await processVideoFile(formData)

        if (result.success && result.stats) {
          setStats({
            maleIn: result.stats.maleIn,
            maleOut: result.stats.maleOut,
            femaleIn: result.stats.femaleIn,
            femaleOut: result.stats.femaleOut,
            currentCount: result.stats.currentCount,
          })
          setFps(result.stats.fps)
        } else {
          setError(result.error || "Failed to process video")
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to process video")
      } finally {
        setIsProcessing(false)
      }
    }
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Live Analytics</h1>
            <p className="text-muted-foreground">
              {inputType === "webcam" ? "Webcam" : "Video File"} - Real-time Detection
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={onBack}>
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {error && (
          <Card className="mb-6 border-destructive bg-destructive/10">
            <CardContent className="pt-6">
              <p className="text-destructive text-sm">{error}</p>
              <Button variant="ghost" size="sm" onClick={() => setError(null)} className="mt-2">
                Dismiss
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Video Display */}
          <div className="lg:col-span-2">
            <VideoRenderer
              videoRef={videoRef}
              detections={detections}
              linePosition={linePosition}
              isProcessing={isProcessing}
              fps={fps}
            />
          </div>

          {/* Stats Dashboard */}
          <StatsDashboard stats={stats} fps={fps} />
        </div>

        {/* Hidden file input */}
        <input ref={fileInputRef} type="file" accept="video/*,.mp4" onChange={handleVideoUpload} className="hidden" />
      </div>
    </div>
  )
}
