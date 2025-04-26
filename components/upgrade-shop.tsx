"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type UpgradeShopProps = {
  upgrades: Record<string, number>
  coins: number
  onPurchase: (upgradeType: string, cost: number) => void
  calculateCost: (upgradeType: string, currentLevel: number) => number
}

export function UpgradeShop({ upgrades, coins, onPurchase, calculateCost }: UpgradeShopProps) {
  const upgradeTypes = [
    {
      id: "pickaxeLevel",
      name: "Pickaxe Level",
      description: "Increases mining power",
      icon: "⛏️",
    },
    {
      id: "miningSpeed",
      name: "Mining Speed",
      description: "Increases mining speed",
      icon: "⚡",
    },
    {
      id: "oreQuality",
      name: "Ore Quality",
      description: "Increases ore yield",
      icon: "💎",
    },
  ]

  return (
    <Card className="shadow-lg border-2">
      <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
        <CardTitle>Upgrade Shop</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {upgradeTypes.map((upgrade) => {
            const currentLevel = upgrades[upgrade.id] || 1
            const cost = calculateCost(upgrade.id, currentLevel)

            return (
              <div key={upgrade.id} className="bg-white rounded-lg shadow-md p-4 border border-slate-200">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">{upgrade.icon}</span>
                  <h3 className="font-bold text-lg">{upgrade.name}</h3>
                </div>
                <p className="text-sm text-slate-500 mb-2">Current Level: {currentLevel}</p>
                <p className="text-xs mb-4">{upgrade.description}</p>
                <Button onClick={() => onPurchase(upgrade.id, cost)} className="w-full" disabled={coins < cost}>
                  Upgrade for {cost} coins
                </Button>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
