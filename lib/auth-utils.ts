import { createBrowserClient } from "@/lib/supabase"

export async function isAuthenticated(): Promise<boolean> {
  try {
    const supabase = createBrowserClient()
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error("Error checking authentication:", error.message)
      return false
    }

    return !!data.session
  } catch (err) {
    console.error("Exception checking authentication:", err)
    return false
  }
}

export async function signIn(
  email: string,
  password: string,
): Promise<{
  success: boolean
  error: string | null
  userId: string | null
}> {
  try {
    const supabase = createBrowserClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return {
        success: false,
        error: error.message,
        userId: null,
      }
    }

    if (!data.session || !data.user) {
      return {
        success: false,
        error: "Authentication successful but session data is missing",
        userId: null,
      }
    }

    return {
      success: true,
      error: null,
      userId: data.user.id,
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error during sign in",
      userId: null,
    }
  }
}

export async function signOut(): Promise<{
  success: boolean
  error: string | null
}> {
  try {
    const supabase = createBrowserClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      error: null,
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error during sign out",
    }
  }
}
