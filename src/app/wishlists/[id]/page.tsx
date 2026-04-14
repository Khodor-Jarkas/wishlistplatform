import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import WishlistDetail from "@/components/wishlist/WishlistDetail"
import type { Wish } from "@/types"

interface Props {
  params: Promise<{ id: string }>
}

export default async function WishlistPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: raw, error } = await supabase
    .from("wishlists")
    .select("*, profiles!user_id(*), wishes(count)")
    .eq("id", id)
    .single()

  if (error) {
    if (error.code === "PGRST116") notFound()
    throw new Error(`Failed to load wishlist: ${error.message}`)
  }
  if (!raw) notFound()

  // Visibility enforcement — private wishlists: owner only
  const isOwner = user?.id === raw.user_id
  if (raw.visibility === "private" && !isOwner) redirect("/")

  // Follower count
  let follower_count = 0
  const { count: fc, error: fcErr } = await supabase
    .from("wishlist_followers")
    .select("*", { count: "exact", head: true })
    .eq("wishlist_id", id)
  if (!fcErr) follower_count = fc ?? 0

  // Wishes with reservation data
  const { data: wishesRaw } = await supabase
    .from("wishes")
    .select("*, reservations(id, reserved_by)")
    .eq("wishlist_id", id)
    .order("created_at", { ascending: true })

  const wishes: Wish[] = wishesRaw ?? []

  // Follow state
  let isFollowing = false
  if (user && !isOwner) {
    const { data: follow, error: followErr } = await supabase
      .from("wishlist_followers")
      .select("wishlist_id")
      .eq("wishlist_id", id)
      .eq("user_id", user.id)
      .maybeSingle()
    if (!followErr) isFollowing = !!follow
  }

  // Owner's own wishlists (for "Move to another wishlist")
  let userWishlists: { id: string; title: string }[] = []
  if (user) {
    const { data: wl } = await supabase
      .from("wishlists")
      .select("id, title")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
    userWishlists = wl ?? []
  }

  const wishlist = {
    ...raw,
    wish_count:    raw.wishes?.[0]?.count ?? 0,
    follower_count,
  }

  return (
    <WishlistDetail
      wishlist={wishlist}
      wishes={wishes}
      isOwner={isOwner}
      isFollowing={isFollowing}
      currentUserId={user?.id ?? null}
      userWishlists={userWishlists}
    />
  )
}
