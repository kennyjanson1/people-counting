"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Users } from "lucide-react"

interface StatsDashboardProps {
  stats: {
    maleIn: number
    maleOut: number
    femaleIn: number
    femaleOut: number
    currentCount: number
  }
  fps?: number
}

export function StatsDashboard({ stats, fps }: StatsDashboardProps) {
  const totalIn = stats.maleIn + stats.femaleIn
  const totalOut = stats.maleOut + stats.femaleOut
  const netCount = totalIn - totalOut

  return (
    <div className="grid gap-4">
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Entry */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entry</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{totalIn}</div>
            <p className="text-xs text-muted-foreground">People entered the zone</p>
          </CardContent>
        </Card>

        {/* Total Exit */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Exit</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{totalOut}</div>
            <p className="text-xs text-muted-foreground">People left the zone</p>
          </CardContent>
        </Card>

        {/* Current Count */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Count</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.currentCount}</div>
            <p className="text-xs text-muted-foreground">People in zone (net: {netCount})</p>
          </CardContent>
        </Card>
      </div>

      {/* Gender Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Male Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Male Statistics</CardTitle>
            <CardDescription>Entry & Exit counts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Entry</span>
              <span className="text-2xl font-bold text-blue-600">{stats.maleIn}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${Math.min((stats.maleIn / (totalIn || 1)) * 100, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Exit</span>
              <span className="text-2xl font-bold text-orange-600">{stats.maleOut}</span>
            </div>
          </CardContent>
        </Card>

        {/* Female Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Female Statistics</CardTitle>
            <CardDescription>Entry & Exit counts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Entry</span>
              <span className="text-2xl font-bold text-pink-600">{stats.femaleIn}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-pink-600 h-2 rounded-full transition-all"
                style={{ width: `${Math.min((stats.femaleIn / (totalIn || 1)) * 100, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Exit</span>
              <span className="text-2xl font-bold text-purple-600">{stats.femaleOut}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FPS Display */}
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
  )
}
