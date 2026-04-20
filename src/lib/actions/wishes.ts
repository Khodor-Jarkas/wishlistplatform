"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

// ── Scrape product URL ────────────────────────────────────────────────────────

const CURRENCY_SYMBOLS: Record<string, string> = {
  "$": "USD", "US$": "USD",
  "€": "EUR",
  "£": "GBP",
  "¥": "JPY",
  "₹": "INR",
  "₺": "TRY",
  "₽": "RUB",
  "₩": "KRW",
  "C$": "CAD", "CA$": "CAD",
  "A$": "AUD", "AU$": "AUD",
  "د.إ": "AED",
  "ر.س": "SAR",
  "ل.ل": "LBP", "LL": "LBP",
}

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(parseInt(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n: string) => String.fromCharCode(parseInt(n, 16)))
}

function absolutize(url: string | null | undefined, base: string): string | null {
  if (!url) return null
  try { return new URL(url, base).toString() } catch { return null }
}

function parsePrice(raw: string | number | null | undefined): number | null {
  if (raw == null) return null
  if (typeof raw === "number") return isFinite(raw) ? raw : null
  // Strip currency symbols/letters. Handle "1.299,00" (EU) vs "1,299.00" (US).
  let s = raw.replace(/[^\d.,-]/g, "").trim()
  if (!s) return null
  const lastComma = s.lastIndexOf(",")
  const lastDot   = s.lastIndexOf(".")
  if (lastComma > lastDot) {
    s = s.replace(/\./g, "").replace(",", ".")
  } else {
    s = s.replace(/,/g, "")
  }
  const n = parseFloat(s)
  return isNaN(n) ? null : n
}

function detectCurrencyFromText(text: string): string | null {
  for (const [sym, code] of Object.entries(CURRENCY_SYMBOLS)) {
    if (text.includes(sym)) return code
  }
  const m = text.match(/\b(USD|EUR|GBP|JPY|AUD|CAD|CHF|CNY|INR|AED|SAR|LBP|TRY|MXN|BRL|SEK|NOK|DKK)\b/i)
  return m ? m[1].toUpperCase() : null
}

// Walk a parsed JSON-LD value (which may be nested, array, or @graph-wrapped) and
// return the first Product/Offer-shaped object we find.
function findProduct(node: any): any {
  if (!node || typeof node !== "object") return null
  const arr = Array.isArray(node) ? node : [node]
  for (const item of arr) {
    if (!item || typeof item !== "object") continue
    const t = item["@type"]
    const types = Array.isArray(t) ? t : t ? [t] : []
    if (types.some((x) => typeof x === "string" && /product/i.test(x))) return item
    if (item["@graph"]) {
      const found = findProduct(item["@graph"])
      if (found) return found
    }
    if (item.mainEntity) {
      const found = findProduct(item.mainEntity)
      if (found) return found
    }
  }
  return null
}

