"use client"

import type { GiftRecommendation } from "@/lib/actions/inspire"
import { formatPrice } from "@/lib/utils"

const CATEGORY_EMOJI: Record<string, string> = {
  Tech:       "💻",
  Fashion:    "👗",
  Books:      "📚",
  Home:       "🏠",
  Experience: "🎭",
  Sports:     "⚽",
  Beauty:     "💄",
  Food:       "🍕",
  Games:      "🎮",
  Other:      "🎁",
}

export default function GiftWishCard({ rec }: { rec: GiftRecommendation }) {
  const emoji    = CATEGORY_EMOJI[rec.category] ?? "🎁"
  const hasPrice = rec.scraped_price != null

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>

      {/* ── Image area — same shape as WishCard ── */}
      <a
        href={rec.storeUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{ textDecoration: "none", display: "block" }}
      >
        <div style={{
          position: "relative",
          borderRadius: 12,
          overflow: "hidden",
          aspectRatio: "3/4",
          background: "#F1F5F9",
          cursor: "pointer",
        }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          {rec.image_url ? (
            <img
              src={rec.image_url}
              alt={rec.title}
              style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
              onError={(e) => {
                // Hide broken image, show emoji fallback
                e.currentTarget.style.display = "none"
                const parent = e.currentTarget.parentElement
                if (parent) {
                  const fb = parent.querySelector(".emoji-fallback") as HTMLElement | null
                  if (fb) fb.style.display = "flex"
                }
              }}
            />
          ) : null}

          {/* Emoji fallback — shown if no image_url or image fails to load */}
          <div
            className="emoji-fallback"
            style={{
              display: rec.image_url ? "none" : "flex",
              position: "absolute", inset: 0,
              alignItems: "center", justifyContent: "center",
              fontSize: 48, color: "#CBD5E1",
            }}
          >
            {emoji}
          </div>
        </div>
      </a>

      {/* ── Info row — same as WishCard ── */}
      <div style={{ marginTop: 8, display: "flex", alignItems: "flex-start", gap: 6, minWidth: 0 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 13, fontWeight: 500, color: "#0F172A", margin: "0 0 2px",
            lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis",
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          }}>
            {rec.title}
          </p>
          <p style={{ fontSize: 13, color: "#64748B", margin: 0, fontWeight: 500 }}>
            {hasPrice
              ? formatPrice(rec.scraped_price!, rec.scraped_currency ?? "USD")
              : rec.priceRange}
          </p>
        </div>

        {/* Visit store icon button */}
        <a
          href={rec.storeUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Shop"
          style={{
            flexShrink: 0,
            width: 28, height: 28, borderRadius: 8,
            border: "1px solid #E2E8F0",
            background: "white",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#64748B", textDecoration: "none",
            transition: "background 0.1s, color 0.1s",
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLAnchorElement
            el.style.background = "#F0F9FD"
            el.style.color = "#38A3C7"
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLAnchorElement
            el.style.background = "white"
            el.style.color = "#64748B"
          }}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 15 15">
            <path d="M6.5 2.5H3a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V8" />
            <path d="M9.5 1.5H13.5V5.5" /><path d="M13.5 1.5L7 8" />
          </svg>
        </a>
      </div>

      {/* "Why this gift" hint */}
      <p style={{ margin: "4px 0 0", fontSize: 11, color: "#94A3B8", lineHeight: 1.4, fontStyle: "italic" }}>
        {rec.why}
      </p>

    </div>
  )
}
