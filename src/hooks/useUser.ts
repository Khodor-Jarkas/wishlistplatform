"use client"

import { useEffect, useState } from "react"
import { createClient, withQueryTimeout } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import type { Profile } from "@/types"

interface UserState {
  user: User | null
  profile: (Profile & { first_name?: string; last_name?: string }) | null
  loading: boolean
}

// Module-level cache — survives soft navigations within the same tab session.
let cached: UserState | null = null

// Read the Supabase session synchronously from localStorage so the very first
// render already knows whether the user is logged in. This eliminates the
// logged-out flash on public pages (e.g. /wishlists/[id]) that use the
// client-side Header. Only valid (non-expired) sessions are used.
function readStoredUser(): User | null {
  if (typeof window === "undefined") return null
  try {
    const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const ref  = new URL(url).hostname.split(".")[0]
    const raw  = localStorage.getItem(`sb-${ref}-auth-token`)
    if (!raw) return null
    const data = JSON.parse(raw)
    const exp: number | undefined = data?.expires_at
    if (exp && Date.now() / 1000 >= exp) return null // expired — needs network refresh
    return data?.user ?? null
  } catch {
    return null
  }
}

export function useUser(): UserState {
  const [state, setState] = useState<UserState>(() => {
    if (cached) return cached
    const storedUser = readStoredUser()
    // If we have a valid stored user show logged-in immediately (no loading
    // flash). Effect still re-confirms the session and loads the profile.
    if (storedUser) return { user: storedUser, profile: null, loading: false }
    return { user: null, profile: null, loading: true }
  })

  useEffect(() => {
    const supabase = createClient()

    async function loadProfile(userId: string) {
      try {
        const { data } = await withQueryTimeout(
          supabase.from("profiles").select("*").eq("id", userId).single()
        )
        return data
      } catch {
        return null
      }
    }

    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const sessionUser = session?.user ?? null

        if (sessionUser) {
          // Confirmed session — update state and load profile.
          setState({ user: sessionUser, profile: null, loading: false })
          const profileData = await loadProfile(sessionUser.id)
          const next = { user: sessionUser, profile: profileData, loading: false }
          cached = next
          setState(next)
        } else {
          // getSession() returned null. Only clear loading/user when we had no
          // stored session — if readStoredUser() already gave us a user, keep it
          // and let onAuthStateChange confirm (avoids unmounting open drawers).
          setState((prev) =>
            prev.user ? prev : { user: null, profile: null, loading: false }
          )
        }
      } catch {
        setState((prev) =>
          prev.user ? prev : { user: null, profile: null, loading: false }
        )
      }
    }

    // Always re-run init on mount. If we already had a cached user, init
    // re-confirms it (cheap getSession from cookie) and refreshes the
    // profile in case it changed. Without this, a stale module cache
    // could persist indefinitely.
    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        cached = null
        setState({ user: null, profile: null, loading: false })
        return
      }
      const user = session?.user ?? null
      if (user) {
        const profile = await loadProfile(user.id)
        const next = { user, profile, loading: false }
        cached = next
        setState(next)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return state
}
