import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import DashboardClient from "./DashboardClient"
import { getInitials, getDisplayName } from "@/lib/utils"
import type { WishlistWithCounts } from "@/components/wishlist/WishlistCard"

type ReservationRow = { status: string }
type WishRow = { id: string; reservations?: ReservationRow[] | ReservationRow | null }
type WishlistRow = {
  id: string
  user_id: string
  title: string
  visibility: string
  [key: string]: unknown
  wishes?: WishRow[]
  wishlist_followers?: { count: number }[]
}
type FollowedRow = { wishlists: WishlistRow | null }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/")

  const [profileRes, wishlistsRes, followedRes, friendRes] = await Promise.all([
    supabase.from("profiles")
      .select("first_name, last_name, full_name, username, avatar_url")
      .eq("id", user.id).single(),
    supabase.from("wishlists")
      .select("*, wishes(id, reservations(status)), wishlist_followers(count)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("wishlist_followers")
      .select("wishlists(*, profiles!user_id(username, first_name, last_name), wishes(id, reservations(status)))")
      .eq("user_id", user.id),
    supabase.from("friendships")
      .select("*", { count: "exact", head: true })
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .eq("status", "accepted"),
  ])

  const profile = profileRes.data

  function countUnboughtWishes(wishes: WishRow[] | undefined): number {
    return (wishes ?? []).filter((wish) => {
      const reservations = Array.isArray(wish.reservations) ? wish.reservations : wish.reservations ? [wish.reservations] : []
      const res = reservations[0]
      return !res || res.status !== "bought"
    }).length
  }

  const wishlists: WishlistWithCounts[] = ((wishlistsRes.data ?? []) as WishlistRow[]).map((w) => ({
    ...w,
    wish_count: countUnboughtWishes(w.wishes),
    follower_count: w.wishlist_followers?.[0]?.count ?? 0,
  } as WishlistWithCounts))

  const followedLists: WishlistWithCounts[] = ((followedRes.data ?? []) as unknown as FollowedRow[])
    .map((f) => f.wishlists)
    .filter((w): w is WishlistRow => w !== null)
    .map((w) => ({
      ...w,
      wish_count: countUnboughtWishes(w.wishes),
      follower_count: 0,
    } as WishlistWithCounts))

  const initials     = getInitials(profile ?? {})
  const displayName  = getDisplayName(profile, "User")

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
