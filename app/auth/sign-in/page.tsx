"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function AuthSignInRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect")

  useEffect(() => {
    const redirectUrl = new URL("/signin", window.location.origin)
    if (redirect) {
      redirectUrl.searchParams.set("redirect", redirect)
    }
    router.replace(redirectUrl.toString())
  }, [router, redirect])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirecting to sign in page...</p>
    </div>
  )
}
