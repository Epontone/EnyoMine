import { createClient } from "@supabase/supabase-js"
import type { Database } from "./database.types"

// Create a single supabase client for the browser
let browserClient: ReturnType<typeof createClient<Database>> | null = null

export function createBrowserClient() {
  if (browserClient) return browserClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  browserClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  })

  return browserClient
}

// Create a supabase client for server components
let serverClient: ReturnType<typeof createClient<Database>> | null = null

export function createServerClient() {
  if (typeof window !== "undefined") {
    throw new Error("createServerClient should not be called in browser context")
  }

  if (serverClient) return serverClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  serverClient = createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
    },
  })

  return serverClient
}
