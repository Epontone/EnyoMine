"use client"

import { useState, useEffect } from "react"
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
import { LogOut, Loader2, Pickaxe } from "lucide-react"
import { createClient } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

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

  // Handle mining ore with progress bar
  const handleMineOre = async () => {
    if (!gameState || isSaving || isMining) return

    setIsMining(true)

    try {
      // Calculate mining speed based on upgrades
      const pickaxePower = gameState.upgrades?.pickaxeLevel || 1
      const miningSpeed = gameState.upgrades?.miningSpeed || 1
      const progressIncrement = 5 * (miningSpeed * 0.2 + 0.8)

      // Start the mining progress animation
      let progress = miningProgress
      const miningInterval = setInterval(() => {
        progress += progressIncrement
        if (progress >= 100) {
          progress = 100
          clearInterval(miningInterval)
          completeMining()
        }
        setMiningProgress(progress)
      }, 100)

      // Function to complete mining when progress reaches 100%
      const completeMining = async () => {
        // Determine which ore to mine based on current location
        const currentLocation = gameState.currentLocation || "surfaceMine"
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
        const oreQuality = gameState.upgrades?.oreQuality || 1
        const amount = Math.max(1, Math.floor(Math.random() * 2) + 1) * oreQuality * pickaxePower

        // Get the latest state from the database
        const { data: latestData } = await supabase
          .from("player_game_state")
          .select("ores, stats")
          .eq("user_id", user.id)
          .single()

        // Use the latest database state as a base if available
        const baseOres = latestData?.ores || gameState.ores
        const baseStats = latestData?.stats || gameState.stats

        // Update ores in game state
        const updatedOres = { ...baseOres }
        updatedOres[minedOre] = (updatedOres[minedOre] || 0) + amount

        // Update stats
        const updatedStats = { ...baseStats }
        updatedStats.totalOresMined = (updatedStats.totalOresMined || 0) + amount
        updatedStats.totalClicks = (updatedStats.totalClicks || 0) + 1

        // Update game state
        updateGameState({
          ores: updatedOres,
          stats: updatedStats,
        })

        // Save to database
        await saveToDatabase(false)

        // Show toast notification
        toast({
          title: "Ore Mined!",
          description: `You mined ${amount} ${minedOre.charAt(0).toUpperCase() + minedOre.slice(1)}.`,
        })

        // Reset mining progress after a short delay
        setTimeout(() => {
          setMiningProgress(0)
          setIsMining(false)
        }, 500)
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to mine ore. Please try again.",
        variant: "destructive",
      })
      setIsMining(false)
    }
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
    if (gameState?.miningProgress !== undefined) {
      setMiningProgress(gameState.miningProgress)
    }
  }, [gameState])

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
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="text-center mb-4">
                  <p className="text-lg mb-2">Click to mine ore or let your workers do it automatically!</p>
                  <p className="text-sm text-muted-foreground">
                    Mining power: {safeGameState.upgrades?.pickaxeLevel || 1}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Mining Progress</span>
                    <span>{Math.round(miningProgress)}%</span>
                  </div>
                  <Progress value={miningProgress} className="h-4 bg-slate-200" />
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
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="upgrades" className="mt-6">
          <UpgradeShop
            upgrades={safeGameState.upgrades}
            coins={safeGameState.coins}
            onPurchase={() => {}}
            calculateCost={(upgradeType, currentLevel) => 100 * Math.pow(1.5, currentLevel)}
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
