"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type OreDisplayProps = {
  ores: Record<string, number>
  specialResources: Record<string, number>
  craftedItems: Record<string, number>
  oreTypes: Record<string, { name: string; baseValue: number; color: string }>
  specialResourceTypes: Record<string, { name: string; description: string; color: string }>
  valueMultiplier: number
  onSellOre: (oreType: string) => void
  onSellAll: () => void
}

export function OreDisplay({
  ores,
  specialResources,
  craftedItems,
  oreTypes,
  specialResourceTypes,
  valueMultiplier,
  onSellOre,
  onSellAll,
}: OreDisplayProps) {
  return (
    <Card className="shadow-lg border-2">
      <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
        <CardTitle>Resources</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div>
            <h3 className="font-bold mb-2">Ores</h3>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(oreTypes).map(([oreType, { name, baseValue, color }]) => (
                <div key={oreType} className="flex justify-between items-center p-2 bg-slate-100 rounded-md">
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded-full ${color} mr-2`}></div>
                    <span>
                      {name}: {ores[oreType] || 0}
                    </span>
                  </div>
                  <Button
                    onClick={() => onSellOre(oreType)}
                    size="sm"
                    variant="outline"
                    disabled={!ores[oreType] || ores[oreType] <= 0}
                  >
                    Sell for {((ores[oreType] || 0) * baseValue * valueMultiplier).toFixed(0)}
                  </Button>
                </div>
              ))}
            </div>
            <Button onClick={onSellAll} className="w-full mt-2" variant="default">
              Sell All Ores
            </Button>
          </div>

          {Object.keys(specialResources).length > 0 && (
            <div>
              <h3 className="font-bold mb-2">Special Resources</h3>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(specialResourceTypes).map(([resourceType, { name, color }]) => {
                  const amount = specialResources[resourceType] || 0
                  if (amount <= 0) return null
                  return (
                    <div key={resourceType} className="flex justify-between items-center p-2 bg-slate-100 rounded-md">
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full ${color} mr-2`}></div>
                        <span>
                          {name}: {amount}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {Object.keys(craftedItems).length > 0 && (
            <div>
              <h3 className="font-bold mb-2">Crafted Items</h3>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(craftedItems).map(([itemId, amount]) => (
                  <div key={itemId} className="flex justify-between items-center p-2 bg-slate-100 rounded-md">
                    <span>
                      {itemId}: {amount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
