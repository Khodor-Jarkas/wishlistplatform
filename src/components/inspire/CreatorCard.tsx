"use client"

import Link from "next/link"
import { getInitials, staticAvatarUrl } from "@/lib/utils"
import { WISHLIST_COLOR_PRESETS } from "@/components/wishlist/WishlistCard"
import type { CreatorCard as CreatorCardData } from "@/lib/actions/creators"

const DEFAULT_GRADIENTS = Object.values(WISHLIST_COLOR_PRESETS)

function pickGradient(seed: string, color: string | null) {
  if (color && WISHLIST_COLOR_PRESETS[color]) return WISHLIST_COLOR_PRESETS[color]
  return DEFAULT_GRADIENTS[seed.charCodeAt(0) % DEFAULT_GRADIENTS.length]
}

export default function CreatorCard({ creator }: { creator: CreatorCardData }) {
  const displayName = creator.first_name
    ? `${creator.first_name} ${creator.last_name ?? ""}`.trim()
    : creator.username

  const initials = getInitials({
    first_name: creator.first_name,
    last_name: creator.last_name,
    username: creator.username,
  })

  return (
    <Link
      href={`/users/${creator.username}`}
      style={{ textDecoration: "none", display: "block" }}
    >
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
        {/* Preview strip of up to 3 wishlist covers */}
        <div style={{ display: "flex", height: 96, background: "#F1F5F9" }}>
          {creator.preview_covers.length === 0 ? (
            <div style={{
              flex: 1,
              background: pickGradient(creator.username, null),
            }} />
          ) : (
            creator.preview_covers.map((w) => (
              <div
                key={w.id}
                style={{
                  flex: 1,
                  background: w.cover_image_url ? "transparent" : pickGradient(w.title, w.color),
                  borderRight: "1px solid rgba(255,255,255,0.6)",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                {w.cover_image_url && (
                  <img
                    src={w.cover_image_url}
                    alt={w.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                )}
              </div>
            ))
          )}
        </div>

        {/* Info */}
        <div style={{ padding: "18px 16px 16px", position: "relative" }}>
          {/* Avatar, overlapping preview strip */}
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "#38A3C7", border: "3px solid white",
            overflow: "hidden", flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontSize: 18, fontWeight: 700,
            position: "absolute", top: -28, left: 16,
            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          }}>
            {creator.avatar_url
              ? <img src={staticAvatarUrl(creator.avatar_url)!} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : initials}
          </div>

          <div style={{ marginTop: 32 }}>
            <p style={{
              margin: "0 0 2px", fontSize: 14, fontWeight: 700, color: "#0F172A",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {displayName}
            </p>
            <p style={{
              margin: "0 0 10px", fontSize: 12, color: "#94A3B8",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              @{creator.username}{creator.country ? ` · ${creator.country}` : ""}
            </p>

            {creator.bio && (
              <p style={{
                margin: "0 0 12px", fontSize: 12, color: "#64748B",
                lineHeight: 1.5, overflow: "hidden", display: "-webkit-box",
                WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
              }}>
                {creator.bio}
              </p>
            )}

            {/* Stats */}
            <div style={{ display: "flex", gap: 14, fontSize: 12, color: "#94A3B8" }}>
              <span>
                <strong style={{ color: "#0F172A", fontWeight: 700 }}>{creator.public_wishlist_count}</strong>
                {" "}wishlist{creator.public_wishlist_count === 1 ? "" : "s"}
              </span>
              <span>
                <strong style={{ color: "#0F172A", fontWeight: 700 }}>{creator.follower_count}</strong>
                {" "}follower{creator.follower_count === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
