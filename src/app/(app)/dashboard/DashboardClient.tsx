"use client"

import { useState } from "react"
import Link from "next/link"
import Container from "@/components/ui/Container"
import EmptyState from "@/components/ui/EmptyState"
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

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 18) return "Good afternoon"
  return "Good evening"
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
  const firstName = displayName.split(" ")[0]

  return (
    <main style={{ minHeight: "100vh", background: "#F8FAFC", paddingBottom: 80 }}>

      {/* ── Profile banner ── */}
      <div style={{
        background: "linear-gradient(135deg, #1E8FAD 0%, #38A3C7 60%, #4DBBD6 100%)",
        paddingBottom: 64,
        position: "relative",
        overflow: "hidden",
      }}>
        {/* bg circles */}
        <div style={{ position: "absolute", top: -60, right: -60, width: 300, height: 300, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -40, left: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />

        <Container>
          <div style={{ paddingTop: "clamp(28px, 5vw, 48px)", color: "white" }}>
            <p style={{ fontSize: 14, opacity: 0.8, margin: "0 0 4px" }}>
              {greeting()},
            </p>
            <h1 style={{ fontSize: "clamp(22px, 4vw, 28px)", fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>
              {firstName} 👋
            </h1>
          </div>
        </Container>
      </div>

      <Container>
        <div style={{ position: "relative", marginTop: -48 }}>

          {/* ── Profile card ── */}
          <div style={{
            background: "white",
            borderRadius: 20,
            padding: "24px 28px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
            marginBottom: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
            flexWrap: "wrap",
          }}>
            {/* Avatar + name */}
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                background: "#38A3C7", position: "relative",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", fontWeight: 700, fontSize: 24,
                flexShrink: 0, overflow: "hidden",
                boxShadow: "0 0 0 4px white, 0 0 0 6px #E0F4FA",
              }}>
                {initials}
                {avatarUrl && (
                  <img
                    src={avatarUrl}
                    alt=""
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => { e.currentTarget.style.display = "none" }}
                  />
                )}
              </div>
              <div>
                <p style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", margin: "0 0 4px" }}>{displayName}</p>
                <Link href="/profile" style={{ fontSize: 13, color: "#38A3C7", textDecoration: "none", fontWeight: 500 }}>
                  Edit profile →
                </Link>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[
                { value: wishlists.length, label: wishlists.length === 1 ? "Wishlist" : "Wishlists", href: null, color: "#E0F4FA", text: "#1E6B88" },
                { value: totalWishes,      label: totalWishes === 1 ? "Wish" : "Wishes",             href: null, color: "#F3E8FF", text: "#7C3AED" },
                { value: friendCount,      label: friendCount === 1 ? "Friend" : "Friends",           href: "/friends", color: "#DCFCE7", text: "#15803D" },
              ].map(({ value, label, href, color, text }) => {
                const inner = (
                  <div style={{
                    background: color, borderRadius: 14,
                    padding: "14px 20px", textAlign: "center", minWidth: 90,
                  }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: text, lineHeight: 1 }}>{value}</div>
                    <div style={{ fontSize: 12, color: text, opacity: 0.75, marginTop: 4, fontWeight: 500 }}>{label}</div>
                  </div>
                )
                return href
                  ? <Link key={label} href={href} style={{ textDecoration: "none" }}>{inner}</Link>
                  : <div key={label}>{inner}</div>
              })}
            </div>
          </div>

          {/* ── My Wishlists ── */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", margin: "0 0 2px" }}>My Wishlists</h2>
              <p style={{ fontSize: 13, color: "#94A3B8", margin: 0 }}>
                {wishlists.length === 0 ? "No wishlists yet" : `${wishlists.length} ${wishlists.length === 1 ? "list" : "lists"} · ${totalWishes} ${totalWishes === 1 ? "wish" : "wishes"}`}
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "9px 18px", borderRadius: 10,
                background: "#0F172A", color: "white",
                border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: 700, letterSpacing: "0.04em",
                boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                transition: "transform 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
              onMouseLeave={e => e.currentTarget.style.transform = ""}
            >
              + NEW LIST
            </button>
          </div>

          {wishlists.length === 0 ? (
            <EmptyState
              variant="dashed"
              icon="🎁"
              title="Create your first wishlist"
              description="Add wishes, share with friends, and never get a bad gift again."
              action={{ label: "Create a Wishlist", onClick: () => setShowModal(true) }}
              secondaryAction={{ label: "Browse inspiration", href: "/inspire" }}
            />
          ) : (
            <WishlistGrid
              wishlists={wishlists}
              isOwner
              showCreateCard
              onCreateClick={() => setShowModal(true)}
            />
          )}

          {/* ── Followed Lists ── */}
          {followedLists.length > 0 && (
            <>
              <div style={{ margin: "52px 0 20px", display: "flex", alignItems: "center", gap: 12 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", margin: 0 }}>Following</h2>
                <span style={{
                  background: "#E0F4FA", color: "#1E6B88",
                  fontSize: 12, fontWeight: 700, borderRadius: 20,
                  padding: "2px 10px",
                }}>
                  {followedLists.length}
                </span>
              </div>
              <WishlistGrid wishlists={followedLists} isOwner={false} showOwner />
            </>
          )}

        </div>
      </Container>

      {showModal && <CreateWishlistModal onClose={() => setShowModal(false)} />}
    </main>
  )
}
