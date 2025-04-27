"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AuthSignUpRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/signup")
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirecting to sign up page...</p>
    </div>
  )
}
