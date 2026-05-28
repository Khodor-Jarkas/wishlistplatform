"use client"

import { useState } from "react"
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

const CATEGORY_BG: Record<string, string> = {
  Tech:       "linear-gradient(145deg, #EFF6FF 0%, #BFDBFE 100%)",
  Fashion:    "linear-gradient(145deg, #FDF2F8 0%, #FBCFE8 100%)",
  Books:      "linear-gradient(145deg, #FFFBEB 0%, #FDE68A 100%)",
  Home:       "linear-gradient(145deg, #F0FDF4 0%, #BBF7D0 100%)",
  Experience: "linear-gradient(145deg, #F0FDFA 0%, #99F6E4 100%)",
  Sports:     "linear-gradient(145deg, #F7FEE7 0%, #BEF264 100%)",
  Beauty:     "linear-gradient(145deg, #FFF1F2 0%, #FECDD3 100%)",
  Food:       "linear-gradient(145deg, #FFF7ED 0%, #FED7AA 100%)",
  Games:      "linear-gradient(145deg, #F5F3FF 0%, #DDD6FE 100%)",
  Other:      "linear-gradient(145deg, #F8FAFC 0%, #E2E8F0 100%)",
}

// Amazon search page scraping returns garbage — detect and ignore it
function isAmazonSearchScrape(rec: GiftRecommendation): boolean {
  return !!rec.scraped_title?.toLowerCase().startsWith("amazon.com")
}

export default function GiftWishCard({ rec }: { rec: GiftRecommendation }) {
  const [hovered, setHovered]   = useState(false)
  const [imgFailed, setImgFailed] = useState(false)

  const isGarbage    = isAmazonSearchScrape(rec)
  const emoji        = CATEGORY_EMOJI[rec.category] ?? "🎁"
  const bgGradient   = CATEGORY_BG[rec.category] ?? CATEGORY_BG.Other

  // Prefer scraped data only when it's from a real product page (not Amazon search)
  const displayTitle = isGarbage ? rec.title : (rec.scraped_title || rec.title)
  const displayBrand = isGarbage ? null       : (rec.scraped_brand ?? null)
  const displayPrice = (rec.scraped_price != null && !isGarbage)
    ? formatPrice(rec.scraped_price, rec.scraped_currency ?? "USD")
    : rec.priceRange
  const displayWhy   = rec.why

  const hasRealImage = !!rec.image_url && !isGarbage && !imgFailed

  return (
    <div
      style={{ display: "flex", flexDirection: "column" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Image / placeholder area ── */}
      <a
        href={rec.storeUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: "relative",
          display: "block",
          borderRadius: 12,
          overflow: "hidden",
          aspectRatio: "3/4",
          background: bgGradient,
          textDecoration: "none",
          transition: "opacity 0.15s",
          opacity: hovered ? 0.9 : 1,
        }}
      >
        {hasRealImage ? (
          <img
            src={rec.image_url!}
            alt={displayTitle}
            loading="lazy"
            style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div style={{
            width: "100%", height: "100%",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 52,
          }}>
            {emoji}
          </div>
        )}

        {/* Category badge — top-left, mirrors WishCard's star badge position */}
        <div style={{
          position: "absolute", top: 8, left: 8,
          background: "rgba(255,255,255,0.90)",
          borderRadius: 20,
          padding: "3px 9px 3px 6px",
          display: "flex", alignItems: "center", gap: 4,
          boxShadow: "0 1px 4px rgba(0,0,0,0.10)",
          fontSize: 11, fontWeight: 600,
          color: "#475569",
          backdropFilter: "blur(4px)",
        }}>
          <span style={{ fontSize: 12 }}>{emoji}</span>
          {rec.category}
        </div>
      </a>

      {/* ── Info row — matches WishCard layout ── */}
      <div style={{ marginTop: 8, minWidth: 0 }}>

        {/* Brand (only when scraped from real product page) */}
        {displayBrand && (
          <p style={{
            margin: "0 0 2px", fontSize: 11, fontWeight: 600,
            color: "#94A3B8", letterSpacing: "0.04em", textTransform: "uppercase",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {displayBrand}
          </p>
        )}

        {/* Title + shop button */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
          <a
            href={rec.storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1, minWidth: 0,
              fontSize: 13, fontWeight: 500, color: "#0F172A",
              lineHeight: 1.35,
              overflow: "hidden", textOverflow: "ellipsis",
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
              textDecoration: "none",
            }}
          >
            {displayTitle}
          </a>

          {/* Shop icon — fades in on hover, same pattern as WishCard action buttons */}
          <a
            href={rec.storeUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Shop on Amazon"
            aria-label="Visit store"
            style={{
              flexShrink: 0,
              width: 28, height: 28, borderRadius: 8,
              border: "1px solid",
              borderColor: hovered ? "#E2E8F0" : "transparent",
              background: hovered ? "white" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#64748B", textDecoration: "none",
              opacity: hovered ? 1 : 0,
              transition: "opacity 0.15s, background 0.1s, border-color 0.1s",
              pointerEvents: hovered ? "auto" : "none",
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

        {/* Price */}
        <p style={{ fontSize: 13, color: "#64748B", margin: "2px 0 0", fontWeight: 500 }}>
          {displayPrice}
        </p>

        {/* "Why this gift" — AI-generated, always shown */}
        <p style={{
          margin: "5px 0 0", fontSize: 11, color: "#94A3B8",
          lineHeight: 1.45, fontStyle: "italic",
          overflow: "hidden", textOverflow: "ellipsis",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        }}>
          {displayWhy}
        </p>
      </div>
    </div>
  )
}
