import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import UserProfileClient from "@/components/users/UserProfileClient"
import type { WishlistWithCounts } from "@/components/wishlist/WishlistCard"

interface Props {
  params: Promise<{ username: string }>
}

export default async function UserProfilePage({ params }: Props) {
  const { username } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single()

  if (!profile) notFound()

  const isOwnProfile = user?.id === profile.id

  // Friendship status between viewer and this profile
  let friendship: any = null
  if (user && !isOwnProfile) {
    const { data: f } = await supabase
      .from("friendships")
      .select("*")
      .or(
        `and(requester_id.eq.${user.id},addressee_id.eq.${profile.id}),` +
        `and(requester_id.eq.${profile.id},addressee_id.eq.${user.id})`
      )
      .maybeSingle()
    friendship = f
  }

  // Their visible wishlists
  const visibilities = isOwnProfile
    ? ["public", "hidden", "private"]
    : ["public", "hidden"]

  const { data: wl } = await supabase
    .from("wishlists")
    .select("*, wishes(count)")
    .eq("user_id", profile.id)
    .in("visibility", visibilities)
    .order("created_at", { ascending: false })

  const wishlists: WishlistWithCounts[] = (wl ?? []).map((w: any) => ({
    ...w,
    wish_count:    w.wishes?.[0]?.count ?? 0,
    follower_count: 0,
  }))

  return (
    <UserProfileClient
      profile={profile}
      currentUserId={user?.id ?? null}
      isOwnProfile={isOwnProfile}
      friendship={friendship}
      wishlists={wishlists}
    />
  )
}
