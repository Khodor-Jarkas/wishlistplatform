"use client"

import { useState } from "react"
import TrendingCard from "./TrendingCard"
import type { TrendingWishlist } from "@/lib/actions/inspire"

type Tab = "wishlists" | "creators"

interface Props {
  wishlists: TrendingWishlist[]
}

export default function InspireTabs({ wishlists }: Props) {
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
            <div style={{ textAlign: "center", padding: "60px 0", color: "#94A3B8" }}>
              <p style={{ margin: 0 }}>No public wishlists yet. Be the first to share yours!</p>
            </div>
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

      {/* Creators — skeleton / coming soon */}
      {tab === "creators" && <CreatorsSkeleton />}
    </section>
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

function CreatorsSkeleton() {
  return (
    <>
      <div style={{
        display: "flex", alignItems: "baseline", justifyContent: "space-between",
        marginBottom: 24, flexWrap: "wrap", gap: 8,
      }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#0F172A" }}>
          Featured Creators
        </h2>
        <span style={{
          fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
          color: "#38A3C7", background: "#E0F4FA",
          padding: "4px 10px", borderRadius: 20,
        }}>
          COMING SOON
        </span>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
        gap: 20,
      }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{
            background: "white", border: "1px solid #E2E8F0",
            borderRadius: 14, padding: 20, opacity: 0.75,
          }}>
            {/* Avatar placeholder */}
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: "linear-gradient(135deg, #E2E8F0, #CBD5E1)",
              margin: "0 auto 14px",
            }} />
            {/* Name placeholder */}
            <div style={{
              height: 14, width: "60%", margin: "0 auto 8px",
              background: "#E2E8F0", borderRadius: 4,
            }} />
            {/* Handle placeholder */}
            <div style={{
              height: 11, width: "40%", margin: "0 auto 16px",
              background: "#F1F5F9", borderRadius: 4,
            }} />
            {/* Stats */}
            <div style={{
              display: "flex", justifyContent: "center", gap: 12,
              fontSize: 12, color: "#94A3B8",
            }}>
              <span>— followers</span>
              <span>— wishlists</span>
            </div>
          </div>
        ))}
      </div>

      <p style={{
        textAlign: "center", marginTop: 32,
        fontSize: 13, color: "#64748B", maxWidth: 440, marginLeft: "auto", marginRight: "auto",
      }}>
        Follow curated creators who share their favorite gift picks, themed wishlists, and seasonal inspiration. Launching soon.
      </p>
    </>
  )
}
