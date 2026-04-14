"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { WishlistWithCounts } from "@/components/wishlist/WishlistCard"

export function useWishlists(): { wishlists: WishlistWithCounts[]; loading: boolean } {
  const [wishlists, setWishlists] = useState<WishlistWithCounts[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data: raw } = await supabase
        .from("wishlists")
        .select("*, wishes(count), wishlist_followers(count)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      setWishlists(
        (raw ?? []).map((w: any) => ({
          ...w,
          wish_count: w.wishes?.[0]?.count ?? 0,
          follower_count: w.wishlist_followers?.[0]?.count ?? 0,
        }))
      )
      setLoading(false)
    }

    load()
  }, [])

  return { wishlists, loading }
}
