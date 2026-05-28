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
  has_avatar: boolean
  max_wishlist_followers: number
  required_followers: number
  account_age_days: number
  required_account_age_days: number
}

const MIN_FOLLOWERS_ON_ONE_LIST = 10
const MIN_ACCOUNT_AGE_DAYS      = 3

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

  const [{ data: profile }, { data: wishlists }] = await Promise.all([
    supabase.from("profiles").select("is_creator, avatar_url").eq("id", user.id).single(),
    supabase
      .from("wishlists")
      .select("id, wishlist_followers(count)")
      .eq("user_id", user.id)
      .eq("visibility", "public"),
  ])

  const max_wishlist_followers = (wishlists ?? []).reduce((max, w: any) => {
    const c = w.wishlist_followers?.[0]?.count ?? 0
    return c > max ? c : max
  }, 0)

  const account_age_days = Math.floor(
    (Date.now() - new Date(user.created_at).getTime()) / 86_400_000
  )

  const has_avatar = !!profile?.avatar_url

  return {
    eligible:
      has_avatar &&
      max_wishlist_followers >= MIN_FOLLOWERS_ON_ONE_LIST &&
      account_age_days >= MIN_ACCOUNT_AGE_DAYS,
    is_creator: !!profile?.is_creator,
    has_avatar,
    max_wishlist_followers,
    required_followers: MIN_FOLLOWERS_ON_ONE_LIST,
    account_age_days,
    required_account_age_days: MIN_ACCOUNT_AGE_DAYS,
  }
}

export async function toggleCreatorStatus(enable: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  if (enable) {
    // Re-check eligibility server-side to avoid client bypass.
    const [{ data: profile }, { data: wishlists }] = await Promise.all([
      supabase.from("profiles").select("avatar_url").eq("id", user.id).single(),
      supabase
        .from("wishlists")
        .select("id, wishlist_followers(count)")
        .eq("user_id", user.id)
        .eq("visibility", "public"),
    ])

    if (!profile?.avatar_url) {
      return { error: "Add a profile photo before becoming a Creator." }
    }

    const maxFollowers = (wishlists ?? []).reduce((max, w: any) => {
      const c = w.wishlist_followers?.[0]?.count ?? 0
      return c > max ? c : max
    }, 0)
    if (maxFollowers < MIN_FOLLOWERS_ON_ONE_LIST) {
      return { error: `You need ${MIN_FOLLOWERS_ON_ONE_LIST} followers on at least one public wishlist to become a Creator.` }
    }

    const accountAgeDays = Math.floor(
      (Date.now() - new Date(user.created_at).getTime()) / 86_400_000
    )
    if (accountAgeDays < MIN_ACCOUNT_AGE_DAYS) {
      return { error: `Your account needs to be at least ${MIN_ACCOUNT_AGE_DAYS} days old to become a Creator.` }
    }
  }

  const { error } = await supabase
    .from("profiles")
    .update({ is_creator: enable })
    .eq("id", user.id)

  if (error) return { error: error.message }

  // Activity feed entry — only when turning Creator mode ON.
  // We don't post when turning it off (less noisy).
  if (enable) {
    await supabase.from("activity").insert({
      user_id: user.id,
      type:    "became_creator",
      meta:    {},
    })
  }

  revalidatePath("/inspire")
  revalidatePath("/profile")
  revalidatePath("/activity")
  return { success: true }
}
