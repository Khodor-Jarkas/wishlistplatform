"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useIsMobile } from "@/lib/hooks/useMediaQuery"

// ── Topics ────────────────────────────────────────────────────
const TOPICS = [
  { icon: "🎁", label: "Getting started", anchor: "getting-started",
    blurb: "Create your first wishlist and add wishes." },
  { icon: "📋", label: "Wishlists",       anchor: "wishlists",
    blurb: "Cover photos, colors, privacy, sharing." },
  { icon: "☁",  label: "Wishes",          anchor: "wishes",
    blurb: "Adding from a link, pricing, quantity." },
  { icon: "👥", label: "Friends",         anchor: "friends",
    blurb: "Requests, privacy, suggestions." },
  { icon: "🔖", label: "Reservations",    anchor: "reservations",
    blurb: "Reserving gifts without spoiling surprises." },
  { icon: "🔒", label: "Privacy",         anchor: "privacy",
    blurb: "Private accounts, visibility controls." },
] as const

// ── FAQ content ───────────────────────────────────────────────
interface FAQ { q: string; a: string; category: typeof TOPICS[number]["anchor"] }

const FAQS: FAQ[] = [
  // Getting started
  { category: "getting-started",
    q: "How do I create my first wishlist?",
    a: "From the dashboard click the + button on the Wishlists grid, give it a title, optionally pick a cover color or upload a photo, and save. You can then add wishes to it any time." },
  { category: "getting-started",
    q: "What's the difference between a wish and a wishlist?",
    a: "A wishlist is the collection (e.g. 'Birthday 2026'). A wish is a single item inside it (e.g. 'Sony WH-1000XM5 Headphones'). Each wishlist can hold any number of wishes." },

  // Wishlists
  { category: "wishlists",
    q: "Can I change the look of a wishlist without a cover photo?",
    a: "Yes. In Create or Edit, pick any of the color presets and that gradient becomes the card background. Adding a cover photo overrides the color." },
  { category: "wishlists",
    q: "Who can see my wishlists?",
    a: "Each wishlist has its own visibility: Public (anyone), Friends (only accepted friends), or Private (only you). Change it any time from the edit menu." },
  { category: "wishlists",
    q: "Can I make a wishlist for someone else?",
    a: "Yes — when creating a wishlist toggle 'This is for someone else' and it will be marked as a gift list rather than your own." },

  // Wishes
  { category: "wishes",
    q: "How does 'Add from link' work?",
    a: "Paste any product URL and we'll pull in the title, image, price, and description automatically. If something's missing you can fill it in manually on the next step." },
  { category: "wishes",
    q: "What does 'Most Wanted' do?",
    a: "It flags a wish with a star so your friends instantly see which gifts you love the most. You can toggle it any time from the wish card." },
  { category: "wishes",
    q: "Can I move a wish between wishlists?",
    a: "Yes. Open the wish menu and pick Move — you can move it to any of your own wishlists, or copy it to duplicate." },

  // Friends
  { category: "friends",
    q: "How do I add a friend?",
    a: "Open the Friends drawer from the header, search their username, and send a request. They'll need to accept before you're connected." },
  { category: "friends",
    q: "Where do suggested friends come from?",
    a: "Suggestions are drawn from friends-of-friends first, then people in the same country if we don't have enough mutuals. Private accounts never appear in suggestions." },

  // Reservations
  { category: "reservations",
    q: "What happens when I reserve a gift?",
    a: "The wish is marked reserved so other friends know it's taken, but the owner of the list won't see that it was you — the surprise is preserved. You'll find your reservations under Reservations." },
  { category: "reservations",
    q: "What if I change my mind?",
    a: "Open Reservations and click Unreserve. The wish becomes available for someone else. If you've already bought it, mark it as bought instead." },

  // Privacy
  { category: "privacy",
    q: "What does a private account do?",
    a: "Private accounts can only be seen and followed by accepted friends. Your wishlists' visibility still applies on top — a public wishlist on a private account is still visible only to friends." },
  { category: "privacy",
    q: "Can I delete my account?",
    a: "Yes. Go to Profile → Administration → Delete my profile. This removes your account, wishlists and wishes permanently. It can't be undone." },
]

