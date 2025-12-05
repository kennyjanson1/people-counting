"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UploadCloud, Video, Image } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

interface VideoInputSelectorProps {
  onSelect: (type: "webcam" | "upload" | "photo") => void
}

export default function VideoInputSelector({ onSelect }: VideoInputSelectorProps) {
  const [hoveredCard, setHoveredCard] = useState<"webcam" | "upload" | "photo" | null>(null)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 gap-8">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      {/* Header */}
      <div className="text-center max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-3 text-balance">
          People Counting System
        </h1>
        <p className="text-lg text-muted-foreground text-balance">
          Monitor and analyze people using advanced AI detection
        </p>
      </div>

      {/* Input Selection Cards */}
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl w-full">
        {/* Webcam Card */}
        <Card
          className={`cursor-pointer transition-all duration-300 ${
            hoveredCard === "webcam" ? "border-primary shadow-lg scale-105" : "hover:border-primary/50"
          }`}
          onMouseEnter={() => setHoveredCard("webcam")}
          onMouseLeave={() => setHoveredCard(null)}
          onClick={() => onSelect("webcam")}
        >
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div className="flex-1">
              <CardTitle className="text-xl">Live Webcam</CardTitle>
              <CardDescription className="text-sm">Real-time detection</CardDescription>
            </div>
            <Video className="h-7 w-7 text-primary" />
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                Real-time processing
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                Instant detection
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                Live tracking
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Photo Upload Card */}
        <Card
          className={`cursor-pointer transition-all duration-300 ${
            hoveredCard === "photo" ? "border-primary shadow-lg scale-105" : "hover:border-primary/50"
          }`}
          onMouseEnter={() => setHoveredCard("photo")}
          onMouseLeave={() => setHoveredCard(null)}
          onClick={() => onSelect("photo")}
        >
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div className="flex-1">
              <CardTitle className="text-xl">Upload Photo</CardTitle>
              <CardDescription className="text-sm">Analyze single image</CardDescription>
            </div>
            <Image className="h-7 w-7 text-primary" />
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                Quick analysis
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                Gender detection
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                People counting
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Info Section */}
      <div className="mt-8 max-w-5xl w-full">
        <Card className="bg-muted/30 border-muted">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-foreground mb-3">How it works:</h3>
            <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
              <li>Select your input source (webcam, photo, or video file)</li>
              <li>Our AI model detects and tracks people in real-time</li>
              <li>Gender classification (male/female) is performed automatically</li>
              <li>Get instant statistics about detected people</li>
              <li>View detailed results with bounding boxes and confidence scores</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}