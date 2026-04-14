"use client"

import { useState } from "react"
import Link from "next/link"
import Container from "@/components/ui/Container"
import WishlistGrid from "@/components/wishlist/WishlistGrid"
import CreateWishlistModal from "@/components/wishlist/CreateWishlistModal"
import type { WishlistWithCounts } from "@/components/wishlist/WishlistCard"

interface Props {
  wishlists: WishlistWithCounts[]
  followedLists: WishlistWithCounts[]
  friendCount: number
  initials: string
  displayName: string
  avatarUrl?: string | null
  totalWishes: number
}

export default function DashboardClient({
  wishlists,
  followedLists,
  friendCount,
  initials,
  displayName,
  avatarUrl,
  totalWishes,
}: Props) {
  const [showModal, setShowModal] = useState(false)

  return (
    <main style={{ minHeight: "100vh", background: "#F8FAFC", paddingBottom: 60 }}>
      <Container>
        <div style={{ paddingTop: 48 }}>

          {/* Profile header */}
          <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 48 }}>
            <div
              style={{
                width: 88, height: 88, borderRadius: "50%", background: "#38A3C7",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", fontWeight: 700, fontSize: 28, flexShrink: 0, overflow: "hidden",
              }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : initials}
            </div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", margin: "0 0 10px" }}>
                {displayName}
              </h1>
              <div style={{ display: "flex", gap: 24, fontSize: 14, color: "#64748B" }}>
                <span><strong style={{ color: "#0F172A" }}>{totalWishes}</strong> {totalWishes === 1 ? "wish" : "wishes"}</span>
                <span><strong style={{ color: "#0F172A" }}>{wishlists.length}</strong> {wishlists.length === 1 ? "wishlist" : "wishlists"}</span>
                <Link href="/friends" style={{ color: "#38A3C7", textDecoration: "none" }}>
                  <strong style={{ color: "#0F172A" }}>{friendCount}</strong> {friendCount === 1 ? "friend" : "friends"}
                </Link>
              </div>
            </div>
          </div>

          {/* My wishlists */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "#0F172A", margin: 0 }}>My wishlists</h2>
            <button
              onClick={() => setShowModal(true)}
              style={{
                width: 32, height: 32, borderRadius: "50%", background: "#0F172A",
                border: "none", cursor: "pointer", color: "white", fontSize: 20, lineHeight: 1,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              +
            </button>
          </div>

          <WishlistGrid
            wishlists={wishlists}
            isOwner
            showCreateCard
            onCreateClick={() => setShowModal(true)}
          />

          {/* Lists I follow */}
          {followedLists.length > 0 && (
            <>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: "#0F172A", margin: "48px 0 20px" }}>
                Lists I follow
              </h2>
              <WishlistGrid wishlists={followedLists} isOwner={false} showOwner />
            </>
          )}

        </div>
      </Container>

      {showModal && <CreateWishlistModal onClose={() => setShowModal(false)} />}
    </main>
  )
}
