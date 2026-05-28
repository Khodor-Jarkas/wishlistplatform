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
  color: string | null
  occasion: string | null
  follower_count: number
  wish_count: number
  profile: {
    username: string
    first_name: string | null
    last_name: string | null
    avatar_url: string | null
    is_creator: boolean
  } | null
}

export async function getTrendingWishlists(): Promise<TrendingWishlist[]> {
  const supabase = await createClient()

  const { data } = await supabase
    .from("wishlists")
    .select(`
      id, title, description, cover_image_url, color, occasion,
      profile:user_id(username, first_name, last_name, avatar_url, is_creator),
      wishlist_followers(count),
      wishes(count)
    `)
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(30)

  const mapped: TrendingWishlist[] = (data ?? []).map((w: any) => ({
    id: w.id,
    title: w.title,
    description: w.description,
    cover_image_url: w.cover_image_url,
    color: w.color ?? null,
    occasion: w.occasion,
    profile: w.profile
      ? { ...w.profile, is_creator: !!w.profile.is_creator }
      : null,
    follower_count: w.wishlist_followers?.[0]?.count ?? 0,
    wish_count: w.wishes?.[0]?.count ?? 0,
  }))

  mapped.sort((a, b) => {
    const aCreator = a.profile?.is_creator ? 1 : 0
    const bCreator = b.profile?.is_creator ? 1 : 0
    if (aCreator !== bCreator) return bCreator - aCreator
    if (a.follower_count !== b.follower_count) return b.follower_count - a.follower_count
    return b.wish_count - a.wish_count
  })

  return mapped.slice(0, 12)
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
  scraped_title: string | null
  scraped_description: string | null
  scraped_brand: string | null
}

// ── Internal types ────────────────────────────────────────────────────────────

interface GiftProfile {
  traits: string[]
  topCategories: string[]
  budgetTier: "budget" | "mid" | "premium"
  giftStyle: "practical" | "experiential" | "mixed"
}

type RawCandidate = Omit<
  GiftRecommendation,
  "image_url" | "scraped_price" | "scraped_currency" | "scraped_title" | "scraped_description" | "scraped_brand"
>

// ── Layer 3 helpers ───────────────────────────────────────────────────────────

const OCCASION_CATEGORY_SCORES: Record<string, Record<string, number>> = {
  "Birthday":        { Experience: 1.0, Tech: 0.9, Games: 0.9, Fashion: 0.8, Beauty: 0.8, Food: 0.7, Sports: 0.7, Home: 0.6, Books: 0.6, Other: 0.5 },
  "Christmas":       { Tech: 1.0, Games: 1.0, Food: 0.9, Home: 0.9, Fashion: 0.8, Books: 0.8, Experience: 0.7, Beauty: 0.7, Sports: 0.7, Other: 0.6 },
  "Wedding":         { Home: 1.0, Experience: 0.9, Food: 0.8, Fashion: 0.7, Beauty: 0.7, Tech: 0.6, Books: 0.5, Sports: 0.5, Games: 0.4, Other: 0.5 },
  "Baby Shower":     { Home: 0.9, Books: 0.8, Fashion: 0.8, Beauty: 0.7, Food: 0.6, Tech: 0.6, Experience: 0.5, Sports: 0.4, Games: 0.3, Other: 0.5 },
  "Graduation":      { Tech: 1.0, Experience: 0.9, Books: 0.9, Fashion: 0.8, Home: 0.7, Sports: 0.6, Games: 0.6, Beauty: 0.6, Food: 0.6, Other: 0.5 },
  "Anniversary":     { Experience: 1.0, Fashion: 0.9, Beauty: 0.9, Home: 0.8, Food: 0.8, Tech: 0.6, Books: 0.5, Sports: 0.5, Games: 0.4, Other: 0.5 },
  "Valentine's Day": { Experience: 1.0, Beauty: 0.9, Fashion: 0.9, Food: 0.9, Home: 0.6, Books: 0.6, Tech: 0.5, Sports: 0.4, Games: 0.3, Other: 0.5 },
  "Mother's Day":    { Experience: 1.0, Beauty: 1.0, Fashion: 0.9, Home: 0.8, Food: 0.8, Books: 0.7, Tech: 0.5, Sports: 0.5, Games: 0.3, Other: 0.5 },
  "Father's Day":    { Tech: 1.0, Sports: 1.0, Experience: 0.9, Food: 0.8, Home: 0.7, Games: 0.7, Books: 0.7, Fashion: 0.6, Beauty: 0.3, Other: 0.5 },
}