export default function HelpClient() {
  const isMobile = useIsMobile()
  const [query, setQuery] = useState("")
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return FAQS
    return FAQS.filter((f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q))
  }, [query])

  // Group filtered by category, preserving TOPICS order
  const grouped = useMemo(() => {
    const byCat = new Map<string, FAQ[]>()
    for (const f of filtered) {
      const list = byCat.get(f.category) ?? []
      list.push(f)
      byCat.set(f.category, list)
    }
    return TOPICS
      .map((t) => ({ ...t, faqs: byCat.get(t.anchor) ?? [] }))
      .filter((t) => t.faqs.length > 0)
  }, [filtered])

  return (
    <div style={{ maxWidth: 880, margin: "0 auto", padding: "40px 0" }}>

      {/* Search */}
      <div style={{
        display: "flex", alignItems: "center",
        background: "white", border: "1px solid #E2E8F0", borderRadius: 12,
        padding: "4px 4px 4px 14px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        marginBottom: 32,
      }}>
        <svg width="18" height="18" fill="none" stroke="#94A3B8" strokeWidth="1.8" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.34-4.34m0 0A7.5 7.5 0 1 0 6.04 6.04a7.5 7.5 0 0 0 10.61 10.61Z" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search help articles…"
          style={{
            flex: 1, border: "none", outline: "none",
            padding: "12px 10px", fontSize: 14, color: "#0F172A",
            background: "transparent",
          }}
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            style={{
              background: "#F1F5F9", border: "none", borderRadius: 8,
              padding: "8px 14px", fontSize: 12, fontWeight: 600,
              color: "#475569", cursor: "pointer",
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Topic cards */}
      {!query && (
        <>
          <h2 style={sectionHeading}>Browse by topic</h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 14, marginBottom: 40,
          }}>
            {TOPICS.map((t) => (
              <a
                key={t.anchor}
                href={`#${t.anchor}`}
                style={{
                  background: "white", border: "1px solid #E2E8F0",
                  borderRadius: 14, padding: "18px 18px 20px",
                  textDecoration: "none", color: "#0F172A",
                  transition: "transform 0.15s, box-shadow 0.15s, border-color 0.15s",
                  display: "block",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)"
                  e.currentTarget.style.boxShadow = "0 6px 18px rgba(0,0,0,0.06)"
                  e.currentTarget.style.borderColor = "#38A3C7"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.boxShadow = "none"
                  e.currentTarget.style.borderColor = "#E2E8F0"
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 8 }}>{t.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{t.label}</div>
                <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.5 }}>{t.blurb}</div>
              </a>
            ))}
          </div>
        </>
      )}

      {/* FAQs */}
      {grouped.length === 0 ? (
        <div style={{
          background: "white", border: "1px solid #E2E8F0", borderRadius: 14,
          padding: "48px 24px", textAlign: "center", color: "#64748B",
        }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🔍</div>
          <p style={{ margin: 0, fontSize: 14 }}>No results for &quot;{query}&quot;. Try different keywords or contact support below.</p>
        </div>
      ) : (
        grouped.map((group) => (
          <section key={group.anchor} id={group.anchor} style={{ marginBottom: 36, scrollMarginTop: 80 }}>
            <h2 style={sectionHeading}>
              <span style={{ marginRight: 8 }}>{group.icon}</span>{group.label}
            </h2>
            <div style={{
              background: "white", border: "1px solid #E2E8F0", borderRadius: 14, overflow: "hidden",
            }}>
              {group.faqs.map((f) => {
                const idx = FAQS.indexOf(f)
                const open = openIdx === idx
                return (
                  <div key={idx} style={{ borderBottom: "1px solid #F1F5F9" }}>
                    <button
                      onClick={() => setOpenIdx(open ? null : idx)}
                      style={{
                        width: "100%", background: "none", border: "none", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "16px 20px", textAlign: "left", fontSize: 14,
                        fontWeight: 600, color: "#0F172A",
                      }}
                    >
                      <span>{f.q}</span>
                      <span style={{
                        fontSize: 18, color: "#94A3B8",
                        transform: open ? "rotate(45deg)" : "rotate(0)",
                        transition: "transform 0.2s", lineHeight: 1, marginLeft: 12,
                      }}>+</span>
                    </button>
                    {open && (
                      <div style={{
                        padding: "0 20px 18px",
                        fontSize: 13.5, color: "#475569", lineHeight: 1.65,
                      }}>
                        {f.a}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        ))
      )}

      {/* Contact */}
      <section style={{
        marginTop: 40,
        background: "linear-gradient(135deg, #E0F4FA 0%, #F0F9FF 100%)",
        border: "1px solid #BAE6FD",
        borderRadius: 16, padding: isMobile ? "22px 20px" : "28px 28px 24px",
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr auto",
        gap: isMobile ? 16 : 20,
        alignItems: "center",
      }}>
        <div>
          <h3 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 700, color: "#0F172A" }}>
            Still need help?
          </h3>
          <p style={{ margin: 0, fontSize: 13.5, color: "#475569", lineHeight: 1.6 }}>
            Email us at{" "}
            <a href="mailto:support@wish-it.app" style={{ color: "#38A3C7", fontWeight: 600 }}>
              support@wish-it.app
            </a>{" "}
            and we&apos;ll get back within 24 hours.
          </p>
        </div>
        <Link
          href="mailto:support@wish-it.app"
          style={{
            background: "#38A3C7", color: "white",
            padding: "12px 22px", borderRadius: 10, textDecoration: "none",
            fontWeight: 700, fontSize: 13, letterSpacing: "0.05em",
            whiteSpace: "nowrap",
          }}
        >
          CONTACT SUPPORT
        </Link>
      </section>

    </div>
  )
}

const sectionHeading: React.CSSProperties = {
  fontSize: 16, fontWeight: 700, color: "#0F172A",
  margin: "0 0 14px",
}
