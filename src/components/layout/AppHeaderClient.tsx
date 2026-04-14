"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Button from "@/components/ui/Button"
import InspirationsDropdown from "@/components/wishit/InspirationsDropdown"
import ProfilePanel from "@/components/auth/ProfilePanel"
import NotificationBell from "@/components/notifications/NotificationBell"
import { useAddWishModal } from "@/context/AddWishModalContext"
import { getInitials } from "@/lib/utils"
import type { Profile } from "@/types"

interface Props {
  profile: Profile
  email: string
}

export default function AppHeaderClient({ profile, email }: Props) {
  const [inspOpen, setInspOpen] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { open: openAddWish } = useAddWishModal()
  const pathname = usePathname()

  const handleEnter = () => { if (closeTimer.current) clearTimeout(closeTimer.current); setInspOpen(true) }
  const handleLeave = () => { closeTimer.current = setTimeout(() => setInspOpen(false), 150) }

  const initials = getInitials(profile)

  return (
    <>
      <header style={{ background: "white", borderBottom: "1px solid #E2E8F0", position: "relative", zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 80 }}>

            {/* Logo */}
            <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none", flexShrink: 0 }}>
              <img src="/surprise.png" width={44} height={44} alt="Wish It logo" />
              <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: "0.05em", color: "#0F172A" }}>WISH IT</span>
            </Link>

            {/* Center nav */}
            <nav style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 32 }}>
              <Link href="/dashboard" style={{ fontSize: 14, fontWeight: 500, color: pathname.startsWith("/dashboard") || pathname.startsWith("/wishlists") ? "#38A3C7" : "#334155", textDecoration: "none" }}>
                Wishlists
              </Link>
              <Link href="/activity" style={{ fontSize: 14, fontWeight: pathname.startsWith("/activity") ? 500 : 400, color: pathname.startsWith("/activity") ? "#38A3C7" : "#334155", textDecoration: "none" }}>
                Activity
              </Link>
              <div
                style={{ position: "relative", cursor: "pointer", userSelect: "none" }}
                onMouseEnter={handleEnter}
                onMouseLeave={handleLeave}
              >
                <Link href="/inspire" style={{ fontSize: 14, fontWeight: pathname.startsWith("/inspire") ? 500 : 400, color: pathname.startsWith("/inspire") ? "#38A3C7" : "#334155", textDecoration: "none" }}>Inspiration</Link>
                {inspOpen && <InspirationsDropdown onMouseEnter={handleEnter} onMouseLeave={handleLeave} />}
              </div>
            </nav>

            {/* Right actions */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
              <Button onClick={openAddWish} style={{ fontSize: 12, letterSpacing: "0.05em" }}>
                ☁ ADD WISH
              </Button>

              {/* Add friend */}
              <Link
                href="/friends"
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B", display: "flex", alignItems: "center", textDecoration: "none" }}
                title="Friends"
              >
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-6 3a5 5 0 110-10 5 5 0 010 10zm-7 7a8 8 0 0116 0H3z" />
                </svg>
              </Link>

              {/* Notification bell */}
              <NotificationBell />

              {/* Avatar */}
              <button
                onClick={() => setPanelOpen(true)}
                style={{
                  width: 36, height: 36, borderRadius: "50%", background: "#38A3C7",
                  border: "none", cursor: "pointer", color: "white", fontWeight: 700, fontSize: 13,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {initials}
              </button>
            </div>

          </div>
        </div>
      </header>

      {panelOpen && (
        <ProfilePanel
          profile={profile}
          email={email}
          onClose={() => setPanelOpen(false)}
        />
      )}
    </>
  )
}
