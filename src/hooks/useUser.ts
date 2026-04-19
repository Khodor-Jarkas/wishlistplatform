"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import type { Profile } from "@/types"

interface UserState {
  user: User | null
  profile: (Profile & { first_name?: string; last_name?: string }) | null
  loading: boolean
}

// Module-level cache — survives soft navigations within the same tab session
let cached: UserState | null = null

export function useUser(): UserState {
  const [state, setState] = useState<UserState>(
    cached ?? { user: null, profile: null, loading: true }
  )

  useEffect(() => {
    const supabase = createClient()

    async function loadProfile(userId: string) {
      try {
        const { data } = await supabase.from("profiles").select("*").eq("id", userId).single()
        return data
      } catch {
        return null
      }
    }

    async function init() {
      try {
        // getSession is instant (reads from cookie) — use it for the initial
        // render, then verify with getUser in the background.
        const { data: { session } } = await supabase.auth.getSession()
        const sessionUser = session?.user ?? null

        if (sessionUser) {
          // Start profile fetch immediately — don't wait for getUser
          const [profileData] = await Promise.all([
            loadProfile(sessionUser.id),
          ])
          const next = { user: sessionUser, profile: profileData, loading: false }
          cached = next
          setState(next)
        } else {
          const next = { user: null, profile: null, loading: false }
          cached = next
          setState(next)
        }
      } catch {
        const next = { user: null, profile: null, loading: false }
        cached = next
        setState(next)
      }
    }

    if (!cached) init()

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
