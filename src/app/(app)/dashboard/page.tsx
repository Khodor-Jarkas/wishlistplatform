import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import DashboardClient from "./DashboardClient"
import { getInitials } from "@/lib/utils"
import type { WishlistWithCounts } from "@/components/wishlist/WishlistCard"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/")

  const [profileRes, wishlistsRes, followedRes, friendRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("wishlists")
      .select("*, wishes(count), wishlist_followers(count)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("wishlist_followers")
      .select("wishlists(*, profiles!user_id(username, first_name, last_name), wishes(count))")
      .eq("user_id", user.id),
    supabase.from("friendships")
      .select("*", { count: "exact", head: true })
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .eq("status", "accepted"),
  ])

  const profile = profileRes.data

  const wishlists: WishlistWithCounts[] = (wishlistsRes.data ?? []).map((w: any) => ({
    ...w,
    wish_count: w.wishes?.[0]?.count ?? 0,
    follower_count: w.wishlist_followers?.[0]?.count ?? 0,
  }))

  const followedLists: WishlistWithCounts[] = (followedRes.data ?? [])
    .map((f: any) => f.wishlists)
    .filter(Boolean)
    .map((w: any) => ({
      ...w,
      wish_count: w.wishes?.[0]?.count ?? 0,
      follower_count: 0,
    }))

  const initials = getInitials(profile ?? {})

  const displayName = profile?.first_name
    ? `${profile.first_name} ${profile.last_name ?? ""}`.trim()
    : profile?.full_name ?? profile?.username ?? "User"

  const totalWishes = wishlists.reduce((sum, w) => sum + w.wish_count, 0)

  return (
    <DashboardClient
      wishlists={wishlists}
      followedLists={followedLists}
      friendCount={friendRes.count ?? 0}
      initials={initials}
      displayName={displayName}
      avatarUrl={profile?.avatar_url}
      totalWishes={totalWishes}
    />
  )
}
