"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type AchievementsPanelProps = {
  achievements: Record<string, any>
  completedAchievements: string[]
  stats: {
    totalOresMined: number
    totalClicks: number
    playTime: number
  }
}

export function AchievementsPanel({ achievements, completedAchievements, stats }: AchievementsPanelProps) {
  const defaultAchievements = [
    {
      id: "firstOre",
      name: "First Steps",
      description: "Mine your first ore",
      requirement: stats.totalOresMined >= 1,
    },
    {
      id: "hundredOres",
      name: "Getting Started",
      description: "Mine 100 ores",
      requirement: stats.totalOresMined >= 100,
    },
    {
      id: "thousandOres",
      name: "Dedicated Miner",
      description: "Mine 1,000 ores",
      requirement: stats.totalOresMined >= 1000,
    },
  ]

  return (
    <Card className="shadow-lg border-2">
      <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
        <CardTitle>Achievements</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <p className="text-center text-lg mb-6">Complete achievements to earn rewards!</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {defaultAchievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`bg-white rounded-lg shadow-md p-4 border ${
                completedAchievements.includes(achievement.id) || achievement.requirement
                  ? "border-green-500"
                  : "border-slate-200"
              }`}
            >
              <h3 className="font-bold text-lg mb-1">{achievement.name}</h3>
              <p className="text-xs mb-2">{achievement.description}</p>
              <div className="text-sm text-right">
                {completedAchievements.includes(achievement.id) || achievement.requirement
                  ? "Completed!"
                  : "In Progress"}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
