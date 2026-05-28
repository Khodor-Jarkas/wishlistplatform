import { cache } from "react"
import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import WishlistDetail from "@/components/wishlist/WishlistDetail"
import { getDisplayName } from "@/lib/utils"
import type { Wish } from "@/types"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ id: string }>
}

// cache() deduplicates this fetch within a single request: generateMetadata
// and WishlistPage both call it, but the DB is only hit once per page render.
const getWishlist = cache(async (id: string) => {
  const supabase = await createClient()
  return supabase
    .from("wishlists")
    .select("*, profiles!user_id(id, username, first_name, last_name, full_name, avatar_url, is_creator, is_private), wishlist_collaborators(profiles!user_id(id, username, first_name, last_name, full_name, avatar_url))")
    .eq("id", id)
    .single()
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const { data } = await getWishlist(id)

  if (!data || data.visibility === "private") {
    return { title: "Wishlist", robots: { index: false } }
  }

  const profile = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles
  const ownerName = getDisplayName(profile)

  const title = data.title
  const description = data.description
    ? data.description
    : `${ownerName}'s wishlist on Wish It — browse their wishes and reserve a gift.`

  return {
    title,
    description,
    openGraph: {
      title: `${title} · by ${ownerName}`,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · by ${ownerName}`,
      description,
    },
  }
}

export default async function WishlistPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  // Auth + wishlist fetch in parallel — wishlist is served from React cache()
  // if generateMetadata already fetched it in this request.
  const [
    { data: { user } },
    { data: raw, error },
  ] = await Promise.all([
    supabase.auth.getUser(),
    getWishlist(id),
  ])

  if (error) {
    if (error.code === "PGRST116") notFound()
    throw new Error(`Failed to load wishlist: ${error.message}`)
  }
  if (!raw) notFound()

  // Visibility enforcement — private wishlists: owner only
  const isOwner = user?.id === raw.user_id
  if (raw.visibility === "private" && !isOwner) redirect("/")

  // All remaining queries in parallel
  const [
    { count: fc, error: fcErr },
    { data: wishesRaw },
    followResult,
    wishlistsResult,
    myReservationsResult,
    friendshipResult,
  ] = await Promise.all([
    // Follower count
    supabase
      .from("wishlist_followers")
      .select("*", { count: "exact", head: true })
      .eq("wishlist_id", id),

    // Wishes with reservation data — status included to filter bought wishes below
    supabase
      .from("wishes")
      .select("*, reservations(id, reserved_by, status)")
      .eq("wishlist_id", id)
      .order("created_at", { ascending: true }),

    // Follow state (only meaningful for non-owner logged-in users)
    user && !isOwner
      ? supabase
          .from("wishlist_followers")
          .select("wishlist_id")
          .eq("wishlist_id", id)
          .eq("user_id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),

    // Owner's own wishlists (for "Move to another wishlist")
    user
      ? supabase
          .from("wishlists")
          .select("id, title")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: null, error: null }),

    // Current user's reservations in this wishlist — authoritative source for "Reserved by you"
    user && !isOwner
      ? supabase
          .from("reservations")
          .select("wish_id")
          .eq("reserved_by", user.id)
      : Promise.resolve({ data: null, error: null }),

    // Friendship check — used to gate the Reserve button
    user && !isOwner
      ? supabase
          .from("friendships")
          .select("id")
          .or(
            `and(requester_id.eq.${user.id},addressee_id.eq.${raw.user_id}),` +
            `and(requester_id.eq.${raw.user_id},addressee_id.eq.${user.id})`
          )
          .eq("status", "accepted")
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ])

  const follower_count = fcErr ? 0 : (fc ?? 0)
  const isFollowing = !followResult.error && !!followResult.data
  const isFriend = !isOwner && !!friendshipResult.data
  const userWishlists: { id: string; title: string }[] = wishlistsResult.data ?? []

  type ReservationRow = { id: string; reserved_by: string | null; status: string }
  type WishRow = { id: string; reservations: ReservationRow[] | ReservationRow | null; [key: string]: unknown }

  // Build a set of wish IDs reserved by the current user for O(1) lookup
  const myReservedWishIds = new Set(
    (myReservationsResult.data ?? []).map((r: { wish_id: string }) => r.wish_id)
  )

  const wishes: Wish[] = ((wishesRaw ?? []) as WishRow[])
    .filter((w) => {
      const res = w.reservations
      if (!res) return true
      if (Array.isArray(res)) return !res.some((r) => r.status === "bought")
      return (res as ReservationRow).status !== "bought"
    })
    .map((w) => ({
      ...w,
      isReservedByMe: myReservedWishIds.has(w.id),
    } as Wish))

  type CollabProfile = { id: string; username: string | null; first_name: string | null; last_name: string | null; full_name: string | null; avatar_url: string | null }
  type CollabRow = { profiles: CollabProfile | null }
  const collaborators = ((raw.wishlist_collaborators ?? []) as CollabRow[])
    .map((c) => c.profiles)
    .filter((p): p is CollabProfile => p !== null)

  const wishlist = {
    ...raw,
    wish_count: wishes.length,
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
      isFriend={isFriend}
      collaborators={collaborators}
    />
  )
}