function parsePriceRange(range: string): { min: number; max: number } | null {
  const nums = range.match(/[\d,.]+/g)?.map((n) => parseFloat(n.replace(/,/g, "")))
  if (!nums || nums.length === 0) return null
  if (nums.length === 1) return { min: nums[0] * 0.8, max: nums[0] * 1.2 }
  return { min: Math.min(...nums), max: Math.max(...nums) }
}

// ── Layer 1: Profile enrichment ───────────────────────────────────────────────

async function enrichProfile(form: GiftFinderForm, client: OpenAI): Promise<GiftProfile | null> {
  const budget =
    form.budgetMin && form.budgetMax ? `$${form.budgetMin}–$${form.budgetMax}`
    : form.budgetMax                 ? `Up to $${form.budgetMax}`
    : form.budgetMin                 ? `From $${form.budgetMin}`
    : "Flexible"

  const prompt = `Profile a gift recipient and return ONLY a JSON object with:
- "traits": array of 3 personality keywords (e.g. ["adventurous", "tech-savvy", "homebody"])
- "topCategories": array of 3 from [Tech, Fashion, Books, Home, Experience, Sports, Beauty, Food, Games, Other]
- "budgetTier": one of "budget", "mid", "premium"
- "giftStyle": one of "practical", "experiential", "mixed"

Recipient: age ${form.recipientAge || "unknown"}, gender ${form.recipientGender || "unspecified"}, location ${[form.city, form.country].filter(Boolean).join(", ") || "unspecified"}, occasion: ${form.occasion || "general gift"}, budget: ${budget}, interests: ${form.interests || "unspecified"}

Return ONLY valid JSON. No markdown.`

  try {
    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    })
    const text = (completion.choices[0].message.content ?? "").trim()
    const json = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "")
    return JSON.parse(json) as GiftProfile
  } catch {
    return null
  }
}

// ── Layer 2: Candidate generation (15 items) ──────────────────────────────────

async function generateCandidates(
  form: GiftFinderForm,
  profile: GiftProfile | null,
  wishContext: string,
  client: OpenAI,
): Promise<RawCandidate[]> {
  const budget =
    form.budgetMin && form.budgetMax ? `$${form.budgetMin}–$${form.budgetMax}`
    : form.budgetMax                 ? `Up to $${form.budgetMax}`
    : form.budgetMin                 ? `From $${form.budgetMin}`
    : "Flexible"

  const location = [form.city, form.country].filter(Boolean).join(", ") || "Not specified"

  const profileBlock = profile
    ? `\nEnriched recipient profile: traits: ${profile.traits.join(", ")}; best gift categories: ${profile.topCategories.join(", ")}; budget tier: ${profile.budgetTier}; gift style: ${profile.giftStyle}`
    : ""

  const prompt = `You are a gift recommendation assistant for Wish It, a wishlist platform.

Suggest 15 specific, thoughtful gift ideas based on this recipient profile:
- Age: ${form.recipientAge || "Not specified"}
- Gender: ${form.recipientGender || "Not specified"}
- Location: ${location}
- Occasion: ${form.occasion || "General gift"}
- Budget: ${budget}
- Interests / notes: ${form.interests || "Not specified"}${profileBlock}

Popular items currently on Wish It wishlists (use as inspiration):
${wishContext || "(no data available)"}

Return a JSON array of exactly 15 objects. Each must have:
- "title": string — specific product name (e.g. "Sony WH-1000XM5 Headphones")
- "description": string — 1-2 sentences describing it
- "priceRange": string — e.g. "$20–$40"
- "why": string — one sentence why it suits this specific recipient
- "category": one of: Tech, Fashion, Books, Home, Experience, Sports, Beauty, Food, Games, Other
- "storeUrl": string — Amazon search URL: https://www.amazon.com/s?k=URL-encoded-title

Return ONLY valid JSON. No markdown, no explanation.`

  const completion = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 2800,
    messages: [{ role: "user", content: prompt }],
  })

  const text = (completion.choices[0].message.content ?? "").trim()
  const json = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "")
  const raw = JSON.parse(json) as RawCandidate[]

  return raw.map((r) => ({
    ...r,
    storeUrl: r.storeUrl ?? `https://www.amazon.com/s?k=${encodeURIComponent(r.title)}`,
  }))
}

// ── Layer 3: Re-rank to top 6 (budget fit + occasion + profile affinity) ──────