export async function scrapeProductUrl(url: string): Promise<{
  title?: string | null
  image?: string | null
  description?: string | null
  price?: number | null
  currency?: string | null
  brand?: string | null
  error?: string
}> {
  try {
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url
    }
    new URL(url)

    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    })

    if (!res.ok) return { error: `Could not fetch product page (${res.status})` }
    const html = await res.text()

    // ── Helpers that close over `html` ──
    function meta(...props: string[]): string | null {
      for (const prop of props) {
        const escaped = prop.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        const m =
          html.match(new RegExp(`<meta[^>]+(?:property|name|itemprop)=["']${escaped}["'][^>]+content=["']([^"']+)["']`, "i")) ??
          html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name|itemprop)=["']${escaped}["']`, "i"))
        if (m?.[1]) return decodeHtml(m[1].trim())
      }
      return null
    }

    function linkHref(rel: string): string | null {
      const m = html.match(new RegExp(`<link[^>]+rel=["']${rel}["'][^>]+href=["']([^"']+)["']`, "i"))
      return m ? decodeHtml(m[1].trim()) : null
    }

    function itemprop(name: string): string | null {
      const m =
        html.match(new RegExp(`<[^>]+itemprop=["']${name}["'][^>]*content=["']([^"']+)["']`, "i")) ??
        html.match(new RegExp(`<[^>]+content=["']([^"']+)["'][^>]*itemprop=["']${name}["']`, "i")) ??
        html.match(new RegExp(`<[^>]+itemprop=["']${name}["'][^>]*>([^<]{1,200})<`, "i"))
      return m ? decodeHtml(m[1].trim()) : null
    }

    // ── JSON-LD ──
    let ld: any = null
    const ldBlocks = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
    for (const block of ldBlocks) {
      try {
        const parsed = JSON.parse(block[1].trim())
        const product = findProduct(parsed)
        if (product) { ld = product; break }
      } catch { /* ignore malformed blocks */ }
    }

    // ── Twitter product labels: twitter:label1="Price" + twitter:data1="$99" ──
    let twitterPrice: string | null = null
    for (const i of [1, 2, 3, 4]) {
      const label = meta(`twitter:label${i}`)
      if (label && /price/i.test(label)) {
        twitterPrice = meta(`twitter:data${i}`)
        break
      }
    }

    // ── Title ──
    const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim().replace(/\s+/g, " ") ?? null
    const title =
      (ld?.name && String(ld.name)) ||
      meta("og:title", "twitter:title") ||
      itemprop("name") ||
      (titleTag ? decodeHtml(titleTag) : null)

    // ── Description ──
    const description =
      (ld?.description && String(ld.description).replace(/\s+/g, " ").trim()) ||
      meta("og:description", "twitter:description", "description") ||
      itemprop("description")

    // ── Image ──
    let rawImage: string | null = null
    if (ld?.image) {
      const img = ld.image
      if (typeof img === "string") rawImage = img
      else if (Array.isArray(img) && img.length) rawImage = typeof img[0] === "string" ? img[0] : img[0]?.url ?? null
      else if (typeof img === "object") rawImage = img.url ?? img.contentUrl ?? null
    }
    rawImage =
      rawImage ||
      meta("og:image:secure_url", "og:image", "twitter:image:src", "twitter:image") ||
      linkHref("image_src") ||
      itemprop("image")
    const image = absolutize(rawImage, url)

    // ── Price + Currency ──
    let price: number | null = null
    let currency: string | null = null

    // JSON-LD offers
    if (ld?.offers) {
      const offer = Array.isArray(ld.offers) ? ld.offers[0] : ld.offers
      if (offer) {
        price = parsePrice(offer.price ?? offer.lowPrice ?? offer.priceSpecification?.price)
        currency =
          (offer.priceCurrency && String(offer.priceCurrency).toUpperCase()) ||
          (offer.priceSpecification?.priceCurrency && String(offer.priceSpecification.priceCurrency).toUpperCase()) ||
          null
      }
    }

    // Meta fallbacks
    if (price == null) {
      const metaPrice = meta("og:price:amount", "product:price:amount", "twitter:data1") ?? itemprop("price")
      price = parsePrice(metaPrice)
    }
    if (!currency) {
      currency =
        meta("og:price:currency", "product:price:currency", "priceCurrency") ??
        itemprop("priceCurrency")
    }

    // Twitter label fallback
    if (price == null && twitterPrice) {
      price = parsePrice(twitterPrice)
      if (!currency) currency = detectCurrencyFromText(twitterPrice)
    }

    // Heuristic last resort: scan visible HTML for a price-like pattern near the top of <body>
    if (price == null) {
      const bodyStart = html.indexOf("<body")
      const snippet = bodyStart >= 0 ? html.slice(bodyStart, bodyStart + 60000) : html.slice(0, 60000)
      const text = snippet.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " ")
      const m = text.match(/([$€£¥₹₺₽₩]|USD|EUR|GBP|AED|SAR|LBP)\s?([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{1,2})?)/i)
      if (m) {
        price = parsePrice(m[2])
        if (!currency) currency = detectCurrencyFromText(m[1]) ?? m[1].toUpperCase()
      }
    }

    if (currency) currency = currency.toUpperCase().trim()

    // ── Brand ──
    let brand: string | null = null
    if (ld?.brand) {
      brand = typeof ld.brand === "string" ? ld.brand : ld.brand.name ?? null
    }
    brand = brand || meta("og:brand", "product:brand") || itemprop("brand")

    return { title, image, description, price, currency, brand }
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

  const { error } = await supabase
    .from("wishes")
    .update({ is_received: true })
    .eq("id", wishId)
  if (error) return { error: error.message }

  revalidatePath(`/wishlists/${wishlistId}`)
  revalidatePath("/dashboard")
  revalidatePath("/reservations")
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

export async function copyWishToList(wishId: string, targetWishlistId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  // Verify user owns the target wishlist
  const { data: wl, error: wlErr } = await supabase
    .from("wishlists").select("id")
    .eq("id", targetWishlistId).eq("user_id", user.id).single()
  if (wlErr || !wl) return { error: "Wishlist not found" }

  // Fetch source wish fields
  const { data: source, error: fetchErr } = await supabase
    .from("wishes")
    .select("title, description, url, image_url, price, currency, quantity, priority")
    .eq("id", wishId).single()
  if (fetchErr || !source) return { error: "Wish not found" }

  const { error } = await supabase.from("wishes").insert({
    wishlist_id:  targetWishlistId,
    title:        source.title,
    description:  source.description,
    url:          source.url,
    image_url:    source.image_url,
    price:        source.price,
    currency:     source.currency,
    quantity:     source.quantity,
    priority:     source.priority,
  })

  if (error) return { error: error.message }

  revalidatePath(`/wishlists/${targetWishlistId}`)
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

  await supabase.from("wishes").update({ is_reserved: true }).eq("id", wishId)

  revalidatePath(`/wishlists/${wishlistId}`)
  revalidatePath("/reservations")
  return { success: true }
}

export async function markAsBought(reservationId: string, wishlistId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const { error } = await supabase
    .from("reservations")
    .update({ status: "bought" })
    .eq("id", reservationId)
    .eq("reserved_by", user.id)
  if (error) return { error: error.message }

  revalidatePath(`/wishlists/${wishlistId}`)
  revalidatePath("/reservations")
  return { success: true }
}

export async function markAsUnbought(reservationId: string, wishlistId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const { error } = await supabase
    .from("reservations")
    .update({ status: "reserved" })
    .eq("id", reservationId)
    .eq("reserved_by", user.id)
  if (error) return { error: error.message }

  revalidatePath(`/wishlists/${wishlistId}`)
  revalidatePath("/reservations")
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

  await supabase.from("wishes").update({ is_reserved: false }).eq("id", wishId)

  revalidatePath(`/wishlists/${wishlistId}`)
  revalidatePath("/reservations")
  return { success: true }
}
