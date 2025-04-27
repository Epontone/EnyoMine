"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@/lib/supabase"
import GameInterface from "@/components/game-interface"
import { GameProvider } from "@/components/game-provider"

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createBrowserClient()

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push("/signin")
      }
    }

    checkAuth()
  }, [router, supabase])

  return (
    <GameProvider>
      <GameInterface />
    </GameProvider>
  )
}
