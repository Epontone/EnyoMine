"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { Loader2, AlertCircle } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectPath = searchParams.get("redirect") || "/dashboard"
  const supabase = createBrowserClient()

  // Check if user is already authenticated
  useEffect(() => {
    async function checkAuth() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (session) {
          console.log("User is already authenticated, redirecting to:", redirectPath)
          router.push(redirectPath)
        }
      } catch (err) {
        console.error("Error checking authentication:", err)
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkAuth()
  }, [router, redirectPath, supabase])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Basic validation
    if (!email.trim()) {
      setError("Email is required")
      setIsLoading(false)
      return
    }

    if (!password) {
      setError("Password is required")
      setIsLoading(false)
      return
    }

    try {
      console.log("Starting sign-in process...")
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        console.error("Sign-in failed:", signInError)
        setError(signInError.message || "Authentication failed. Please check your credentials and try again.")
        setIsLoading(false)
        return
      }

      if (!data.session || !data.user) {
        setError("Authentication successful but session data is missing")
        setIsLoading(false)
        return
      }

      // Successful sign-in
      console.log("Sign-in successful, user ID:", data.user.id)
      console.log("Redirecting to:", redirectPath)

      // Force a hard navigation to ensure the session is picked up
      window.location.href = redirectPath
    } catch (err) {
      console.error("Sign in exception:", err)
      setError(
        err instanceof Error
          ? `Authentication error: ${err.message}`
          : "An unexpected error occurred. Please try again later.",
      )
      setIsLoading(false)
    }
  }

  if (isCheckingAuth) {
    return (
      <div className="flex justify-center items-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Sign In</CardTitle>
          <CardDescription className="text-center">Enter your credentials to access your account</CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4 mr-2" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                disabled={isLoading}
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-2">
          <div className="text-center w-full">
            <Link href="/signup" className="text-sm text-blue-600 hover:underline">
              Don't have an account? Sign Up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
