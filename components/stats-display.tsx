"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type StatsDisplayProps = {
  stats: {
    totalOresMined: number
    totalClicks: number
    playTime: number
  }
  upgrades: Record<string, number>
}

export function StatsDisplay({ stats, upgrades }: StatsDisplayProps) {
  return (
    <Card className="shadow-lg border-2 col-span-2">
      <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
        <CardTitle>Stats</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-100 p-4 rounded-lg">
            <p className="text-sm text-slate-500">Total Ores Mined</p>
            <p className="text-2xl font-bold">{stats?.totalOresMined || 0}</p>
          </div>
          <div className="bg-slate-100 p-4 rounded-lg">
            <p className="text-sm text-slate-500">Total Clicks</p>
            <p className="text-2xl font-bold">{stats?.totalClicks || 0}</p>
          </div>
          <div className="bg-slate-100 p-4 rounded-lg">
            <p className="text-sm text-slate-500">Mining Power</p>
            <p className="text-2xl font-bold">{upgrades?.pickaxeLevel || 1}</p>
          </div>
          <div className="bg-slate-100 p-4 rounded-lg">
            <p className="text-sm text-slate-500">Play Time</p>
            <p className="text-2xl font-bold">{formatTime(stats?.playTime || 0)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  return `${hours}h ${minutes}m ${remainingSeconds}s`
}
