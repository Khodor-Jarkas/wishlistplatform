"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Button from "@/components/ui/Button"
import InspirationsDropdown from "@/components/wishit/InspirationsDropdown"
import ProfilePanel from "@/components/auth/ProfilePanel"
import NotificationBell from "@/components/notifications/NotificationBell"
import FriendsDrawer from "@/components/friends/FriendsDrawer"
import { useAddWishModal } from "@/context/AddWishModalContext"
import { getInitials } from "@/lib/utils"
import type { Profile } from "@/types"

interface Props {
  profile: Profile
  email: string
}

export default function AppHeaderClient({ profile, email }: Props) {
  const [inspOpen, setInspOpen]     = useState(false)
  const [panelOpen, setPanelOpen]   = useState(false)
  const [notifOpen, setNotifOpen]   = useState(false)
  const [friendsOpen, setFriendsOpen] = useState(false)
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

              {/* Friends */}
              <FriendsDrawer
                open={friendsOpen}
                onOpen={() => { setFriendsOpen(true); setNotifOpen(false); setPanelOpen(false) }}
                onClose={() => setFriendsOpen(false)}
                currentUserId={profile.id}
              />

              {/* Notification bell */}
              <NotificationBell
                open={notifOpen}
                onOpen={() => { setNotifOpen(true); setFriendsOpen(false); setPanelOpen(false) }}
                onClose={() => setNotifOpen(false)}
              />

              {/* Avatar */}
              <button
                onClick={() => { setPanelOpen(true); setNotifOpen(false); setFriendsOpen(false) }}
                style={{
                  width: 36, height: 36, borderRadius: "50%", background: "#38A3C7",
                  border: "none", cursor: "pointer", color: "white", fontWeight: 700, fontSize: 13,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  position: "relative", overflow: "hidden", padding: 0,
                }}
              >
                {initials}
                {profile.avatar_url && (
                  <img
                    src={profile.avatar_url}
                    alt=""
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => { e.currentTarget.style.display = "none" }}
                  />
                )}
              </button>
            </div>

          </div>
        </div>
      </header>

      <ProfilePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        profile={profile}
        email={email}
      />
    </>
  )
}
