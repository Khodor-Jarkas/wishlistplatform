"use server"

import { createClient } from "@/lib/supabase/server"
import OpenAI from "openai"
import { scrapeProductUrl } from "@/lib/actions/wishes"

// ── Trending Wishlists ────────────────────────────────────────────────────────

export interface TrendingWishlist {
  id: string
  title: string
  description: string | null
  cover_image_url: string | null
  occasion: string | null
  follower_count: number
  wish_count: number
  profile: {
    username: string
    first_name: string | null
    last_name: string | null
    avatar_url: string | null
  } | null
}

export async function getTrendingWishlists(): Promise<TrendingWishlist[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from("wishlists")
    .select(`
      id, title, description, cover_image_url, occasion,
      profile:user_id(username, first_name, last_name, avatar_url),
      wishlist_followers(count),
      wishes(count)
    `)
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(12)

  return (data ?? []).map((w: any) => ({
    id: w.id,
    title: w.title,
    description: w.description,
    cover_image_url: w.cover_image_url,
    occasion: w.occasion,
    profile: w.profile ?? null,
    follower_count: w.wishlist_followers?.[0]?.count ?? 0,
    wish_count: w.wishes?.[0]?.count ?? 0,
  }))
}

// ── AI Gift Finder ────────────────────────────────────────────────────────────

export interface GiftFinderForm {
  recipientAge: string
  recipientGender: string
  country: string
  city: string
  occasion: string
  budgetMin: string
  budgetMax: string
  interests: string
}

export interface GiftRecommendation {
  title: string
  description: string
  priceRange: string
  why: string
  category: string
  storeUrl: string
  // Filled in after scraping:
  image_url: string | null
  scraped_price: number | null
  scraped_currency: string | null
}

export async function getAIGiftRecommendations(
  form: GiftFinderForm
): Promise<{ recommendations: GiftRecommendation[]; error?: string }> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return { recommendations: [], error: "AI service not configured." }

  const supabase = await createClient()

  // Gather trending wish titles to ground Claude in real platform data
  const { data: trendingWishes } = await supabase
    .from("wishes")
    .select("title, price, currency, wishlist:wishlist_id(visibility, occasion)")
    .order("created_at", { ascending: false })
    .limit(60)

  const wishContext = (trendingWishes ?? [])
    .filter((w: any) => w.wishlist?.visibility === "public")
    .slice(0, 40)
    .map((w: any) => {
      const price = w.price ? ` (~${w.currency ?? "USD"} ${w.price})` : ""
      const occ   = w.wishlist?.occasion ? ` [${w.wishlist.occasion}]` : ""
      return `- ${w.title}${price}${occ}`
    })
    .join("\n")

  const budget =
    form.budgetMin && form.budgetMax ? `$${form.budgetMin}–$${form.budgetMax}`
    : form.budgetMax                 ? `Up to $${form.budgetMax}`
    : form.budgetMin                 ? `From $${form.budgetMin}`
    : "Flexible"

  const location = [form.city, form.country].filter(Boolean).join(", ") || "Not specified"

  const prompt = `You are a gift recommendation assistant for Wish It, a wishlist platform.

Suggest 6 specific, thoughtful gift ideas based on this recipient profile:
- Age: ${form.recipientAge || "Not specified"}
- Gender: ${form.recipientGender || "Not specified"}
- Location: ${location}
- Occasion: ${form.occasion || "General gift"}
- Budget: ${budget}
- Interests / notes: ${form.interests || "Not specified"}

Popular items currently on Wish It wishlists (use as inspiration):
${wishContext || "(no data available)"}

Return a JSON array of exactly 6 objects. Each must have:
- "title": string — specific product name (e.g. "Sony WH-1000XM5 Headphones", "Le Creuset Dutch Oven")
- "description": string — 1-2 sentences describing it
- "priceRange": string — e.g. "$20–$40"
- "why": string — one sentence why it suits this recipient
- "category": one of: Tech, Fashion, Books, Home, Experience, Sports, Beauty, Food, Games, Other
- "storeUrl": string — an Amazon search URL for this product, e.g. "https://www.amazon.com/s?k=Sony+WH-1000XM5+Headphones"

Construct storeUrl as: https://www.amazon.com/s?k= followed by the URL-encoded product title.

Return ONLY valid JSON. No markdown, no explanation.`

  try {
    const client = new OpenAI({
      apiKey,
      baseURL: "https://api.groq.com/openai/v1",
    })

    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1200,
      messages: [{ role: "user", content: prompt }],
    })

    const text = (completion.choices[0].message.content ?? "").trim()

    // Strip any accidental markdown code fences
    const json = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "")
    const raw = JSON.parse(json) as Omit<GiftRecommendation, "image_url" | "scraped_price" | "scraped_currency">[]

    // Ensure every rec has a storeUrl (fallback: build from title)
    const withUrls = raw.map((r) => ({
      ...r,
      storeUrl: r.storeUrl ?? `https://www.amazon.com/s?k=${encodeURIComponent(r.title)}`,
    }))

    // Scrape each store URL in parallel for image + price
    const enriched = await Promise.all(
      withUrls.map(async (rec) => {
        try {
          const scraped = await scrapeProductUrl(rec.storeUrl)
          return {
            ...rec,
            image_url:        scraped.image ?? null,
            scraped_price:    scraped.price ?? null,
            scraped_currency: scraped.currency ?? null,
          }
        } catch {
          return { ...rec, image_url: null, scraped_price: null, scraped_currency: null }
        }
      })
    )

    return { recommendations: enriched }
  } catch (err) {
    console.error("AI gift finder error:", err)
    return { recommendations: [], error: "Failed to generate recommendations. Please try again." }
  }
}
