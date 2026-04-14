"use client"

import Link from "next/link"
import { getInitials } from "@/lib/utils"
import type { TrendingWishlist } from "@/lib/actions/inspire"

const OCCASION_LABELS: Record<string, string> = {
  birthday:    "Birthday",
  christmas:   "Christmas",
  wedding:     "Wedding",
  baby_shower: "Baby Shower",
  graduation:  "Graduation",
  anniversary: "Anniversary",
  other:       "Other",
}

export default function TrendingCard({ wl }: { wl: TrendingWishlist }) {
  const ownerName = wl.profile?.first_name
    ? `${wl.profile.first_name} ${wl.profile.last_name ?? ""}`.trim()
    : wl.profile?.username ?? "Someone"

  const initials = getInitials(wl.profile ?? {})
  const occasion = wl.occasion ? OCCASION_LABELS[wl.occasion] ?? wl.occasion : null

  return (
    <Link href={`/wishlists/${wl.id}`} style={{ textDecoration: "none", display: "block" }}>
      <div
        style={{
          background: "white",
          border: "1px solid #E2E8F0",
          borderRadius: 14,
          overflow: "hidden",
          cursor: "pointer",
          transition: "box-shadow 0.15s, transform 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.10)"
          e.currentTarget.style.transform  = "translateY(-2px)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = "none"
          e.currentTarget.style.transform  = "translateY(0)"
        }}
      >
        {/* Cover image */}
        <div style={{
          height: 140,
          background: wl.cover_image_url ? "transparent" : "linear-gradient(135deg, #E0F2FE, #BAE6FD)",
          position: "relative",
          overflow: "hidden",
        }}>
          {wl.cover_image_url ? (
            <img
              src={wl.cover_image_url}
              alt={wl.title}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="#7DD3FC" strokeWidth="1.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 17.75l-6.172 3.245 1.179-6.873-4.993-4.867 6.9-1.002L12 2.25l3.086 6.003 6.9 1.002-4.993 4.867 1.179 6.873z" />
              </svg>
            </div>
          )}
          {occasion && (
            <span style={{
              position: "absolute", top: 10, left: 10,
              background: "rgba(15,23,42,0.7)", color: "white",
              fontSize: 11, fontWeight: 700, padding: "3px 10px",
              borderRadius: 20, letterSpacing: "0.05em",
              backdropFilter: "blur(4px)",
            }}>
              {occasion}
            </span>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: "14px 16px 16px" }}>
          <p style={{
            margin: "0 0 10px", fontSize: 14, fontWeight: 700, color: "#0F172A",
            lineHeight: 1.3, overflow: "hidden", display: "-webkit-box",
            WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          }}>
            {wl.title}
          </p>

          {/* Owner row */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%", background: "#38A3C7",
              overflow: "hidden", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontSize: 10, fontWeight: 700,
            }}>
              {wl.profile?.avatar_url
                ? <img src={wl.profile.avatar_url} alt={ownerName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : initials}
            </div>
            <span style={{ fontSize: 12, color: "#64748B", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {ownerName}
            </span>
          </div>

          {/* Stats */}
          <div style={{ display: "flex", gap: 14, marginTop: 10 }}>
            {/* Wishes count */}
            <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#94A3B8", fontSize: 12 }}>
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 17.75l-6.172 3.245 1.179-6.873-4.993-4.867 6.9-1.002L12 2.25l3.086 6.003 6.9 1.002-4.993 4.867 1.179 6.873z" />
              </svg>
              <span>{wl.wish_count} {wl.wish_count === 1 ? "wish" : "wishes"}</span>
            </div>
            {/* Followers count */}
            <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#94A3B8", fontSize: 12 }}>
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-4-4H4a4 4 0 00-4 4v2h5m6 0H6m6 0v-2m0 2v-2m6-10a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span>{wl.follower_count} {wl.follower_count === 1 ? "follower" : "followers"}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
