import { ImageResponse } from "next/og"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const alt = "Wishlist on Wish It"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const COLOR_PRESETS: Record<string, [string, string]> = {
  blue:   ["#38A3C7", "#1E6B88"],
  purple: ["#8B5CF6", "#6D28D9"],
  amber:  ["#F59E0B", "#D97706"],
  green:  ["#10B981", "#059669"],
  pink:   ["#EC4899", "#BE185D"],
  red:    ["#EF4444", "#DC2626"],
  orange: ["#F97316", "#EA580C"],
  teal:   ["#14B8A6", "#0F766E"],
  coral:  ["#FB7185", "#BE123C"],
  slate:  ["#64748B", "#334155"],
}

const FALLBACK_KEYS = Object.keys(COLOR_PRESETS)

function pickGradient(color: string | null | undefined, title: string): [string, string] {
  if (color && COLOR_PRESETS[color]) return COLOR_PRESETS[color]
  const idx = (title?.charCodeAt(0) ?? 0) % FALLBACK_KEYS.length
  return COLOR_PRESETS[FALLBACK_KEYS[idx]]
}

export default async function OpengraphImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from("wishlists")
    .select("title, description, visibility, color, cover_image_url, wishes(count), profiles!user_id(first_name, last_name, username)")
    .eq("id", id)
    .single()

  const title = data?.title ?? "Wishlist"
  const visibility = data?.visibility
  const isPrivate = visibility === "private"
  const profile = Array.isArray(data?.profiles) ? data!.profiles[0] : data?.profiles
  const ownerName = profile?.first_name
    ? `${profile.first_name} ${profile.last_name ?? ""}`.trim()
    : profile?.username ?? "Someone"
  const wishCount: number = data?.wishes?.[0]?.count ?? 0
  const [from, to] = pickGradient(data?.color, title)

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
          padding: "72px 80px",
          position: "relative",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        {/* Brand row */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 22, fontWeight: 700, letterSpacing: "0.06em" }}>
          <div
            style={{
              width: 44, height: 44, borderRadius: 10,
              background: "rgba(255,255,255,0.18)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24,
            }}
          >
            ☁
          </div>
          <span style={{ opacity: 0.95 }}>WISH IT</span>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1, display: "flex" }} />

        {/* Title + owner */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.8, marginBottom: 18 }}>
            {isPrivate ? "Private Wishlist" : "Wishlist"} · by {ownerName}
          </div>
          <div
            style={{
              fontSize: 84,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              maxWidth: 960,
              display: "flex",
            }}
          >
            {title}
          </div>
        </div>

        {/* Footer row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 40 }}>
          <div
            style={{
              display: "flex", alignItems: "center", gap: 10,
              background: "rgba(255,255,255,0.18)",
              borderRadius: 999, padding: "10px 22px",
              fontSize: 22, fontWeight: 600,
            }}
          >
            {wishCount} {wishCount === 1 ? "wish" : "wishes"}
          </div>
          <div style={{ display: "flex", fontSize: 22, fontWeight: 600, opacity: 0.85 }}>
            wish-it.app
          </div>
        </div>

        {/* Decorative circles */}
        <div
          style={{
            position: "absolute", top: -160, right: -160,
            width: 480, height: 480, borderRadius: 999,
            background: "rgba(255,255,255,0.07)",
          }}
        />
        <div
          style={{
            position: "absolute", bottom: -100, left: -100,
            width: 320, height: 320, borderRadius: 999,
            background: "rgba(255,255,255,0.05)",
          }}
        />
      </div>
    ),
    { ...size }
  )
}
