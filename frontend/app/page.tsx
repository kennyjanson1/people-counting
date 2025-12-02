"use client"

import { useState } from "react"
import VideoInputSelector from "@/components/video-input-selector"
import LiveAnalytics from "@/components/live-analytics"

export default function Home() {
  const [selectedInput, setSelectedInput] = useState<"webcam" | "upload" | null>(null)

  return (
    <main className="min-h-screen bg-background">
      {!selectedInput ? (
        <VideoInputSelector onSelect={setSelectedInput} />
      ) : (
        <LiveAnalytics inputType={selectedInput} onBack={() => setSelectedInput(null)} />
      )}
    </main>
  )
}
