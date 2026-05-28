"use client"

import { useState } from "react"
import Container from "@/components/ui/Container"
import EmptyState from "@/components/ui/EmptyState"
import ReservationCard from "./ReservationCard"

type Tab = "active" | "bought"

interface WishlistGroup {
  wishlistId: string
  wishlistTitle: string
  ownerName: string
  items: any[]
}

interface Props {
  reservations: any[]
}

function groupByWishlist(items: any[]): WishlistGroup[] {
  const map = new Map<string, WishlistGroup>()
  for (const r of items) {
    const wishlistId = r.wish?.wishlist?.id ?? "unknown"
    const wishlistTitle = r.wish?.wishlist?.title ?? "Wishlist"
    const owner = r.wish?.wishlist?.profiles
    const ownerName = owner?.first_name
      ? `${owner.first_name} ${owner.last_name ?? ""}`.trim()
      : owner?.username ?? ""
    if (!map.has(wishlistId)) {
      map.set(wishlistId, { wishlistId, wishlistTitle, ownerName, items: [] })
    }
    map.get(wishlistId)!.items.push(r)
  }
  return Array.from(map.values())
}

export default function ReservationsClient({ reservations }: Props) {
  const [tab, setTab] = useState<Tab>("active")

  const active = reservations.filter((r) => r.status !== "bought")
  const bought = reservations.filter((r) => r.status === "bought")

  const items = tab === "active" ? active : bought
  const groups = groupByWishlist(items)

  return (
    <main style={{ minHeight: "100vh", background: "#F8FAFC", paddingBottom: 80 }}>
      <Container>
        <div style={{ paddingTop: "clamp(24px, 5vw, 48px)", maxWidth: 900, margin: "0 auto" }}>

          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", margin: "0 0 6px" }}>
            My Reservations
          </h1>
          <p style={{ fontSize: 14, color: "#64748B", margin: "0 0 28px" }}>
            Wishes you've committed to buying. Only you can see these.
          </p>

          {/* Tabs */}
          {reservations.length > 0 && (
            <div style={{
              display: "flex", gap: 4, padding: 4,
              background: "#F1F5F9", borderRadius: 12,
              width: "fit-content", marginBottom: 32,
            }}>
              <TabButton active={tab === "active"} onClick={() => setTab("active")}>
                Active {active.length > 0 && <Count active={tab === "active"}>{active.length}</Count>}
              </TabButton>
              <TabButton active={tab === "bought"} onClick={() => setTab("bought")}>
                Bought {bought.length > 0 && <Count active={tab === "bought"}>{bought.length}</Count>}
              </TabButton>
            </div>
          )}

          {/* Content */}
          {reservations.length === 0 ? (
            <EmptyState
              icon="🎁"
              title="No reservations yet"
              description="Browse a friend's wishlist and reserve a wish to help out — it'll show up here so you don't lose track."
              action={{ label: "Find friends", href: "/friends" }}
              secondaryAction={{ label: "Discover wishlists", href: "/inspire" }}
            />
          ) : items.length === 0 ? (
            tab === "active" ? (
              <EmptyState
                icon="✨"
                title="No active reservations"
                description="You've bought everything you reserved! Switch to the Bought tab to see your purchases."
                action={{ label: "Discover wishlists", href: "/inspire" }}
              />
            ) : (
              <EmptyState
                icon="🛍"
                title="No purchases yet"
                description="Once you mark a reserved wish as bought, it'll show up here so you can keep track of gifts you've already taken care of."
              />
            )
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start" }}>
              {groups.map((group) => (
                <div key={group.wishlistId}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: "#0F172A" }}>
                      {group.wishlistTitle}
                    </span>
                    {group.ownerName && (
                      <span style={{ fontSize: 12, color: "#94A3B8" }}>
                        by {group.ownerName}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                    {group.items.map((r: any) => (
                      <div key={r.id} style={{ width: 200 }}>
                        <ReservationCard reservation={r} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </Container>
    </main>
  )
}


function TabButton({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: "none", cursor: "pointer",
        padding: "8px 18px", borderRadius: 8,
        fontSize: 13, fontWeight: 600,
        background: active ? "white" : "transparent",
        color: active ? "#0F172A" : "#64748B",
        boxShadow: active ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
        transition: "background 0.15s, color 0.15s",
        display: "inline-flex", alignItems: "center", gap: 6,
      }}
    >
      {children}
    </button>
  )
}

function Count({ children, active }: { children: React.ReactNode; active: boolean }) {
  return (
    <span style={{
      background: active ? "#38A3C7" : "#E2E8F0",
      color: active ? "white" : "#64748B",
      borderRadius: 10, fontSize: 10, fontWeight: 700,
      padding: "1px 6px", lineHeight: "16px",
    }}>
      {children}
    </span>
  )
}
