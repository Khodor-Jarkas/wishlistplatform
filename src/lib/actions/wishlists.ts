"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { slugify, getDisplayName } from "@/lib/utils"

// ── Create ────────────────────────────────────────────────────────────────────

export async function createWishlist(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/")

  const title = (formData.get("title") as string).trim()
  if (!title) return { error: "Wishlist name is required" }

  // Append a short random suffix to guarantee slug uniqueness
  const slug = slugify(title) + "-" + Date.now().toString(36)

  const { data, error } = await supabase
    .from("wishlists")
    .insert({
      user_id: user.id,
      title,
      slug,
      type: (formData.get("type") as string) || "personal",
      visibility: (formData.get("visibility") as string) || "public",
      description: (formData.get("description") as string) || null,
      occasion: (formData.get("occasion") as string) || null,
      event_date: (formData.get("event_date") as string) || null,
      cover_image_url:   (formData.get("cover_image_url") as string) || null,
      beneficiary_name:  (formData.get("beneficiary_name") as string) || null,
      color:             (formData.get("color") as string) || null,
    })
    .select("id")
    .single()

  if (error) return { error: error.message }

  // ── Parse collaborator IDs ─────────────────────────────────────────────────
  let collaboratorIds: string[] = []
  const rawCollabIds = formData.get("collaborator_ids") as string | null
  if (rawCollabIds) {
    try { collaboratorIds = JSON.parse(rawCollabIds) } catch { /* ignore */ }
  }

  // ── Fetch creator profile (needed for notification meta) ──────────────────
  const { data: creatorProfile } = await supabase
    .from("profiles")
    .select("username, first_name, last_name, full_name")
    .eq("id", user.id)
    .single()

  const creatorName = creatorProfile
    ? getDisplayName(creatorProfile as Parameters<typeof getDisplayName>[0])
    : "Someone"

  // ── Handle collaborators ──────────────────────────────────────────────────
  if (collaboratorIds.length > 0) {
    // Insert rows into wishlist_collaborators
    await supabase.from("wishlist_collaborators").insert(
      collaboratorIds.map((uid) => ({ wishlist_id: data.id, user_id: uid }))
    )

    // Fetch collaborator profiles for names/usernames in meta
    const { data: collabProfiles } = await supabase
      .from("profiles")
      .select("id, username, first_name, last_name, full_name")
      .in("id", collaboratorIds)

    // Build lookup maps stored in activity meta so the feed can render names
    // without extra queries.  Key = user id.
    const collabNames: Record<string, string>    = {}
    const collabUsernames: Record<string, string> = {}
    for (const p of collabProfiles ?? []) {
      collabNames[p.id]    = getDisplayName(p as Parameters<typeof getDisplayName>[0])
      collabUsernames[p.id] = p.username ?? ""
    }

    // Activity for the creator — includes all collaborators in meta
    await supabase.from("activity").insert({
      user_id:   user.id,
      type:      "wishlist_created",
      target_id: data.id,
      meta: {
        title,
        other_participant_names:     collabNames,
        other_participant_usernames: collabUsernames,
      },
    })

    // Activity + notification for each collaborator
    const creatorActivityMeta = {
      title,
      other_participant_names:     { [user.id]: creatorName },
      other_participant_usernames: { [user.id]: creatorProfile?.username ?? "" },
    }

    const activityRows = collaboratorIds.map((uid) => ({
      user_id:   uid,
      type:      "wishlist_created" as const,
      target_id: data.id,
      meta:      creatorActivityMeta,
    }))

    const notificationRows = collaboratorIds.map((uid) => ({
      user_id:   uid,
      type:      "wishlist_collaboration" as const,
      actor_id:  user.id,
      target_id: data.id,
      meta:      { title, creator_name: creatorName },
    }))

    await Promise.all([
      supabase.from("activity").insert(activityRows),
      supabase.from("notifications").insert(notificationRows),
    ])
  } else {
    // No collaborators — plain activity row
    await supabase.from("activity").insert({
      user_id:   user.id,
      type:      "wishlist_created",
      target_id: data.id,
      meta:      { title },
    })
  }

  redirect(`/wishlists/${data.id}`)
}

// ── Update ────────────────────────────────────────────────────────────────────

export async function updateWishlist(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/")

  const id = formData.get("id") as string
  const title = (formData.get("title") as string).trim()
  if (!title) return { error: "Wishlist name is required" }

  const { error } = await supabase
    .from("wishlists")
    .update({
      title,
      type: formData.get("type") as string,
      visibility: formData.get("visibility") as string,
      description: (formData.get("description") as string) || null,
      occasion: (formData.get("occasion") as string) || null,
      event_date: (formData.get("event_date") as string) || null,
      cover_image_url:  (formData.get("cover_image_url") as string) || null,
      beneficiary_name: (formData.get("beneficiary_name") as string) || null,
      color:            (formData.get("color") as string) || null,
      updated_at:       new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id) // RLS double-check

  if (error) return { error: error.message }
  redirect(`/wishlists/${id}`)
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function deleteWishlist(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/")

  const id = formData.get("id") as string

  const { error } = await supabase
    .from("wishlists")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) return { error: error.message }
  redirect("/dashboard")
}

// ── Follow / Unfollow ─────────────────────────────────────────────────────────

export async function followWishlist(wishlistId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const { error } = await supabase
    .from("wishlist_followers")
    .insert({ wishlist_id: wishlistId, user_id: user.id })

  if (error) return { error: error.message }
  return { success: true }
}

export async function unfollowWishlist(wishlistId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const { error } = await supabase
    .from("wishlist_followers")
    .delete()
    .eq("wishlist_id", wishlistId)
    .eq("user_id", user.id)

  if (error) return { error: error.message }
  return { success: true }
}
