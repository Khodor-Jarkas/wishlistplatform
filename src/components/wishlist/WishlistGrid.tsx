"use client"

import Link from "next/link"
import WishlistCard, { type WishlistWithCounts } from "./WishlistCard"

interface Props {
  wishlists: WishlistWithCounts[]
  isOwner?: boolean
  showCreateCard?: boolean
  showOwner?: boolean
  onCreateClick?: () => void
}

const GRID: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
  gap: 20,
}

export default function WishlistGrid({
  wishlists,
  isOwner = true,
  showCreateCard = false,
  showOwner = false,
  onCreateClick,
}: Props) {
  if (wishlists.length === 0 && !showCreateCard) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "80px 20px",
          background: "white",
          borderRadius: 16,
          border: "2px dashed #E2E8F0",
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎁</div>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: "#0F172A", marginBottom: 8 }}>
          No wishlists yet
        </h3>
        <p style={{ fontSize: 14, color: "#94A3B8", marginBottom: 24 }}>
          Create your first wishlist and start adding your wishes.
        </p>
        <Link
          href="/wishlists/new"
          style={{
            display: "inline-block",
            padding: "12px 24px",
            borderRadius: 10,
            background: "#38A3C7",
            color: "white",
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: "0.05em",
            textDecoration: "none",
          }}
        >
          + CREATE YOUR FIRST WISHLIST
        </Link>
      </div>
    )
  }

  return (
    <div style={GRID}>
      {wishlists.map((wishlist) => (
        <WishlistCard
          key={wishlist.id}
          wishlist={wishlist}
          isOwner={isOwner}
          showOwner={showOwner}
        />
      ))}

      {showCreateCard && (
        <button
          type="button"
          onClick={onCreateClick}
          style={{ background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
        >
          <div
            style={{
              height: 160,
              borderRadius: 12,
              border: "2px dashed #CBD5E1",
              background: "#F0F9FF",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              transition: "border-color 0.15s, background 0.15s",
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLDivElement).style.borderColor = "#38A3C7"
              ;(e.currentTarget as HTMLDivElement).style.background = "#E0F4FA"
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLDivElement).style.borderColor = "#CBD5E1"
              ;(e.currentTarget as HTMLDivElement).style.background = "#F0F9FF"
            }}
          >
            <div
              style={{
                width: 40, height: 40, borderRadius: 10, background: "#38A3C7",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", fontSize: 22, fontWeight: 300,
              }}
            >
              +
            </div>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#38A3C7" }}>Create wishlist</span>
          </div>
        </button>
      )}
    </div>
  )
}
