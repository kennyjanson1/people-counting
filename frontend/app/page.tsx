"use client"

import { useState } from "react"
import VideoInputSelector from "@/components/video-input-selector"
import LiveAnalytics from "@/components/live-analytics"
import PhotoUpload from "@/components/photo-upload"

export default function Home() {
  const [selectedMode, setSelectedMode] = useState<"webcam" | "upload" | "photo" | null>(null)

  const handleBack = () => {
    setSelectedMode(null)
  }

  if (!selectedMode) {
    return <VideoInputSelector onSelect={setSelectedMode} />
  }

  return (
    <div>
      {selectedMode === "photo" && <PhotoUpload />}
      {selectedMode === "webcam" && <LiveAnalytics inputType="webcam" onBack={handleBack} />}
      {selectedMode === "upload" && <LiveAnalytics inputType="upload" onBack={handleBack} />}
    </div>
  )
}