import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import WishlistDetail from "@/components/wishlist/WishlistDetail"
import type { Wish } from "@/types"
import type { Metadata } from "next"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from("wishlists")
    .select("title, description, visibility, cover_image_url, profiles!user_id(first_name, last_name, username)")
    .eq("id", id)
    .single()

  if (!data || data.visibility === "private") {
    return { title: "Wishlist", robots: { index: false } }
  }

  const profile = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles
  const ownerName = profile?.first_name
    ? `${profile.first_name} ${profile.last_name ?? ""}`.trim()
    : profile?.username ?? "Someone"

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

  // Auth + wishlist fetch in parallel — neither depends on the other
  const [
    { data: { user } },
    { data: raw, error },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("wishlists").select("*, profiles!user_id(*), wishes(count)").eq("id", id).single(),
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
  ] = await Promise.all([
    // Follower count
    supabase
      .from("wishlist_followers")
      .select("*", { count: "exact", head: true })
      .eq("wishlist_id", id),

    // Wishes with reservation data
    // status column added by migration 010 — selected only after that migration is applied
    supabase
      .from("wishes")
      .select("*, reservations(id, reserved_by)")
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
  ])

  const follower_count = fcErr ? 0 : (fc ?? 0)
  const isFollowing = !followResult.error && !!followResult.data
  const userWishlists: { id: string; title: string }[] = wishlistsResult.data ?? []

  // Build a set of wish IDs reserved by the current user for O(1) lookup
  const myReservedWishIds = new Set((myReservationsResult.data ?? []).map((r: any) => r.wish_id))

  const wishes: Wish[] = (wishesRaw ?? []).map((w: any) => ({
    ...w,
    isReservedByMe: myReservedWishIds.has(w.id),
  }))

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
