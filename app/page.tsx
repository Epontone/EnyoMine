"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { createBrowserClient } from "@/lib/supabase"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function Home() {
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createBrowserClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session?.user) {
          router.push("/dashboard")
        } else {
          setIsLoading(false)
        }
      } catch (error) {
        console.error("Error checking auth:", error)
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router, supabase])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-24">
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
    </main>
  )
}
