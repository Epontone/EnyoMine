"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type PrestigePanelProps = {
  ores: Record<string, number>
  oreTypes: Record<string, { name: string; baseValue: number; color: string }>
  currentMultiplier: number
  pendingPoints: number
  onPrestige: () => void
}

export function PrestigePanel({ ores, oreTypes, currentMultiplier, pendingPoints, onPrestige }: PrestigePanelProps) {
  // Calculate potential prestige points based on current ores
  const calculatePrestigePoints = () => {
    let points = 0
    for (const [oreType, amount] of Object.entries(ores)) {
      const oreValue = oreTypes[oreType]?.baseValue || 1
      points += Math.sqrt(amount * oreValue) / 10
    }
    return Math.floor(points * 10) / 10
  }

  const potentialPoints = calculatePrestigePoints()
  const newMultiplier = currentMultiplier + potentialPoints

  return (
    <Card className="shadow-lg border-2">
      <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
        <CardTitle>Prestige</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="text-center mb-6">
          <p className="text-lg mb-2">Reset your progress to earn permanent multipliers!</p>
          <p className="text-sm text-muted-foreground">Current Multiplier: {currentMultiplier.toFixed(1)}x</p>
        </div>

        <div className="bg-slate-100 p-4 rounded-lg mb-6">
          <div className="flex justify-between mb-2">
            <span>Potential Prestige Points:</span>
            <span className="font-bold">+{potentialPoints.toFixed(1)}</span>
          </div>
          <div className="flex justify-between">
            <span>New Multiplier:</span>
            <span className="font-bold">{newMultiplier.toFixed(1)}x</span>
          </div>
        </div>

        <Button
          onClick={onPrestige}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          disabled={potentialPoints < 0.1}
        >
          Prestige Now
        </Button>

        <div className="mt-4 text-sm text-center text-slate-500">
          Warning: This will reset all your progress except for achievements and prestige multipliers!
        </div>
      </CardContent>
    </Card>
  )
}
