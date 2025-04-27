import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"

export async function middleware(request: NextRequest) {
  // Only run on dashboard routes
  if (!request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.next()
  }

  console.log(`Middleware - Processing request for: ${request.nextUrl.pathname}`)

  // Create a response object
  const res = NextResponse.next()

  try {
    // Create the Supabase client
    const supabase = createMiddlewareClient({ req: request, res })

    // Get the session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      console.error("Middleware - Session error:", sessionError.message)
    }

    // Debug session state
    console.log("Middleware - Session check:", {
      path: request.nextUrl.pathname,
      hasSession: !!session,
      sessionExpiry: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
      userId: session?.user?.id || null,
    })

    // If no session and trying to access dashboard, redirect to sign in
    if (!session) {
      console.log("Middleware - Redirecting to sign in: No valid session")

      // Store the original URL to redirect back after sign-in
      const redirectUrl = new URL("/signin", request.url)
      redirectUrl.searchParams.set("redirect", request.nextUrl.pathname)

      return NextResponse.redirect(redirectUrl)
    }

    // Add session user to response headers for client-side access
    if (session?.user) {
      res.headers.set("x-user-id", session.user.id)
    }

    return res
  } catch (error) {
    console.error("Middleware - Unexpected error:", error instanceof Error ? error.message : "Unknown error")

    // Redirect to sign in on error
    const redirectUrl = new URL("/signin", request.url)
    return NextResponse.redirect(redirectUrl)
  }
}

// Only run middleware on dashboard routes
export const config = {
  matcher: ["/dashboard/:path*"],
}
