"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Pickaxe, Gem } from "lucide-react"

export default function MiningGame() {
  // Use state to track mining progress
  const [miningProgress, setMiningProgress] = useState(0)
  const [isMining, setIsMining] = useState(false)
  const [oreCount, setOreCount] = useState(0)
  const [lastMined, setLastMined] = useState("")
  const progressRef = useRef(0)

  // Update ref when state changes to avoid closure issues
  useEffect(() => {
    progressRef.current = miningProgress
  }, [miningProgress])

  // Progress increment per click (can be adjusted based on upgrades)
  const progressPerClick = 10

  // Handle mining click
  const handleMineOre = () => {
    if (isMining) return

    // Increment progress
    setMiningProgress((prevProgress) => {
      const newProgress = Math.min(100, prevProgress + progressPerClick)

      // Check if mining is complete
      if (newProgress >= 100) {
        completeMining()
      }

      return newProgress
    })
  }

  // Handle mining completion
  const completeMining = () => {
    setIsMining(true)

    // Determine which ore was mined
    const ores = ["Stone", "Copper", "Iron", "Gold"]
    const randomOre = ores[Math.floor(Math.random() * ores.length)]

    // Award resources
    setOreCount((prev) => prev + 1)
    setLastMined(randomOre)

    // Reset progress after a delay
    setTimeout(() => {
      setMiningProgress(0)
      setIsMining(false)
    }, 500)
  }

  return (
    <div className="container mx-auto p-4 max-w-md">
      <Card className="shadow-lg border-2">
        <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
          <CardTitle className="flex items-center gap-2">
            <Pickaxe className="h-6 w-6" />
            Mining
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="text-center mb-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-slate-100 p-3 rounded-lg">
                <p className="text-sm text-slate-500">Progress Per Click</p>
                <p className="text-xl font-bold">{progressPerClick}%</p>
              </div>
              <div className="bg-slate-100 p-3 rounded-lg">
                <p className="text-sm text-slate-500">Ores Mined</p>
                <p className="text-xl font-bold">{oreCount}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Mining Progress</span>
              <span>{Math.round(miningProgress)}%</span>
            </div>
            <Progress
              value={miningProgress}
              className="h-4 bg-slate-200"
              indicatorClassName="bg-gradient-to-r from-amber-500 to-yellow-600 transition-transform duration-150"
            />
          </div>

          <Button
            onClick={handleMineOre}
            disabled={isMining}
            className="w-full h-16 text-lg font-bold bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white shadow-md transition-all"
          >
            {isMining ? (
              <div className="flex items-center justify-center">
                <span className="animate-pulse">Mining...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Pickaxe className="mr-2 h-5 w-5" />
                Mine Ore
              </div>
            )}
          </Button>

          {lastMined && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md text-center animate-fade-in">
              <div className="flex items-center justify-center gap-2">
                <Gem className="h-5 w-5 text-green-600" />
                <span>
                  You mined: <strong>{lastMined}</strong>
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
