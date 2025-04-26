"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { createClient } from "@supabase/supabase-js"

// Define types for our game state
type GameState = {
  coins: number
  ores: Record<string, number>
  specialResources: Record<string, number>
  craftedItems: Record<string, number>
  equipment: Record<string, string>
  upgrades: Record<string, number>
  workers: Record<string, number>
  currentLocation: string
  unlockedLocations: string[]
  unlockedRecipes: string[]
  unlockedExpeditions: string[]
  activeExpeditions: Record<string, any>
  completedResearch: string[]
  completedAchievements: string[]
  prestigeMultiplier: number
  pendingPrestigeMultiplier: number
  energy: number
  maxEnergy: number
  energyRegenRate: number
  lastEnergyRegen: string
  activeBoosts: any[]
  stats: {
    totalOresMined: number
    totalClicks: number
    playTime: number
  }
  miningProgress?: number
}

// Define the shape of our context
type GameContextType = {
  gameState: GameState | null
  loading: boolean
  error: Error | null
  user: { id: string; email: string } | null
  updateGameState: (updates: Partial<GameState>) => void
}

// Create the context with default values
const GameContext = createContext<GameContextType>({
  gameState: null,
  loading: true,
  error: null,
  user: null,
  updateGameState: () => {},
})

// Hook to use the game context
export const useGameContext = () => useContext(GameContext)

// Provider component
export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
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

  // Function to update game state
  const updateGameState = (updates: Partial<GameState>) => {
    setGameState((prevState) => {
      if (!prevState) return updates as GameState
      return { ...prevState, ...updates }
    })
  }

  // Load user and game state on mount
  useEffect(() => {
    const loadUserAndGameState = async () => {
      try {
        setLoading(true)

        // Get current session
        const { data: sessionData } = await supabase.auth.getSession()
        const session = sessionData?.session

        if (!session) {
          setLoading(false)
          return
        }

        // Set user
        setUser({
          id: session.user.id,
          email: session.user.email || "",
        })

        // Get game state from database
        const { data: gameStateData, error: gameStateError } = await supabase
          .from("player_game_state")
          .select("*")
          .eq("user_id", session.user.id)
          .single()

        if (gameStateError && gameStateError.code !== "PGRST116") {
          // PGRST116 is "no rows returned" error, which is fine for new users
          throw gameStateError
        }

        if (gameStateData) {
          // Convert snake_case to camelCase for frontend
          const camelCaseGameState: GameState = {
            coins: gameStateData.coins || 0,
            ores: gameStateData.ores || {},
            specialResources: gameStateData.special_resources || {},
            craftedItems: gameStateData.crafted_items || {},
            equipment: gameStateData.equipment || {},
            upgrades: gameStateData.upgrades || {},
            workers: gameStateData.workers || {},
            currentLocation: gameStateData.current_location || "surfaceMine",
            unlockedLocations: gameStateData.unlocked_locations || ["surfaceMine"],
            unlockedRecipes: gameStateData.unlocked_recipes || [],
            unlockedExpeditions: gameStateData.unlocked_expeditions || [],
            activeExpeditions: gameStateData.active_expeditions || {},
            completedResearch: gameStateData.completed_research || [],
            completedAchievements: gameStateData.completed_achievements || [],
            prestigeMultiplier: gameStateData.prestige_multiplier || 1,
            pendingPrestigeMultiplier: gameStateData.pending_prestige_multiplier || 0,
            energy: gameStateData.energy || 100,
            maxEnergy: gameStateData.max_energy || 100,
            energyRegenRate: gameStateData.energy_regen_rate || 1,
            lastEnergyRegen: gameStateData.last_energy_regen || new Date().toISOString(),
            activeBoosts: gameStateData.active_boosts || [],
            stats: gameStateData.stats || { totalOresMined: 0, totalClicks: 0, playTime: 0 },
            miningProgress: gameStateData.mining_progress || 0,
          }

          setGameState(camelCaseGameState)
        } else {
          // Create new game state for new user
          const newGameState: GameState = {
            coins: 0,
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
            energy: 100,
            maxEnergy: 100,
            energyRegenRate: 1,
            lastEnergyRegen: new Date().toISOString(),
            activeBoosts: [],
            stats: { totalOresMined: 0, totalClicks: 0, playTime: 0 },
          }

          // Insert new game state into database
          const { error: insertError } = await supabase.from("player_game_state").insert({
            user_id: session.user.id,
            coins: newGameState.coins,
            ores: newGameState.ores,
            special_resources: newGameState.specialResources,
            crafted_items: newGameState.craftedItems,
            equipment: newGameState.equipment,
            upgrades: newGameState.upgrades,
            workers: newGameState.workers,
            current_location: newGameState.currentLocation,
            unlocked_locations: newGameState.unlockedLocations,
            unlocked_recipes: newGameState.unlockedRecipes,
            unlocked_expeditions: newGameState.unlockedExpeditions,
            active_expeditions: newGameState.activeExpeditions,
            completed_research: newGameState.completedResearch,
            completed_achievements: newGameState.completedAchievements,
            prestige_multiplier: newGameState.prestigeMultiplier,
            pending_prestige_multiplier: newGameState.pendingPrestigeMultiplier,
            energy: newGameState.energy,
            max_energy: newGameState.maxEnergy,
            energy_regen_rate: newGameState.energyRegenRate,
            last_energy_regen: newGameState.lastEnergyRegen,
            active_boosts: newGameState.activeBoosts,
            stats: newGameState.stats,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

          if (insertError) throw insertError

          setGameState(newGameState)
        }
      } catch (err) {
        console.error("Error loading game state:", err)
        setError(err instanceof Error ? err : new Error("Failed to load game state"))
      } finally {
        setLoading(false)
      }
    }

    loadUserAndGameState()

    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        setUser({
          id: session.user.id,
          email: session.user.email || "",
        })
        // Reload game state when user signs in
        loadUserAndGameState()
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        setGameState(null)
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [supabase])

  return (
    <GameContext.Provider
      value={{
        gameState,
        loading,
        error,
        user,
        updateGameState,
      }}
    >
      {children}
    </GameContext.Provider>
  )
}
