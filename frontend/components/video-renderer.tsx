"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Detection {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  gender: "male" | "female" | "unknown";
  label: string;
}

interface VideoRendererProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  detections?: Detection[];
  linePosition?: number;
  isProcessing?: boolean;
  fps?: number;
}

export function VideoRenderer({
  videoRef,
  detections = [],
  linePosition,
  isProcessing = false,
  fps = 0,
}: VideoRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [dimensions, setDimensions] = useState({
    width: 640,
    height: 480,
  });

  // ============================
  // LOAD VIDEO SIZE
  // ============================
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDimensions({
        width: video.videoWidth,
        height: video.videoHeight,
      });
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    return () =>
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
  }, [videoRef]);

  // ============================
  // CANVAS RENDERING LOOP
  // ============================
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    // backend frames are 640x480
    const backendWidth = 640;
    const backendHeight = 480;

    const drawFrame = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const scaleX = canvas.width / backendWidth;
      const scaleY = canvas.height / backendHeight;

      // -------------------------
      // DRAW DETECTIONS
      // -------------------------
      detections.forEach((d) => {
        const color = d.gender === "male" ? "#0099FF" : "#FF69B4";

        const x = d.x * scaleX;
        const y = d.y * scaleY;
        const w = d.width * scaleX;
        const h = d.height * scaleY;

        // draw box
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        // label text
        const text = `${d.label} #${d.id}`;
        ctx.font = "bold 14px Arial";
        const textWidth = ctx.measureText(text).width;

        // label background
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(x, y - 20, textWidth + 10, 18);

        // label text
        ctx.fillStyle = "#fff";
        ctx.fillText(text, x + 5, y - 6);

        // confidence
        const conf = `${(d.confidence * 100).toFixed(0)}%`;
        ctx.font = "12px Arial";
        ctx.fillStyle = color;
        ctx.fillText(conf, x, y + h + 14);
      });

      // -------------------------
      // DRAW REFERENCE LINE
      // -------------------------
      if (linePosition !== undefined) {
        const scaledLine = linePosition * scaleX;

        ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(scaledLine, 0);
        ctx.lineTo(scaledLine, dimensions.height);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = "rgba(255,0,0,0.7)";
        ctx.fillRect(scaledLine - 30, 5, 60, 18);

        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 11px Arial";
        ctx.fillText("Reference", scaledLine - 25, 18);
      }

      requestAnimationFrame(drawFrame);
    };

    drawFrame();
  }, [detections, dimensions, linePosition]);

  // ============================
  // RENDER HTML
  // ============================
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
                <span className="text-red-600 dark:text-red-400 font-medium">
                  Live
                </span>
              </div>
            )}
            {fps > 0 && (
              <div className="px-2 py-1 bg-muted rounded text-xs font-medium">
                {fps.toFixed(1)} FPS
              </div>
            )}
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
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
          />
        </div>
      </CardContent>
    </Card>
  );
}
