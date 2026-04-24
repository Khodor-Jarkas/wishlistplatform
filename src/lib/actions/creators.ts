"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface CreatorCard {
  id: string
  username: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  bio: string | null
  country: string | null
  public_wishlist_count: number
  follower_count: number
  preview_covers: { id: string; title: string; cover_image_url: string | null; color: string | null }[]
}

export interface CreatorEligibility {
  eligible: boolean
  is_creator: boolean
  public_wishlist_count: number
  has_avatar: boolean
  required_public_wishlists: number
}

const MIN_PUBLIC_WISHLISTS = 2

export async function getCreators(): Promise<CreatorCard[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from("profiles")
    .select(`
      id, username, first_name, last_name, avatar_url, bio, country,
      wishlists!user_id(
        id, title, cover_image_url, color, visibility,
        wishlist_followers(count)
      )
    `)
    .eq("is_creator", true)
    .eq("is_private", false)
    .limit(48)

  const rows = (data ?? []) as any[]

  const cards: CreatorCard[] = rows.map((p) => {
    const publicWishlists = (p.wishlists ?? []).filter((w: any) => w.visibility === "public")
    const follower_count = publicWishlists.reduce(
      (sum: number, w: any) => sum + (w.wishlist_followers?.[0]?.count ?? 0),
      0
    )
    const preview_covers = publicWishlists
      .slice(0, 3)
      .map((w: any) => ({
        id: w.id,
        title: w.title,
        cover_image_url: w.cover_image_url,
        color: w.color ?? null,
      }))

    return {
      id: p.id,
      username: p.username,
      first_name: p.first_name,
      last_name: p.last_name,
      avatar_url: p.avatar_url,
      bio: p.bio,
      country: p.country,
      public_wishlist_count: publicWishlists.length,
      follower_count,
      preview_covers,
    }
  })

  // Hide creators with no public wishlists — they shouldn't appear even if they toggled on.
  return cards
    .filter((c) => c.public_wishlist_count > 0)
    .sort((a, b) =>
      b.follower_count - a.follower_count ||
      b.public_wishlist_count - a.public_wishlist_count
    )
}

export async function getCreatorEligibility(): Promise<CreatorEligibility | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const [{ data: profile }, { count }] = await Promise.all([
    supabase.from("profiles").select("is_creator, avatar_url").eq("id", user.id).single(),
    supabase
      .from("wishlists")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("visibility", "public"),
  ])

  const public_wishlist_count = count ?? 0
  const has_avatar = !!profile?.avatar_url

  return {
    eligible: public_wishlist_count >= MIN_PUBLIC_WISHLISTS && has_avatar,
    is_creator: !!profile?.is_creator,
    public_wishlist_count,
    has_avatar,
    required_public_wishlists: MIN_PUBLIC_WISHLISTS,
  }
}

export async function toggleCreatorStatus(enable: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  if (enable) {
    // Re-check eligibility server-side to avoid client bypass.
    const [{ data: profile }, { count }] = await Promise.all([
      supabase.from("profiles").select("avatar_url").eq("id", user.id).single(),
      supabase
        .from("wishlists")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("visibility", "public"),
    ])
    if (!profile?.avatar_url) return { error: "Add a profile photo before becoming a Creator." }
    if ((count ?? 0) < MIN_PUBLIC_WISHLISTS) {
      return { error: `You need ${MIN_PUBLIC_WISHLISTS} public wishlists to become a Creator.` }
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ is_creator: enable })
    .eq("id", user.id)

  if (error) return { error: error.message }

  revalidatePath("/inspire")
  revalidatePath("/profile")
  return { success: true }
}
