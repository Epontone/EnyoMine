"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OreDisplay } from "@/components/ore-display"
import { StatsDisplay } from "@/components/stats-display"
import { UpgradeShop } from "@/components/upgrade-shop"
import { LocationSelector } from "@/components/location-selector"
import { CraftingStation } from "@/components/crafting-station"
import { ExpeditionsPanel } from "@/components/expeditions-panel"
import { ResearchTree } from "@/components/research-tree"
import { AchievementsPanel } from "@/components/achievements-panel"
import { PrestigePanel } from "@/components/prestige-panel"
import { WorkersPanel } from "@/components/workers-panel"
import { useGameContext } from "@/components/game-provider"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/hooks/use-toast"
import { LogOut, Loader2, Pickaxe, Info } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"

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

export default function GameInterface() {
  const { gameState, loading, error, user, updateGameState } = useGameContext()
  const { toast, dismiss } = useToast()
  const [activeTab, setActiveTab] = useState("mine")
  const [isSaving, setIsSaving] = useState(false)
  const [miningProgress, setMiningProgress] = useState(0)
  const [isMining, setIsMining] = useState(false)
  const [clicksToFill, setClicksToFill] = useState(10) // Default clicks needed
  const [progressPerClick, setProgressPerClick] = useState(10) // Default progress per click
  const router = useRouter()
  const supabase = createBrowserClient()
  const progressRef = useRef(miningProgress)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  // Function to save game state with direct Supabase call
  const saveToDatabase = async (showToasts = false) => {
    if (!gameState || !user?.id) return { success: false }

    setIsSaving(true)
    let toastId
    if (showToasts) {
      toastId = toast({
        title: "Saving...",
        description: "Saving your game progress to the database.",
      }).id
    }

    try {
      // Convert camelCase to snake_case for database
      const dbState = {
        user_id: user.id,
        coins: gameState.coins,
        ores: gameState.ores,
        special_resources: gameState.specialResources || {},
        crafted_items: gameState.craftedItems || {},
        equipment: gameState.equipment || {},
        upgrades: gameState.upgrades || {},
        workers: gameState.workers || {},
        current_location: gameState.currentLocation || "surfaceMine",
        unlocked_locations: gameState.unlockedLocations || ["surfaceMine"],
        unlocked_recipes: gameState.unlockedRecipes || [],
        unlocked_expeditions: gameState.unlockedExpeditions || [],
        active_expeditions: gameState.activeExpeditions || {},
        completed_research: gameState.completedResearch || [],
        completed_achievements: gameState.completedAchievements || [],
        prestige_multiplier: gameState.prestigeMultiplier || 1,
        pending_prestige_multiplier: gameState.pendingPrestigeMultiplier || 0,
        mining_progress: miningProgress,
        energy: gameState.energy || 100,
        max_energy: gameState.maxEnergy || 100,
        energy_regen_rate: gameState.energyRegenRate || 1,
        last_energy_regen: gameState.lastEnergyRegen || new Date().toISOString(),
        active_boosts: gameState.activeBoosts || [],
        stats: gameState.stats || { totalOresMined: 0, totalClicks: 0, playTime: 0 },
        updated_at: new Date().toISOString(),
      }

      // Try up to 3 times with exponential backoff
      let attempt = 0
      const maxAttempts = 3
      let saveSuccess = false
      let saveError = null

      while (attempt < maxAttempts && !saveSuccess) {
        attempt++
        try {
          const { error } = await supabase.from("player_game_state").update(dbState).eq("user_id", user.id)

          if (!error) {
            saveSuccess = true
          } else {
            saveError = error
            // Wait with exponential backoff before retrying
            if (attempt < maxAttempts) {
              await new Promise((resolve) => setTimeout(resolve, 500 * Math.pow(2, attempt - 1)))
            }
          }
        } catch (err) {
          saveError = err
          // Wait with exponential backoff before retrying
          if (attempt < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 500 * Math.pow(2, attempt - 1)))
          }
        }
      }

      if (!saveSuccess) {
        if (showToasts) {
          if (toastId) dismiss(toastId)
          toast({
            title: "Save Failed",
            description: `Failed to save game progress.`,
            variant: "destructive",
          })
        }
        return { success: false }
      }

      if (showToasts) {
        if (toastId) dismiss(toastId)
        toast({
          title: "Save Successful",
          description: "Your game progress has been saved.",
        })
      }

      return { success: true }
    } catch (err) {
      if (showToasts) {
        if (toastId) dismiss(toastId)
        toast({
          title: "Save Failed",
          description: "An unexpected error occurred while saving.",
          variant: "destructive",
        })
      }
      return { success: false }
    } finally {
      setIsSaving(false)
    }
  }

  // Function to complete mining when progress reaches 100%
  const completeMining = useCallback(
    async (pickaxeLevel, oreQuality) => {
      try {
        // Determine which ore to mine based on current location
        const currentLocation = gameState?.currentLocation || "surfaceMine"
        const locationData = {
          surfaceMine: {
            oreDistribution: { stone: 70, copper: 25, iron: 5 },
            specialResources: {},
          },
          // Add other locations as needed
        }[currentLocation] || { oreDistribution: { stone: 100 }, specialResources: {} }

        // Determine which ore was mined
        const rand = Math.random() * 100
        let cumulativeChance = 0
        let minedOre = "stone" // Default to stone

        for (const [ore, chance] of Object.entries(locationData.oreDistribution)) {
          cumulativeChance += chance
          if (rand <= cumulativeChance) {
            minedOre = ore
            break
          }
        }

        // Calculate amount based on upgrades
        const amount = Math.max(1, Math.floor(Math.random() * 2) + 1) * oreQuality * pickaxeLevel

        // Get the latest state from the database
        const { data: latestData } = await supabase
          .from("player_game_state")
          .select("ores, stats")
          .eq("user_id", user?.id)
          .single()

        // Use the latest database state as a base if available
        const baseOres = latestData?.ores || gameState?.ores || {}
        const baseStats = latestData?.stats || gameState?.stats || { totalOresMined: 0, totalClicks: 0, playTime: 0 }

        // Update ores in game state
        const updatedOres = { ...baseOres }
        updatedOres[minedOre] = (updatedOres[minedOre] || 0) + amount

        // Update stats
        const updatedStats = { ...baseStats }
        updatedStats.totalOresMined = (updatedStats.totalOresMined || 0) + amount

        // Update game state
        updateGameState({
          ores: updatedOres,
          stats: updatedStats,
        })

        // Save to database - only save completed mining state (0 or 100)
        await saveToDatabase(false)

        // Show toast notification
        toast({
          title: "Ore Mined!",
          description: `You mined ${amount} ${defaultOreTypes[minedOre]?.name || minedOre}.`,
        })

        // Use a more reliable way to reset progress with a slightly longer delay
        setTimeout(() => {
          setMiningProgress(0)
          setIsMining(false)
        }, 600) // Slightly longer than the transition duration
      } catch (err) {
        console.error("Error completing mining:", err)
        toast({
          title: "Error",
          description: "Failed to complete mining. Please try again.",
          variant: "destructive",
        })
        setIsMining(false)
        setMiningProgress(0) // Reset on error too
      }
    },
    [gameState, user, supabase, updateGameState, toast, saveToDatabase],
  )

  // Calculate mining stats based on player upgrades
  useEffect(() => {
    if (!gameState) return

    // Get upgrade levels
    const pickaxeLevel = gameState.upgrades?.pickaxeLevel || 1
    const miningSpeed = gameState.upgrades?.miningSpeed || 1
    const oreQuality = gameState.upgrades?.oreQuality || 1

    // Calculate progress per click based on upgrades
    // Base progress is 10%, modified by mining speed
    const baseProgressPerClick = 10
    const speedMultiplier = 1 + (miningSpeed - 1) * 0.2 // Each level of mining speed adds 20% to speed
    const calculatedProgressPerClick = Math.min(50, Math.round(baseProgressPerClick * speedMultiplier))

    // Calculate clicks needed to fill the bar
    const calculatedClicksToFill = Math.max(2, Math.ceil(100 / calculatedProgressPerClick))

    setProgressPerClick(calculatedProgressPerClick)
    setClicksToFill(calculatedClicksToFill)
  }, [gameState?.upgrades?.pickaxeLevel, gameState?.upgrades?.miningSpeed, gameState])

  // Handle mining ore with progress bar - Fixed version
  const handleMineOre = useCallback(() => {
    if (!gameState || isMining) return

    try {
      // Get upgrade levels
      const pickaxeLevel = gameState.upgrades?.pickaxeLevel || 1
      const miningSpeed = gameState.upgrades?.miningSpeed || 1
      const oreQuality = gameState.upgrades?.oreQuality || 1

      // Use functional state update with the ref value
      setMiningProgress((prevProgress) => {
        const newProgress = Math.min(100, prevProgress + progressPerClick)
        progressRef.current = newProgress

        // Debug logging
        console.log("Mining click:", {
          currentProgress: prevProgress,
          progressPerClick,
          newProgress,
          pickaxeLevel,
          miningSpeed,
        })

        // Check if the progress bar is filled
        if (newProgress >= 100) {
          // Set mining state to true to prevent additional clicks during completion
          setIsMining(true)
          // Use requestAnimationFrame instead of setTimeout for smoother transitions
          requestAnimationFrame(() => {
            completeMining(pickaxeLevel, oreQuality)
          })
        } else {
          // Save progress to database after each click if not completing
          // Use setTimeout to avoid blocking the UI
          setTimeout(() => {
            updateGameState({
              miningProgress: newProgress,
            })
            saveToDatabase(false)
          }, 0)
        }

        return newProgress
      })

      // Update stats for the click
      const updatedStats = { ...gameState.stats }
      updatedStats.totalClicks = (updatedStats.totalClicks || 0) + 1

      // Update game state with the click stats
      updateGameState({
        stats: updatedStats,
      })
    } catch (err) {
      console.error("Mining error:", err)
      toast({
        title: "Error",
        description: "Failed to mine ore. Please try again.",
        variant: "destructive",
      })
    }
  }, [gameState, progressPerClick, isMining, updateGameState, toast, completeMining, saveToDatabase])

  // Handle selling a specific type of ore
  const handleSellOre = async (oreType) => {
    if (!gameState || isSaving) return

    try {
      // First, get the latest state from the database to avoid conflicts
      const { data: latestData } = await supabase
        .from("player_game_state")
        .select("ores, coins")
        .eq("user_id", user.id)
        .single()

      // Use the latest database state as a base if available
      const baseOres = latestData?.ores || gameState.ores
      const baseCoins = latestData?.coins || gameState.coins

      // Get the amount of ore and calculate its value
      const oreAmount = baseOres[oreType] || 0
      if (oreAmount <= 0) return

      const oreValue = defaultOreTypes[oreType]?.baseValue || 1
      const valueMultiplier = 1 // You can adjust this based on upgrades or location
      const totalValue = Math.floor(oreAmount * oreValue * valueMultiplier)

      // Show processing toast
      const processingToastId = toast({
        title: "Processing Sale...",
        description: (
          <div className="flex items-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span>Selling your ore and updating your account.</span>
          </div>
        ),
        duration: 10000, // Long duration, will be dismissed manually
      }).id

      // Update ores and coins in local state
      const updatedOres = { ...baseOres }
      updatedOres[oreType] = 0

      // Update game state
      updateGameState({
        ores: updatedOres,
        coins: baseCoins + totalValue,
      })

      // Save to database
      const { success } = await saveToDatabase(false)

      // Dismiss the processing toast
      dismiss(processingToastId)

      if (success) {
        // Show success toast
        toast({
          title: "Ore Sold Successfully",
          description: `Sold ${oreAmount} ${defaultOreTypes[oreType]?.name || oreType} for ${totalValue} coins.`,
        })
      } else {
        // Show error toast
        toast({
          title: "Sale Error",
          description: "Your sale was processed but could not be saved to the database. Please try again.",
          variant: "destructive",
        })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to sell ore. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle selling all ores
  const handleSellAllOres = async () => {
    if (!gameState || isSaving) return

    try {
      // First, get the latest state from the database to avoid conflicts
      const { data: latestData } = await supabase
        .from("player_game_state")
        .select("ores, coins")
        .eq("user_id", user.id)
        .single()

      // Use the latest database state as a base if available
      const baseOres = latestData?.ores || gameState.ores
      const baseCoins = latestData?.coins || gameState.coins

      let totalValue = 0
      const updatedOres = { ...baseOres }
      const valueMultiplier = 1 // You can adjust this based on upgrades or location
      let totalOresSold = 0

      // Calculate total value and reset ore counts
      for (const [oreType, amount] of Object.entries(updatedOres)) {
        if (amount > 0 && defaultOreTypes[oreType]) {
          const oreValue = defaultOreTypes[oreType]?.baseValue || 1
          totalValue += Math.floor(amount * oreValue * valueMultiplier)
          totalOresSold += amount
          updatedOres[oreType] = 0
        }
      }

      if (totalValue <= 0) return

      // Show processing toast
      const processingToastId = toast({
        title: "Processing Sale...",
        description: (
          <div className="flex items-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span>Selling all your ores and updating your account.</span>
          </div>
        ),
        duration: 10000, // Long duration, will be dismissed manually
      }).id

      // Update game state
      updateGameState({
        ores: updatedOres,
        coins: baseCoins + totalValue,
      })

      // Save to database
      const { success } = await saveToDatabase(false)

      // Dismiss the processing toast
      dismiss(processingToastId)

      if (success) {
        // Show success toast
        toast({
          title: "All Ores Sold Successfully",
          description: `Sold ${totalOresSold} ores for ${totalValue} coins.`,
        })
      } else {
        // Show error toast
        toast({
          title: "Sale Error",
          description: "Your sale was processed but could not be saved to the database. Please try again.",
          variant: "destructive",
        })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to sell ores. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Handle upgrade purchase
  const handleUpgradePurchase = async (upgradeType) => {
    if (!gameState || isSaving) return

    try {
      // Calculate cost based on current level
      const currentLevel = gameState.upgrades?.[upgradeType] || 1
      const cost = calculateUpgradeCost(upgradeType, currentLevel)

      // Check if player has enough coins
      if (gameState.coins < cost) {
        toast({
          title: "Not Enough Coins",
          description: `You need ${cost} coins to purchase this upgrade.`,
          variant: "destructive",
        })
        return
      }

      // Show processing toast
      const processingToastId = toast({
        title: "Processing Upgrade...",
        description: (
          <div className="flex items-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span>Upgrading your mining capabilities...</span>
          </div>
        ),
        duration: 10000,
      }).id

      // Update upgrades and coins
      const updatedUpgrades = { ...gameState.upgrades } || {}
      updatedUpgrades[upgradeType] = currentLevel + 1

      // Update game state
      updateGameState({
        upgrades: updatedUpgrades,
        coins: gameState.coins - cost,
      })

      // Save to database
      const { success } = await saveToDatabase(false)

      // Dismiss the processing toast
      dismiss(processingToastId)

      if (success) {
        toast({
          title: "Upgrade Successful",
          description: `Your ${getUpgradeName(upgradeType)} has been upgraded to level ${currentLevel + 1}!`,
        })
      } else {
        toast({
          title: "Upgrade Error",
          description: "Your upgrade could not be completed. Please try again.",
          variant: "destructive",
        })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to purchase upgrade. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Calculate upgrade cost based on type and current level
  const calculateUpgradeCost = (upgradeType, currentLevel) => {
    const baseCosts = {
      pickaxeLevel: 100,
      miningSpeed: 150,
      oreQuality: 200,
      autoMiner: 500,
    }

    const baseMultiplier = 1.5
    const baseCost = baseCosts[upgradeType] || 100

    return Math.floor(baseCost * Math.pow(baseMultiplier, currentLevel - 1))
  }

  // Get upgrade name for display
  const getUpgradeName = (upgradeType) => {
    const names = {
      pickaxeLevel: "Pickaxe Level",
      miningSpeed: "Mining Speed",
      oreQuality: "Ore Quality",
      autoMiner: "Auto Miner",
    }

    return names[upgradeType] || upgradeType
  }

  // Handle equipment purchase
  const handleEquipmentPurchase = async (slot, itemId, cost) => {
    if (!gameState || isSaving) return

    try {
      // Check if player has enough coins
      if (gameState.coins < cost) {
        toast({
          title: "Not Enough Coins",
          description: `You need ${cost} coins to purchase this item.`,
          variant: "destructive",
        })
        return
      }

      // Show processing toast
      const processingToastId = toast({
        title: "Processing Purchase...",
        description: (
          <div className="flex items-center">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span>Purchasing equipment...</span>
          </div>
        ),
        duration: 10000,
      }).id

      // Update equipment and coins
      const updatedEquipment = { ...gameState.equipment } || {}
      updatedEquipment[slot] = itemId

      // Update game state
      updateGameState({
        equipment: updatedEquipment,
        coins: gameState.coins - cost,
      })

      // Save to database
      const { success } = await saveToDatabase(false)

      // Dismiss the processing toast
      dismiss(processingToastId)

      if (success) {
        toast({
          title: "Purchase Successful",
          description: `You have purchased new equipment!`,
        })
      } else {
        toast({
          title: "Purchase Error",
          description: "Your purchase could not be completed. Please try again.",
          variant: "destructive",
        })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to purchase equipment. Please try again.",
        variant: "destructive",
      })
    }
  }

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
    if (gameState?.miningProgress !== undefined && !isMining) {
      console.log("Loading mining progress from gameState:", gameState.miningProgress)
      setMiningProgress(gameState.miningProgress)
      progressRef.current = gameState.miningProgress
    }
  }, [gameState?.miningProgress, isMining])

  // Update the ref whenever miningProgress changes
  useEffect(() => {
    progressRef.current = miningProgress
  }, [miningProgress])

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Idle Mining Game</h1>
        <Button onClick={handleSignOut} variant="outline" className="flex items-center gap-2">
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <OreDisplay
          ores={safeGameState.ores}
          specialResources={safeGameState.specialResources}
          craftedItems={safeGameState.craftedItems}
          oreTypes={defaultOreTypes}
          specialResourceTypes={defaultSpecialResourceTypes}
          valueMultiplier={1}
          onSellOre={handleSellOre}
          onSellAll={handleSellAllOres}
        />
        <StatsDisplay stats={safeGameState.stats} upgrades={safeGameState.upgrades} />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 w-full">
          <TabsTrigger value="mine">Mine</TabsTrigger>
          <TabsTrigger value="upgrades">Upgrades</TabsTrigger>
          <TabsTrigger value="equipment">Equipment</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="crafting">Crafting</TabsTrigger>
          <TabsTrigger value="workers">Workers</TabsTrigger>
          <TabsTrigger value="expeditions">Expeditions</TabsTrigger>
          <TabsTrigger value="research">Research</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="prestige">Prestige</TabsTrigger>
        </TabsList>

        <TabsContent value="mine" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-lg border-2">
              <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
                <CardTitle className="flex items-center gap-2">
                  <Pickaxe className="h-6 w-6" />
                  Mining
                </CardTitle>
                <CardDescription className="text-slate-200">
                  Click to mine ore and fill the progress bar
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="text-center mb-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <p className="text-lg">Mining Stats</p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full p-0">
                            <Info className="h-4 w-4" />
                            <span className="sr-only">Mining info</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Progress per click is determined by your mining speed.</p>
                          <p>Ore amount is determined by pickaxe level and ore quality.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-slate-100 p-3 rounded-lg">
                      <p className="text-sm text-slate-500">Progress Per Click</p>
                      <p className="text-xl font-bold">{progressPerClick}%</p>
                    </div>
                    <div className="bg-slate-100 p-3 rounded-lg">
                      <p className="text-sm text-slate-500">Clicks To Mine</p>
                      <p className="text-xl font-bold">{clicksToFill}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 justify-center mb-2">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Pickaxe className="h-3 w-3" />
                      Pickaxe Lv.{safeGameState.upgrades?.pickaxeLevel || 1}
                    </Badge>
                    <Badge variant="secondary">
                      Mining Speed: {((safeGameState.upgrades?.miningSpeed || 1) - 1) * 20 + 100}%
                    </Badge>
                    <Badge variant="secondary">Ore Quality: x{safeGameState.upgrades?.oreQuality || 1}</Badge>
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
                    indicatorClassName={`bg-gradient-to-r from-amber-500 to-yellow-600 transition-transform duration-150`}
                  />
                </div>

                <Button
                  onClick={handleMineOre}
                  disabled={isSaving || isMining}
                  className="w-full h-16 text-lg font-bold bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white shadow-md transition-all"
                >
                  {isMining ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Mining...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <Pickaxe className="mr-2 h-5 w-5" />
                      Mine Ore
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-2">
              <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
                <CardTitle>Mining Stats</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-100 p-4 rounded-lg">
                      <p className="text-sm text-slate-500">Total Ores Mined</p>
                      <p className="text-2xl font-bold">{safeGameState.stats?.totalOresMined || 0}</p>
                    </div>
                    <div className="bg-slate-100 p-4 rounded-lg">
                      <p className="text-sm text-slate-500">Total Clicks</p>
                      <p className="text-2xl font-bold">{safeGameState.stats?.totalClicks || 0}</p>
                    </div>
                    <div className="bg-slate-100 p-4 rounded-lg">
                      <p className="text-sm text-slate-500">Mining Power</p>
                      <p className="text-2xl font-bold">{safeGameState.upgrades?.pickaxeLevel || 1}</p>
                    </div>
                    <div className="bg-slate-100 p-4 rounded-lg">
                      <p className="text-sm text-slate-500">Coins</p>
                      <p className="text-2xl font-bold">{safeGameState.coins || 0}</p>
                    </div>
                  </div>

                  <div className="bg-slate-100 p-4 rounded-lg">
                    <p className="text-sm text-slate-500 mb-2">Mining Efficiency</p>
                    <div className="flex justify-between items-center">
                      <span>Ores per click:</span>
                      <span className="font-bold">
                        {safeGameState.stats?.totalClicks > 0
                          ? (safeGameState.stats.totalOresMined / safeGameState.stats.totalClicks).toFixed(2)
                          : "0.00"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="upgrades" className="mt-6">
          <UpgradeShop
            upgrades={safeGameState.upgrades}
            coins={safeGameState.coins}
            onPurchase={handleUpgradePurchase}
            calculateCost={calculateUpgradeCost}
          />
        </TabsContent>

        <TabsContent value="equipment" className="mt-6">
          <Card className="shadow-lg border-2">
            <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white">
              <CardTitle>Equipment Shop</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Sample equipment items */}
                <div className="bg-white rounded-lg shadow-md p-4 border border-slate-200">
                  <h3 className="font-bold text-lg mb-1">Basic Pickaxe</h3>
                  <p className="text-sm text-slate-500 mb-2">Mining Power: 1</p>
                  <p className="text-xs mb-4">A simple pickaxe for mining.</p>
                  <Button
                    onClick={() => handleEquipmentPurchase("pickaxe", "basicPickaxe", 0)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    disabled={safeGameState.equipment?.pickaxe === "basicPickaxe"}
                  >
                    {safeGameState.equipment?.pickaxe === "basicPickaxe" ? "Equipped" : "Free"}
                  </Button>
                </div>

                <div className="bg-white rounded-lg shadow-md p-4 border border-slate-200">
                  <h3 className="font-bold text-lg mb-1">Copper Pickaxe</h3>
                  <p className="text-sm text-slate-500 mb-2">Mining Power: 2</p>
                  <p className="text-xs mb-4">A sturdier pickaxe with better mining power.</p>
                  <Button
                    onClick={() => handleEquipmentPurchase("pickaxe", "copperPickaxe", 200)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    disabled={safeGameState.equipment?.pickaxe === "copperPickaxe" || safeGameState.coins < 200}
                  >
                    {safeGameState.equipment?.pickaxe === "copperPickaxe" ? "Equipped" : `Buy for 200 coins`}
                  </Button>
                </div>

                <div className="bg-white rounded-lg shadow-md p-4 border border-slate-200">
                  <h3 className="font-bold text-lg mb-1">Iron Pickaxe</h3>
                  <p className="text-sm text-slate-500 mb-2">Mining Power: 4</p>
                  <p className="text-xs mb-4">A strong pickaxe that can break harder rocks.</p>
                  <Button
                    onClick={() => handleEquipmentPurchase("pickaxe", "ironPickaxe", 1000)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    disabled={safeGameState.equipment?.pickaxe === "ironPickaxe" || safeGameState.coins < 1000}
                  >
                    {safeGameState.equipment?.pickaxe === "ironPickaxe" ? "Equipped" : `Buy for 1,000 coins`}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations" className="mt-6">
          <LocationSelector
            locations={{}}
            unlockedLocations={gameState?.unlockedLocations || []}
            currentLocation={safeGameState.currentLocation}
            coins={safeGameState.coins}
            onChangeLocation={() => {}}
            onUnlockLocation={() => {}}
          />
        </TabsContent>

        <TabsContent value="crafting" className="mt-6">
          <CraftingStation
            recipes={{}}
            unlockedRecipes={gameState?.unlockedRecipes || []}
            ores={safeGameState.ores}
            specialResources={safeGameState.specialResources}
            craftedItems={safeGameState.craftedItems}
            coins={safeGameState.coins}
            onUnlockRecipe={() => {}}
            onCraft={() => {}}
          />
        </TabsContent>

        <TabsContent value="workers" className="mt-6">
          <WorkersPanel
            workers={gameState?.workers || {}}
            workerTypes={{}}
            coins={safeGameState.coins}
            onHire={() => {}}
            workerPowerMultiplier={1}
          />
        </TabsContent>

        <TabsContent value="expeditions" className="mt-6">
          <ExpeditionsPanel
            expeditions={{}}
            unlockedExpeditions={gameState?.unlockedExpeditions || []}
            activeExpeditions={gameState?.activeExpeditions || {}}
            energy={gameState?.energy || 0}
            coins={safeGameState.coins}
            onStartExpedition={() => {}}
            onUnlockExpedition={() => {}}
          />
        </TabsContent>

        <TabsContent value="research" className="mt-6">
          <ResearchTree
            categories={{}}
            completedResearch={gameState?.completedResearch || []}
            coins={safeGameState.coins}
            onResearch={() => {}}
          />
        </TabsContent>

        <TabsContent value="achievements" className="mt-6">
          <AchievementsPanel
            achievements={{}}
            completedAchievements={gameState?.completedAchievements || []}
            stats={safeGameState.stats}
          />
        </TabsContent>

        <TabsContent value="prestige" className="mt-6">
          <PrestigePanel
            ores={safeGameState.ores}
            oreTypes={defaultOreTypes}
            currentMultiplier={gameState?.prestigeMultiplier || 1}
            pendingPoints={gameState?.pendingPrestigeMultiplier || 0}
            onPrestige={() => {}}
          />
        </TabsContent>
      </Tabs>

      <Toaster />
    </div>
  )
}
