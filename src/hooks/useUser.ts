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

export function useUser(): UserState {
  const [state, setState] = useState<UserState>({ user: null, profile: null, loading: true })

  useEffect(() => {
    const supabase = createClient()

    async function load(userId: string) {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single()
        return data
      } catch {
        return null
      }
    }

    async function init() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        const profile = user ? await load(user.id) : null
        setState({ user, profile, loading: false })
      } catch {
        setState({ user: null, profile: null, loading: false })
      }
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      const user = session?.user ?? null
      const profile = user ? await load(user.id) : null
      setState({ user, profile, loading: false })
    })

    return () => subscription.unsubscribe()
  }, [])

  return state
}
