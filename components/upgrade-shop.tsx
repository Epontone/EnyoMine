"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Pickaxe, Zap, Gem, Cog } from "lucide-react"

export function UpgradeShop({ upgrades, coins, onPurchase, calculateCost }) {
  // Upgrade definitions
  const upgradeDefinitions = [
    {
      id: "pickaxeLevel",
      name: "Pickaxe Level",
      description: "Increases mining power per click",
      icon: <Pickaxe className="w-5 h-5" />,
      currentLevel: upgrades.pickaxeLevel || 1,
      effect: `+${upgrades.pickaxeLevel || 1} mining power per click`,
      nextEffect: `+${(upgrades.pickaxeLevel || 1) + 1} mining power per click`,
    },
    {
      id: "miningSpeed",
      name: "Mining Speed",
      description: "Increases mining speed for manual and auto mining",
      icon: <Zap className="w-5 h-5" />,
      currentLevel: upgrades.miningSpeed || 1,
      effect: `+${(((upgrades.miningSpeed || 1) - 1) * 20).toFixed(0)}% mining speed`,
      nextEffect: `+${((upgrades.miningSpeed || 1) * 20).toFixed(0)}% mining speed`,
    },
    {
      id: "oreQuality",
      name: "Ore Quality",
      description: "Increases the amount of ore you get per mining cycle",
      icon: <Gem className="w-5 h-5" />,
      currentLevel: upgrades.oreQuality || 1,
      effect: `x${upgrades.oreQuality || 1} ore per mining cycle`,
      nextEffect: `x${(upgrades.oreQuality || 1) + 1} ore per mining cycle`,
    },
    {
      id: "autoMiner",
      name: "Auto Miner",
      description: "Automatically mines ore over time",
      icon: <Cog className="w-5 h-5" />,
      currentLevel: upgrades.autoMiner || 0,
      effect:
        (upgrades.autoMiner || 0) > 0
          ? `+${((upgrades.autoMiner || 0) * 0.5).toFixed(1)} mining power per second`
          : "Not active",
      nextEffect: `+${(((upgrades.autoMiner || 0) + 1) * 0.5).toFixed(1)} mining power per second`,
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {upgradeDefinitions.map((upgrade) => {
        const cost = calculateCost(upgrade.id, upgrade.currentLevel)
        const canAfford = coins >= cost

        return (
          <Card key={upgrade.id}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                {upgrade.icon} {upgrade.name}
              </CardTitle>
              <CardDescription>{upgrade.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Current Level</span>
                  <span className="font-medium">{upgrade.currentLevel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Current Effect</span>
                  <span className="font-medium">{upgrade.effect}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Next Level Effect</span>
                  <span className="font-medium">{upgrade.nextEffect}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Upgrade Cost</span>
                  <span className="font-medium">{cost} coins</span>
                </div>
                <Button
                  onClick={() => onPurchase(upgrade.id)}
                  className="w-full"
                  disabled={!canAfford}
                  variant={canAfford ? "default" : "outline"}
                >
                  {canAfford ? "Purchase Upgrade" : "Not Enough Coins"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
