"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

// ── Scrape product URL ────────────────────────────────────────────────────────

export async function scrapeProductUrl(url: string): Promise<{
  title?: string | null
  image?: string | null
  description?: string | null
  price?: number | null
  currency?: string | null
  error?: string
}> {
  try {
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url
    }
    new URL(url) // throws if invalid

    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    })

    if (!res.ok) return { error: "Could not fetch product page" }
    const html = await res.text()

    function meta(...props: string[]): string | null {
      for (const prop of props) {
        const m =
          html.match(
            new RegExp(
              `<meta[^>]+(?:property|name)=["']${prop}["'][^>]+content=["']([^"']+)["']`,
              "i"
            )
          ) ??
          html.match(
            new RegExp(
              `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${prop}["']`,
              "i"
            )
          )
        if (m?.[1]) return decode(m[1].trim())
      }
      return null
    }

    function decode(s: string) {
      return s
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(parseInt(n)))
    }

    const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? null
    const title = meta("og:title", "twitter:title") ?? (titleTag ? decode(titleTag) : null)
    const image = meta("og:image", "twitter:image:src", "twitter:image")
    const description = meta("og:description", "twitter:description", "description")
    const priceStr = meta("og:price:amount", "product:price:amount")
    const currency = meta("og:price:currency", "product:price:currency")
    const priceNum = priceStr ? parseFloat(priceStr.replace(/[^\d.]/g, "")) : null
    const price = priceNum != null && !isNaN(priceNum) ? priceNum : null

    return { title, image, description, price, currency }
  } catch {
    return { error: "Could not fetch product data. Please fill in manually." }
  }
}

export async function createWish(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/")

  const wishlistId = formData.get("wishlist_id") as string
  const title      = (formData.get("title") as string).trim()
  if (!title)      return { error: "Wish name is required" }
  if (!wishlistId) return { error: "Please choose a wishlist" }

  const priceRaw = formData.get("price") as string
  const price    = priceRaw && priceRaw !== "" ? parseFloat(priceRaw) : null

  const quantityRaw = formData.get("quantity") as string
  const quantity    = quantityRaw ? parseInt(quantityRaw, 10) : 1

  const priorityRaw = formData.get("is_most_wanted") as string
  const priority    = priorityRaw === "true" ? 2 : 0

  const { error } = await supabase.from("wishes").insert({
    wishlist_id:  wishlistId,
    title,
    description:  (formData.get("description") as string) || null,
    url:          (formData.get("url") as string) || null,
    image_url:    (formData.get("image_url") as string) || null,
    price,
    currency:     (formData.get("currency") as string) || "USD",
    quantity,
    priority,
  })

  if (error) return { error: error.message }

  // Activity — only for public/hidden wishlists (fire-and-forget, skip if wishlist query fails)
  const { data: wl } = await supabase.from("wishlists").select("visibility, title").eq("id", wishlistId).single()
  if (wl && wl.visibility !== "private") {
    await supabase.from("activity").insert({
      user_id:   user.id,
      type:      "wish_added",
      target_id: wishlistId,
      meta:      { wish_title: title, wishlist_title: wl.title },
    })
  }

  revalidatePath(`/wishlists/${wishlistId}`)
  revalidatePath("/dashboard")
  return { success: true }
}

export async function updateWish(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/")

  const wishId     = formData.get("wish_id") as string
  const wishlistId = formData.get("wishlist_id") as string
  const title      = (formData.get("title") as string).trim()
  if (!title) return { error: "Wish name is required" }

  const priceRaw = formData.get("price") as string
  const price    = priceRaw && priceRaw !== "" ? parseFloat(priceRaw) : null

  const quantityRaw = formData.get("quantity") as string
  const quantity    = quantityRaw ? parseInt(quantityRaw, 10) : 1

  const priorityRaw = formData.get("is_most_wanted") as string
  const priority    = priorityRaw === "true" ? 2 : 0

  const { error } = await supabase.from("wishes").update({
    title,
    description: (formData.get("description") as string) || null,
    url:         (formData.get("url") as string) || null,
    image_url:   (formData.get("image_url") as string) || null,
    price,
    currency:    (formData.get("currency") as string) || "USD",
    quantity,
    priority,
    updated_at:  new Date().toISOString(),
  }).eq("id", wishId)

  if (error) return { error: error.message }

  revalidatePath(`/wishlists/${wishlistId}`)
  return { success: true }
}

export async function toggleMostWanted(wishId: string, wishlistId: string, currentlyMostWanted: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const { error } = await supabase
    .from("wishes")
    .update({ priority: currentlyMostWanted ? 0 : 2 })
    .eq("id", wishId)

  if (error) return { error: error.message }
  revalidatePath(`/wishlists/${wishlistId}`)
  return { success: true }
}

export async function markAsReceived(wishId: string, wishlistId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const { error } = await supabase.from("wishes").delete().eq("id", wishId)
  if (error) return { error: error.message }

  revalidatePath(`/wishlists/${wishlistId}`)
  revalidatePath("/dashboard")
  return { success: true }
}

export async function deleteWish(wishId: string, wishlistId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const { error } = await supabase.from("wishes").delete().eq("id", wishId)
  if (error) return { error: error.message }

  revalidatePath(`/wishlists/${wishlistId}`)
  revalidatePath("/dashboard")
  return { success: true }
}

export async function moveWish(wishId: string, newWishlistId: string, currentWishlistId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const { error } = await supabase
    .from("wishes")
    .update({ wishlist_id: newWishlistId })
    .eq("id", wishId)

  if (error) return { error: error.message }

  revalidatePath(`/wishlists/${currentWishlistId}`)
  revalidatePath(`/wishlists/${newWishlistId}`)
  revalidatePath("/dashboard")
  return { success: true }
}

export async function reserveWish(wishId: string, wishlistId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const { error } = await supabase.from("reservations").insert({
    wish_id:     wishId,
    reserved_by: user.id,
  })

  if (error) return { error: error.message }
  revalidatePath(`/wishlists/${wishlistId}`)
  return { success: true }
}

export async function unreserveWish(wishId: string, wishlistId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const { error } = await supabase
    .from("reservations")
    .delete()
    .eq("wish_id", wishId)
    .eq("reserved_by", user.id)

  if (error) return { error: error.message }
  revalidatePath(`/wishlists/${wishlistId}`)
  return { success: true }
}
