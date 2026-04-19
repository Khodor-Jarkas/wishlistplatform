"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { slugify } from "@/lib/utils"

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

  // Activity
  await supabase.from("activity").insert({
    user_id:   user.id,
    type:      "wishlist_created",
    target_id: data.id,
    meta:      { title },
  })

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
