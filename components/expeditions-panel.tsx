"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type ExpeditionsPanelProps = {
  expeditions: Record<string, any>
  unlockedExpeditions: string[]
  activeExpeditions: Record<string, any>
  energy: number
  coins: number
  onStartExpedition: (expeditionId: string) => void
  onUnlockExpedition: (expeditionId: string, cost: number) => void
}

export function ExpeditionsPanel({
  expeditions,
  unlockedExpeditions,
  activeExpeditions,
  energy,
  coins,
  onStartExpedition,
  onUnlockExpedition,
}: ExpeditionsPanelProps) {
  return (
    <Card className="shadow-lg border-2">
      <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
        <CardTitle>Expeditions</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold">Energy: {energy}/100</h3>
        </div>
        <p className="text-center text-lg mb-6">Send expeditions to discover new resources and locations!</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4 border border-slate-200">
            <h3 className="font-bold text-lg mb-1">Forest Expedition</h3>
            <p className="text-sm text-slate-500 mb-2">Energy Cost: 20</p>
            <p className="text-xs mb-4">Explore the nearby forest for resources.</p>
            {unlockedExpeditions.includes("forestExpedition") ? (
              <Button
                onClick={() => onStartExpedition("forestExpedition")}
                className="w-full"
                disabled={energy < 20 || activeExpeditions["forestExpedition"]}
              >
                {activeExpeditions["forestExpedition"] ? "In Progress" : "Start Expedition"}
              </Button>
            ) : (
              <Button
                onClick={() => onUnlockExpedition("forestExpedition", 1000)}
                className="w-full"
                disabled={coins < 1000}
              >
                Unlock for 1,000 coins
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
