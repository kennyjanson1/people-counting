"use client"

import { useState } from "react"
import VideoInputSelector from "@/components/video-input-selector"
import LiveAnalytics from "@/components/live-analytics"
import ImageUpload from "@/components/image-upload"

type ViewMode = "selector" | "webcam" | "upload" | "photo"

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>("selector")

  const handleSelect = (type: "webcam" | "upload" | "photo") => {
    setViewMode(type)
  }

  const handleBack = () => {
    setViewMode("selector")
  }

  return (
    <>
      {viewMode === "selector" && <VideoInputSelector onSelect={handleSelect} />}
      {viewMode === "webcam" && <LiveAnalytics inputType="webcam" onBack={handleBack} />}
      {viewMode === "upload" && <LiveAnalytics inputType="upload" onBack={handleBack} />}
      {viewMode === "photo" && <ImageUpload onBack={handleBack} />}
    </>
  )
}