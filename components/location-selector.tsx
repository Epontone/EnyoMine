"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type LocationSelectorProps = {
  locations: Record<string, any>
  unlockedLocations: string[]
  currentLocation: string
  coins: number
  onChangeLocation: (location: string) => void
  onUnlockLocation: (location: string, cost: number) => void
}

export function LocationSelector({
  locations,
  unlockedLocations,
  currentLocation,
  coins,
  onChangeLocation,
  onUnlockLocation,
}: LocationSelectorProps) {
  return (
    <Card className="shadow-lg border-2">
      <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
        <CardTitle>Locations</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4 border border-slate-200">
            <h3 className="font-bold text-lg mb-1">Surface Mine</h3>
            <p className="text-sm text-slate-500 mb-2">Starter Location</p>
            <p className="text-xs mb-4">A basic mining area with common ores.</p>
            <Button
              onClick={() => onChangeLocation("surfaceMine")}
              className="w-full"
              variant={currentLocation === "surfaceMine" ? "default" : "outline"}
              disabled={currentLocation === "surfaceMine"}
            >
              {currentLocation === "surfaceMine" ? "Current Location" : "Travel Here"}
            </Button>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 border border-slate-200">
            <h3 className="font-bold text-lg mb-1">Deep Cave</h3>
            <p className="text-sm text-slate-500 mb-2">Requires 1,000 coins to unlock</p>
            <p className="text-xs mb-4">A deeper location with better ore quality.</p>
            {unlockedLocations.includes("deepCave") ? (
              <Button
                onClick={() => onChangeLocation("deepCave")}
                className="w-full"
                variant={currentLocation === "deepCave" ? "default" : "outline"}
                disabled={currentLocation === "deepCave"}
              >
                {currentLocation === "deepCave" ? "Current Location" : "Travel Here"}
              </Button>
            ) : (
              <Button onClick={() => onUnlockLocation("deepCave", 1000)} className="w-full" disabled={coins < 1000}>
                Unlock for 1,000 coins
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
