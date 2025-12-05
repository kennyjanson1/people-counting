"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, User } from "lucide-react"

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
        {/* Total People Card */}
        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium">Total People</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">{stats.totalCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Detected in current frame
            </p>
          </CardContent>
        </Card>

        {/* Male and Female Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-blue-200 dark:border-blue-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4" />
                Male
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {stats.maleCount}
              </div>
            </CardContent>
          </Card>

          <Card className="border-pink-200 dark:border-pink-900">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="h-4 w-4" />
                Female
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-pink-600 dark:text-pink-400">
                {stats.femaleCount}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gender Distribution
        <Card className="bg-muted/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Gender Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.totalCount > 0 ? (
              <>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Male</span>
                    <span className="font-medium">
                      {((stats.maleCount / stats.totalCount) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{
                        width: `${(stats.maleCount / stats.totalCount) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Female</span>
                    <span className="font-medium">
                      {((stats.femaleCount / stats.totalCount) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-pink-500"
                      style={{
                        width: `${(stats.femaleCount / stats.totalCount) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-2">
                No people detected
              </p>
            )}
          </CardContent>
        </Card> */}

        {/* FPS Card */}
        {fps !== undefined && (
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Processing Speed</span>
                <span className="text-lg font-bold text-primary">{fps.toFixed(1)} FPS</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}