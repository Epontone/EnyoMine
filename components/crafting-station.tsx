"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type CraftingStationProps = {
  recipes: Record<string, any>
  unlockedRecipes: string[]
  ores: Record<string, number>
  specialResources: Record<string, number>
  craftedItems: Record<string, number>
  coins: number
  onUnlockRecipe: (recipeId: string, cost: number) => void
  onCraft: (recipeId: string) => void
}

export function CraftingStation({
  recipes,
  unlockedRecipes,
  ores,
  specialResources,
  craftedItems,
  coins,
  onUnlockRecipe,
  onCraft,
}: CraftingStationProps) {
  return (
    <Card className="shadow-lg border-2">
      <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
        <CardTitle>Crafting Station</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <p className="text-center text-lg mb-6">Unlock recipes and craft items to enhance your mining abilities!</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4 border border-slate-200">
            <h3 className="font-bold text-lg mb-1">Basic Tool Kit</h3>
            <p className="text-sm text-slate-500 mb-2">Requires: 10 Iron, 5 Copper</p>
            <p className="text-xs mb-4">A set of basic tools to improve mining efficiency.</p>
            {unlockedRecipes.includes("basicToolKit") ? (
              <Button
                onClick={() => onCraft("basicToolKit")}
                className="w-full"
                disabled={ores.iron < 10 || ores.copper < 5}
              >
                Craft
              </Button>
            ) : (
              <Button onClick={() => onUnlockRecipe("basicToolKit", 500)} className="w-full" disabled={coins < 500}>
                Unlock for 500 coins
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
