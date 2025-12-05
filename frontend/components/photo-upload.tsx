"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, Image as ImageIcon, Loader2, X } from "lucide-react"
import { StatsDashboard } from "./stats-dashboard"

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

interface Stats {
  current_count: number
  current_male: number
  current_female: number
}

export default function PhotoUpload() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [detections, setDetections] = useState<Detection[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file")
      return
    }

    setError(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string)
      setProcessedImage(null)
      setDetections([])
      setStats(null)
    }
    reader.readAsDataURL(file)
  }

  const processImage = async () => {
    if (!selectedImage) return

    setIsProcessing(true)
    setError(null)

    try {
      // Convert base64 to blob
      const response = await fetch(selectedImage)
      const blob = await response.blob()
      
      // Send to backend
      const formData = new FormData()
      formData.append("file", blob, "photo.jpg")

      const apiResponse = await fetch("http://localhost:5000/api/process-photo", {
        method: "POST",
        body: formData,
      })

      if (!apiResponse.ok) {
        throw new Error("Failed to process image")
      }

      const result = await apiResponse.json()
      console.log("API Response:", result)

      setDetections(result.detections || [])
      setStats({
        current_count: result.stats?.current_count || 0,
        current_male: result.stats?.current_male || 0,
        current_female: result.stats?.current_female || 0,
      })

      // Draw bounding boxes on image
      drawBoundingBoxes(result.detections || [])
    } catch (err) {
      console.error("Error processing image:", err)
      setError("Failed to process image. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const drawBoundingBoxes = (detections: Detection[]) => {
    if (!selectedImage || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const img = new Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      // Draw bounding boxes
      detections.forEach((det) => {
        const color = det.gender === "male" ? "#3B82F6" : "#EC4899"
        
        // Draw rectangle
        ctx.strokeStyle = color
        ctx.lineWidth = 4
        ctx.strokeRect(det.x, det.y, det.width, det.height)

        // Draw label background
        const label = `${det.label} (${(det.confidence * 100).toFixed(0)}%)`
        ctx.font = "bold 16px Arial"
        const textWidth = ctx.measureText(label).width
        ctx.fillStyle = color
        ctx.fillRect(det.x, det.y - 30, textWidth + 10, 25)

        // Draw label text
        ctx.fillStyle = "white"
        ctx.fillText(label, det.x + 5, det.y - 10)
      })

      // Convert canvas to data URL
      setProcessedImage(canvas.toDataURL())
    }
    img.src = selectedImage
  }

  const handleReset = () => {
    setSelectedImage(null)
    setProcessedImage(null)
    setDetections([])
    setStats(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Photo Analysis</h1>
            <p className="text-muted-foreground">Upload a photo to detect and count people</p>
          </div>
          {selectedImage && (
            <Button variant="outline" onClick={handleReset}>
              <X className="mr-2 h-4 w-4" />
              Reset
            </Button>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Image Upload & Display */}
          <div className="lg:col-span-2 space-y-4">
            {/* Upload Area */}
            {!selectedImage && (
              <Card className="border-2 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center cursor-pointer"
                  >
                    <div className="p-4 bg-primary/10 rounded-full mb-4">
                      <ImageIcon className="h-12 w-12 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Upload Photo</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Click to select or drag and drop
                    </p>
                    <Button>
                      <Upload className="mr-2 h-4 w-4" />
                      Select Image
                    </Button>
                  </label>
                </CardContent>
              </Card>
            )}

            {/* Image Display */}
            {selectedImage && (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {processedImage ? "Detection Results" : "Selected Image"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <img
                      src={processedImage || selectedImage}
                      alt="Upload"
                      className="w-full h-auto rounded-lg"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                  
                  {!processedImage && (
                    <div className="mt-4">
                      <Button
                        onClick={processImage}
                        disabled={isProcessing}
                        className="w-full"
                        size="lg"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <ImageIcon className="mr-2 h-5 w-5" />
                            Analyze Photo
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {error && (
                    <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                      {error}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Detection Details */}
            {detections.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Detected People</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {detections.map((det, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              det.gender === "male" ? "bg-blue-500" : "bg-pink-500"
                            }`}
                          />
                          <span className="font-medium">Person {idx + 1}</span>
                          <span
                            className={`text-sm px-2 py-0.5 rounded ${
                              det.gender === "male"
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                : "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300"
                            }`}
                          >
                            {det.label}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {(det.confidence * 100).toFixed(1)}% confidence
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Statistics */}
          <div className="space-y-4">
            {stats ? (
              <StatsDashboard
                stats={{
                  totalCount: stats.current_count,
                  maleCount: stats.current_male,
                  femaleCount: stats.current_female,
                }}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Upload and analyze a photo to see statistics
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Info Card */}
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-base">How it works</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>1. Upload a photo containing people</p>
                <p>2. Click "Analyze Photo" to process</p>
                <p>3. AI detects people and classifies gender</p>
                <p>4. View results with bounding boxes</p>
                <p>5. See detailed statistics on the right</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}