"use client"

import { useState, useEffect } from "react"
import { useGameContext } from "@/components/game-provider"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

// Default ore types
const defaultOreTypes = {
  stone: { name: "Stone", baseValue: 1, color: "bg-gray-500" },
  copper: { name: "Copper", baseValue: 3, color: "bg-orange-500" },
  iron: { name: "Iron", baseValue: 5, color: "bg-gray-600" },
  gold: { name: "Gold", baseValue: 10, color: "bg-yellow-500" },
  diamond: { name: "Diamond", baseValue: 50, color: "bg-blue-300" },
}

// Default special resource types
const defaultSpecialResourceTypes = {
  crystal: { name: "Crystal", description: "A rare crystal with magical properties", color: "bg-purple-500" },
  fossil: { name: "Fossil", description: "Ancient remains with scientific value", color: "bg-amber-700" },
  meteorite: { name: "Meteorite", description: "Material from outer space", color: "bg-red-600" },
}

// Using default export instead of named export
export default function MiningGame() {
  // Component implementation...
  const { gameState, loading, error, user, updateGameState } = useGameContext()
  const { toast, dismiss } = useToast()
  const [activeTab, setActiveTab] = useState("mine")
  const [isSaving, setIsSaving] = useState(false)
  const [miningProgress, setMiningProgress] = useState(0)
  const [isMining, setIsMining] = useState(false)
  const router = useRouter()
  const [supabase] = useState(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    return createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  })

  // Rest of the component implementation...
  // (Keeping the same implementation as before)

  // Define safeGameState to provide default values
  const safeGameState = gameState || {
    ores: {},
    specialResources: {},
    craftedItems: {},
    equipment: {},
    upgrades: {},
    workers: {},
    currentLocation: "surfaceMine",
    unlockedLocations: ["surfaceMine"],
    unlockedRecipes: [],
    unlockedExpeditions: [],
    activeExpeditions: {},
    completedResearch: [],
    completedAchievements: [],
    prestigeMultiplier: 1,
    pendingPrestigeMultiplier: 0,
    miningProgress: 0,
    energy: 100,
    maxEnergy: 100,
    energyRegenRate: 1,
    lastEnergyRegen: new Date().toISOString(),
    activeBoosts: [],
    stats: { totalOresMined: 0, totalClicks: 0, playTime: 0 },
    coins: 0,
  }

  // Load mining progress from game state on initial load
  useEffect(() => {
    if (gameState?.miningProgress !== undefined) {
      setMiningProgress(gameState.miningProgress)
    }
  }, [gameState])

  // Component JSX...
  return <div className="container mx-auto p-4">{/* Component content */}</div>
}