function rerank(
  candidates: RawCandidate[],
  form: GiftFinderForm,
  profile: GiftProfile | null,
): RawCandidate[] {
  const budgetMin = form.budgetMin ? parseFloat(form.budgetMin) : null
  const budgetMax = form.budgetMax ? parseFloat(form.budgetMax) : null
  const occasionScores = form.occasion ? OCCASION_CATEGORY_SCORES[form.occasion] : null

  const scored = candidates.map((c) => {
    let score = 0

    // Budget fit — 40% weight
    const parsed = parsePriceRange(c.priceRange)
    if (parsed) {
      if (budgetMax && parsed.min > budgetMax) {
        score += 0 // over budget
      } else if (budgetMin != null && budgetMax != null) {
        const overlap = Math.min(parsed.max, budgetMax) - Math.max(parsed.min, budgetMin)
        const range = budgetMax - budgetMin || 1
        score += 0.4 * Math.max(0, overlap / range)
      } else if (budgetMax != null) {
        score += parsed.max <= budgetMax ? 0.4 : 0.2
      } else {
        score += 0.2 // no budget constraint — neutral
      }
    }

    // Occasion appropriateness — 35% weight
    if (occasionScores) {
      score += 0.35 * (occasionScores[c.category] ?? 0.5)
    } else {
      score += 0.175
    }

    // Category affinity from enriched profile — 25% weight
    if (profile?.topCategories.includes(c.category)) {
      score += 0.25
    }

    return { candidate: c, score }
  })

  scored.sort((a, b) => b.score - a.score)

  // Greedy selection with at most 2 per category for diversity
  const categoryCounts: Record<string, number> = {}
  const selected: RawCandidate[] = []

  for (const { candidate } of scored) {
    if (selected.length >= 6) break
    const count = categoryCounts[candidate.category] ?? 0
    if (count < 2) {
      selected.push(candidate)
      categoryCounts[candidate.category] = count + 1
    }
  }

  // Fill remaining slots if diversity constraint left us short
  if (selected.length < 6) {
    for (const { candidate } of scored) {
      if (selected.length >= 6) break
      if (!selected.includes(candidate)) selected.push(candidate)
    }
  }

  return selected
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function getAIGiftRecommendations(
  form: GiftFinderForm
): Promise<{ recommendations: GiftRecommendation[]; error?: string }> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return { recommendations: [], error: "AI service not configured." }

  const supabase = await createClient()
  const client = new OpenAI({ apiKey, baseURL: "https://api.groq.com/openai/v1" })

  // Fetch platform data and run Layer 1 in parallel
  const [trendingWishesResult, profile] = await Promise.all([
    supabase
      .from("wishes")
      .select("title, price, currency, wishlist:wishlist_id(visibility, occasion)")
      .order("created_at", { ascending: false })
      .limit(60),
    enrichProfile(form, client),
  ])

  const wishContext = (trendingWishesResult.data ?? [])
    .filter((w: any) => w.wishlist?.visibility === "public")
    .slice(0, 40)
    .map((w: any) => {
      const price = w.price ? ` (~${w.currency ?? "USD"} ${w.price})` : ""
      const occ   = w.wishlist?.occasion ? ` [${w.wishlist.occasion}]` : ""
      return `- ${w.title}${price}${occ}`
    })
    .join("\n")

  try {
    // Layer 2: generate 15 candidates
    const candidates = await generateCandidates(form, profile, wishContext, client)

    // Layer 3: re-rank to top 6
    const top6 = rerank(candidates, form, profile)

    // Scrape the final 6 in parallel for image, price, title, description, brand
    const enriched = await Promise.all(
      top6.map(async (rec) => {
        try {
          const scraped = await scrapeProductUrl(rec.storeUrl)
          return {
            ...rec,
            image_url:           scraped.image ?? null,
            scraped_price:       scraped.price ?? null,
            scraped_currency:    scraped.currency ?? null,
            scraped_title:       scraped.title ?? null,
            scraped_description: scraped.description ?? null,
            scraped_brand:       scraped.brand ?? null,
          }
        } catch {
          return {
            ...rec,
            image_url: null, scraped_price: null, scraped_currency: null,
            scraped_title: null, scraped_description: null, scraped_brand: null,
          }
        }
      })
    )

    return { recommendations: enriched }
  } catch (err) {
    console.error("AI gift finder error:", err)
    return { recommendations: [], error: "Failed to generate recommendations. Please try again." }
  }
}
