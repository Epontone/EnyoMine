"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type WorkersPanelProps = {
  workers: Record<string, number>
  workerTypes: Record<string, any>
  coins: number
  onHire: (workerType: string, cost: number) => void
  workerPowerMultiplier: number
}

export function WorkersPanel({ workers, workerTypes, coins, onHire, workerPowerMultiplier }: WorkersPanelProps) {
  const defaultWorkerTypes = [
    {
      id: "noviceMiner",
      name: "Novice Miner",
      description: "Mines 1 ore every 10 seconds",
      baseCost: 100,
      costMultiplier: 1.1,
      power: 1,
    },
    {
      id: "experiencedMiner",
      name: "Experienced Miner",
      description: "Mines 5 ores every 10 seconds",
      baseCost: 500,
      costMultiplier: 1.15,
      power: 5,
    },
    {
      id: "masterMiner",
      name: "Master Miner",
      description: "Mines 20 ores every 10 seconds",
      baseCost: 2000,
      costMultiplier: 1.2,
      power: 20,
    },
  ]

  // Calculate cost based on how many of this worker type are already hired
  const calculateWorkerCost = (workerType: string) => {
    const worker = defaultWorkerTypes.find((w) => w.id === workerType)
    if (!worker) return 0

    const count = workers[workerType] || 0
    return Math.floor(worker.baseCost * Math.pow(worker.costMultiplier, count))
  }

  return (
    <Card className="shadow-lg border-2">
      <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
        <CardTitle>Workers</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <p className="text-center text-lg mb-6">Hire workers to mine automatically for you!</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {defaultWorkerTypes.map((worker) => {
            const count = workers[worker.id] || 0
            const cost = calculateWorkerCost(worker.id)

            return (
              <div key={worker.id} className="bg-white rounded-lg shadow-md p-4 border border-slate-200">
                <h3 className="font-bold text-lg mb-1">{worker.name}</h3>
                <p className="text-sm text-slate-500 mb-1">Owned: {count}</p>
                <p className="text-xs mb-4">{worker.description}</p>
                <p className="text-xs mb-2">Power: {(worker.power * workerPowerMultiplier).toFixed(1)} ore/10s</p>
                <Button onClick={() => onHire(worker.id, cost)} className="w-full" disabled={coins < cost}>
                  Hire for {cost} coins
                </Button>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
