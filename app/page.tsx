"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { createClient } from "@supabase/supabase-js"
import GameInterface from "@/components/game-interface"
import { GameProvider } from "@/components/game-provider"
import Link from "next/link"

export default function Home() {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
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

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          setIsAuthenticated(true)
        } else {
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error("Error checking auth:", error)
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [supabase])

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24">
      {!isAuthenticated ? (
        <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-md mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-center">Deep Rock Mining Empire</h1>
          <p className="text-lg mb-8 text-center">
            Embark on an epic mining adventure. Dig deep, discover rare ores, and build your mining empire!
          </p>
          <div className="flex flex-col w-full gap-4">
            <Button asChild size="lg" className="w-full">
              <Link href="/signup">Create New Account</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full">
              <Link href="/signin">Sign In</Link>
            </Button>
          </div>
        </div>
      ) : (
        <GameProvider>
          <GameInterface />
        </GameProvider>
      )}
    </main>
  )
}
