"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Upload, Image as ImageIcon, Loader2 } from "lucide-react"
import { StatsDashboard } from "@/components/stats-dashboard"
import { ThemeToggle } from "@/components/theme-toggle"

interface ImageUploadProps {
  onBack: () => void
}

interface Detection {
  x: number
  y: number
  width: number
  height: number
  confidence: number
  gender: "male" | "female"
  label: string
}

interface AnalysisResult {
  status: string
  total_people: number
  male_count: number
  female_count: number
  detections: Detection[]
}

export default function ImageUpload({ onBack }: ImageUploadProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [zoom, setZoom] = useState(1);


  // Auto-analyze when image is selected
  useEffect(() => {
    if (imageFile && selectedImage) {
      handleAnalyze()
    }
  }, [imageFile, selectedImage])

  // Handle paste from clipboard
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const blob = items[i].getAsFile()
          if (blob) {
            // Convert blob to File
            const file = new File([blob], `pasted-image-${Date.now()}.png`, { type: blob.type })
            
            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
              setError("Image size should be less than 10MB")
              return
            }

            setImageFile(file)
            const reader = new FileReader()
            reader.onload = (e) => {
              setSelectedImage(e.target?.result as string)
              setAnalysisResult(null)
              setError(null)
            }
            reader.readAsDataURL(file)
          }
          e.preventDefault()
          break
        }
      }
    }

    document.addEventListener("paste", handlePaste)
    return () => {
      document.removeEventListener("paste", handlePaste)
    }
  }, [])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file")
        return
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError("Image size should be less than 10MB")
        return
      }

      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string)
        setAnalysisResult(null)
        setError(null)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAnalyze = async () => {
    if (!imageFile) return

    setIsAnalyzing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", imageFile)

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://knnyjnson-people-counting.hf.space"
      const response = await fetch(`${apiUrl}/api/upload-image`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`)
      }

      const data: AnalysisResult = await response.json()

      if (data.status === "success") {
        setAnalysisResult(data)
        // Draw detections after a short delay to ensure image is loaded
        setTimeout(() => drawDetections(data.detections), 100)
      } else {
        setError("Analysis failed. Please try again.")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze image")
      console.error("Analysis error:", err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const drawDetections = (detections: Detection[]) => {
    const canvas = canvasRef.current
    const image = imageRef.current
    if (!canvas || !image || !image.complete) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size to match image display size
    canvas.width = image.width
    canvas.height = image.height

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Calculate scale factors
    const scaleX = image.width / image.naturalWidth
    const scaleY = image.height / image.naturalHeight

    // Draw each detection
    detections.forEach((detection) => {
      const x = detection.x * scaleX
      const y = detection.y * scaleY
      const width = detection.width * scaleX
      const height = detection.height * scaleY

      const color = detection.gender === "male" ? "#0099FF" : "#FF69B4"

      // Draw bounding box
      ctx.strokeStyle = color
      ctx.lineWidth = 3
      ctx.strokeRect(x, y, width, height)

      // Draw label background
      const label = `${detection.label}`
      ctx.font = "bold 16px Arial"
      const textWidth = ctx.measureText(label).width
      
      ctx.fillStyle = "rgba(0,0,0,0.7)"
      ctx.fillRect(x, y - 28, textWidth + 12, 24)

      // Draw label text
      ctx.fillStyle = "#FFFFFF"
      ctx.fillText(label, x + 6, y - 8)

      // Draw confidence
      const confidence = `${(detection.confidence * 100).toFixed(0)}%`
      ctx.font = "bold 14px Arial"
      ctx.fillStyle = color
      ctx.fillText(confidence, x, y + height + 18)
    })
  }

  const handleImageLoad = () => {
    if (analysisResult) {
      drawDetections(analysisResult.detections)
    }
  }

  const handleReset = () => {
    setSelectedImage(null)
    setImageFile(null)
    setAnalysisResult(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="h-screen bg-background p-4 overflow-hidden flex flex-col">
      <div className="max-w-7xl mx-auto w-full flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Photo Analysis</h1>
            <p className="text-muted-foreground">Upload and analyze images with AI detection</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={onBack}>
              <X className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="mb-4 border-destructive bg-destructive/10 flex-shrink-0">
            <CardContent className="pt-6">
              <p className="text-destructive text-sm">{error}</p>
              <Button variant="ghost" size="sm" onClick={() => setError(null)} className="mt-2">
                Dismiss
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Main Content Grid - Fixed Height */}
        <div className="grid lg:grid-cols-3 gap-6 flex-1 min-h-0">
          {/* Image Display */}
          <div className="lg:col-span-2 flex flex-col min-h-0">
            <Card className="overflow-hidden flex flex-col h-full">
              <CardHeader className="flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Image Preview</CardTitle>
                    <CardDescription>
                      {selectedImage ? (
                        isAnalyzing ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Analyzing image...
                          </span>
                        ) : (
                          "Analysis complete"
                        )
                      ) : (
                        "Upload an image to get started"
                      )}
                    </CardDescription>
                  </div>
                  {selectedImage && (
                    <Button variant="outline" size="sm" onClick={handleReset}>
                      Reset
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-0 flex-1 min-h-0 flex flex-col">
                {!selectedImage ? (
                  // Upload Area
                  <div
                    className="relative bg-muted/30 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors flex-1"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium text-foreground mb-2">Click to upload image</p>
                    <p className="text-sm text-muted-foreground">or drag and drop</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      <kbd className="px-2 py-1 text-xs bg-muted rounded border">Ctrl+V</kbd> to paste from clipboard
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Supports: JPG, PNG, WEBP (max 10MB)
                    </p>
                  </div>
                ) : (
                  // Image Display with Canvas Overlay
                  <div className="relative bg-black flex-1 min-h-0 flex items-center justify-center">
                    <div className="relative max-w-full max-h-full">
                      <img
                        ref={imageRef}
                        src={selectedImage}
                        alt="Selected"
                        className="max-w-full max-h-full object-contain"
                        onLoad={handleImageLoad}
                      />
                      <canvas
                        ref={canvasRef}
                        className="absolute inset-0 w-full h-full pointer-events-none"
                      />
                    </div>
                    {isAnalyzing && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="bg-background/95 rounded-lg p-6 flex flex-col items-center gap-3">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          <p className="text-sm font-medium">Analyzing image...</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Stats Dashboard - Fixed Height with Scroll */}
          <div className="flex flex-col gap-6 min-h-0">
            {analysisResult ? (
              <StatsDashboard
                stats={{
                  maleCount: analysisResult.male_count,
                  femaleCount: analysisResult.female_count,
                  totalCount: analysisResult.total_people,
                }}
              />
            ) : (
              <Card className="flex-1">
                <CardHeader>
                  <CardTitle>Statistics</CardTitle>
                  <CardDescription>Upload and analyze an image to see results</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">
                      No analysis yet
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Instructions */}
            <Card className="bg-muted/30 flex-shrink-0">
              <CardHeader>
                <CardTitle className="text-sm">How to use</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground">
                <div className="flex gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-primary font-bold">
                    1
                  </span>
                  <p>Click to upload, drag & drop, or press <kbd className="px-1 py-0.5 text-xs bg-muted rounded border">Ctrl+V</kbd> to paste</p>
                </div>
                <div className="flex gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-primary font-bold">
                    2
                  </span>
                  <p>Image will be analyzed automatically</p>
                </div>
                <div className="flex gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-primary font-bold">
                    3
                  </span>
                  <p>View results with bounding boxes and statistics</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
      </div>
    </div>
  )
}