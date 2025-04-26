"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type ResearchTreeProps = {
  categories: Record<string, any>
  completedResearch: string[]
  coins: number
  onResearch: (researchId: string, cost: number) => void
}

export function ResearchTree({ categories, completedResearch, coins, onResearch }: ResearchTreeProps) {
  return (
    <Card className="shadow-lg border-2">
      <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
        <CardTitle>Research Tree</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <p className="text-center text-lg mb-6">Research new technologies to unlock advanced features!</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4 border border-slate-200">
            <h3 className="font-bold text-lg mb-1">Advanced Mining Techniques</h3>
            <p className="text-sm text-slate-500 mb-2">Cost: 2,000 coins</p>
            <p className="text-xs mb-4">Research better mining methods to increase ore yield.</p>
            <Button
              onClick={() => onResearch("advancedMining", 2000)}
              className="w-full"
              disabled={completedResearch.includes("advancedMining") || coins < 2000}
            >
              {completedResearch.includes("advancedMining") ? "Researched" : "Research"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
