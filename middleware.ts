import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"

export async function middleware(request: NextRequest) {
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

    // Check if the path is a protected route
    const isProtectedRoute = request.nextUrl.pathname.startsWith("/dashboard")

    // If no session and trying to access protected route, redirect to sign in
    if (isProtectedRoute && !session) {
      console.log("Middleware - Redirecting to sign in: No valid session")

      // Store the original URL to redirect back after sign-in
      const redirectUrl = new URL("/signin", request.url)
      redirectUrl.searchParams.set("redirect", request.nextUrl.pathname)

      return NextResponse.redirect(redirectUrl)
    }

    // If there is a session but accessing auth routes, redirect to dashboard
    const isAuthRoute =
      request.nextUrl.pathname.startsWith("/signin") ||
      request.nextUrl.pathname.startsWith("/signup") ||
      request.nextUrl.pathname === "/"

    if (isAuthRoute && session) {
      console.log("Middleware - Redirecting to dashboard: User already authenticated")
      return NextResponse.redirect(new URL("/dashboard", request.url))
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

// Run middleware on all routes
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
}
