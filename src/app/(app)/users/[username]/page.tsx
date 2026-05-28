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

  const [{ data: { user } }, { data: profile }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from("profiles").select("*").eq("username", username).single(),
  ])

  if (!profile) notFound()

  const isOwnProfile = user?.id === profile.id

  // Private profiles: only the owner or accepted friends can view.
  // Non-friends (including logged-out visitors) get a 404.
  if (profile.is_private && !isOwnProfile) {
    if (!user) notFound()
    const { data: friendship } = await supabase
      .from("friendships")
      .select("status")
      .or(
        `and(requester_id.eq.${user.id},addressee_id.eq.${profile.id}),` +
        `and(requester_id.eq.${profile.id},addressee_id.eq.${user.id})`
      )
      .eq("status", "accepted")
      .maybeSingle()
    if (!friendship) notFound()
  }

  const visibilities = isOwnProfile
    ? ["public", "hidden", "private"]
    : ["public", "hidden"]

  const [friendshipRes, { data: wl }] = await Promise.all([
    user && !isOwnProfile
      ? supabase
          .from("friendships")
          .select("id, requester_id, addressee_id, status")
          .or(
            `and(requester_id.eq.${user.id},addressee_id.eq.${profile.id}),` +
            `and(requester_id.eq.${profile.id},addressee_id.eq.${user.id})`
          )
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("wishlists")
      .select("*, wishes(id, reservations(status))")
      .eq("user_id", profile.id)
      .in("visibility", visibilities)
      .order("created_at", { ascending: false }),
  ])

  const friendship = friendshipRes.data

  const wishlists: WishlistWithCounts[] = (wl ?? []).map((w: any) => ({
    ...w,
    wish_count: (w.wishes ?? []).filter((wish: any) => {
      const res = (wish.reservations ?? [])[0]
      return !res || res.status !== "bought"
    }).length,
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
