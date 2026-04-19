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
  // Auth + profile fetch in parallel
  const [{ data: { user } }, { data: profile }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("profiles").select("*").eq("username", username).single(),
  ])

  if (!profile) notFound()

  const isOwnProfile = user?.id === profile.id

  // Friendship + wishlists in parallel (both depend on profile, neither on each other)
  const visibilities = isOwnProfile
    ? ["public", "hidden", "private"]
    : ["public", "hidden"]

  const [friendshipRes, { data: wl }] = await Promise.all([
    user && !isOwnProfile
      ? supabase
          .from("friendships")
          .select("*")
          .or(
            `and(requester_id.eq.${user.id},addressee_id.eq.${profile.id}),` +
            `and(requester_id.eq.${profile.id},addressee_id.eq.${user.id})`
          )
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("wishlists")
      .select("*, wishes(count)")
      .eq("user_id", profile.id)
      .in("visibility", visibilities)
      .order("created_at", { ascending: false }),
  ])

  const friendship = friendshipRes.data

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
