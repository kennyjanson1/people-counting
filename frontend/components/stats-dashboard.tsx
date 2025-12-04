"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Users } from "lucide-react"

interface StatsDashboardProps {
  stats: {
    maleCount: number
    femaleCount: number
    totalCount: number
  }
  fps?: number
}

export function StatsDashboard({ stats, fps }: StatsDashboardProps) {
  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-1 gap-4">
        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total People (current frame)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalCount}</div>
            <p className="text-xs text-muted-foreground">Number of detected people in current frame</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Male</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.maleCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Female</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pink-600">{stats.femaleCount}</div>
            </CardContent>
          </Card>
        </div>

        {fps !== undefined && (
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Processing Speed</span>
                <span className="text-sm font-bold text-primary">{fps.toFixed(1)} FPS</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
