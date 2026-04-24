"use client"

import { useState } from "react"
import TrendingCard from "./TrendingCard"
import CreatorCard from "./CreatorCard"
import EmptyState from "@/components/ui/EmptyState"
import type { TrendingWishlist } from "@/lib/actions/inspire"
import type { CreatorCard as CreatorCardData } from "@/lib/actions/creators"

type Tab = "wishlists" | "creators"

interface Props {
  wishlists: TrendingWishlist[]
  creators: CreatorCardData[]
}

export default function InspireTabs({ wishlists, creators }: Props) {
  const [tab, setTab] = useState<Tab>("wishlists")

  return (
    <section style={{ paddingTop: 56 }}>
      {/* Tab switcher */}
      <div style={{
        display: "flex", gap: 4, padding: 4,
        background: "#F1F5F9", borderRadius: 12,
        width: "fit-content", marginBottom: 28,
      }}>
        <TabButton active={tab === "wishlists"} onClick={() => setTab("wishlists")}>
          Trending Wishlists
        </TabButton>
        <TabButton active={tab === "creators"} onClick={() => setTab("creators")}>
          Creators
        </TabButton>
      </div>

      {/* Wishlists */}
      {tab === "wishlists" && (
        <>
          <div style={{
            display: "flex", alignItems: "baseline", justifyContent: "space-between",
            marginBottom: 24, flexWrap: "wrap", gap: 8,
          }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#0F172A" }}>
              Trending Wishlists
            </h2>
            <span style={{ fontSize: 13, color: "#94A3B8" }}>
              {wishlists.length} public wishlist{wishlists.length === 1 ? "" : "s"}
            </span>
          </div>

          {wishlists.length === 0 ? (
            <EmptyState
              icon="✨"
              title="No public wishlists yet"
              description="Be the first to share yours! Set a wishlist's visibility to Public and it'll appear here for everyone to see."
              action={{ label: "Create a wishlist", href: "/dashboard" }}
            />
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: 20,
            }}>
              {wishlists.map((wl) => <TrendingCard key={wl.id} wl={wl} />)}
            </div>
          )}
        </>
      )}

      {/* Creators */}
      {tab === "creators" && <CreatorsGrid creators={creators} />}
    </section>
  )
}

function CreatorsGrid({ creators }: { creators: CreatorCardData[] }) {
  return (
    <>
      <div style={{
        display: "flex", alignItems: "baseline", justifyContent: "space-between",
        marginBottom: 24, flexWrap: "wrap", gap: 8,
      }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#0F172A" }}>
          Featured Creators
        </h2>
        <span style={{ fontSize: 13, color: "#94A3B8" }}>
          {creators.length} creator{creators.length === 1 ? "" : "s"}
        </span>
      </div>

      {creators.length === 0 ? (
        <EmptyState
          icon="🌟"
          title="No Creators yet"
          description="Creators are users who share their wishlists publicly for inspiration. Turn on Creator mode in your profile settings once you have 2+ public wishlists."
          action={{ label: "Profile settings", href: "/profile" }}
        />
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 20,
          rowGap: 40,
        }}>
          {creators.map((c) => <CreatorCard key={c.id} creator={c} />)}
        </div>
      )}
    </>
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
      }}
    >
      {children}
    </button>
  )
}

