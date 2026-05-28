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
import { getInitials, staticAvatarUrl } from "@/lib/utils"
import type { Profile } from "@/types"

// Partial profile — only fields fetched by AppHeader's narrowed select
type AppHeaderProfile = Pick<Profile, "id" | "username" | "first_name" | "last_name" | "full_name" | "avatar_url" | "bio" | "country" | "is_private" | "is_creator" | "language" | "created_at" | "updated_at"> & {
  date_of_birth?: string | null
  gender?: string | null
  phone?: string | null
  zip_code?: string | null
}

interface Props {
  profile: AppHeaderProfile
  email: string
}

export default function AppHeaderClient({ profile, email }: Props) {
  const [inspOpen, setInspOpen]       = useState(false)
  const [panelOpen, setPanelOpen]     = useState(false)
  const [notifOpen, setNotifOpen]     = useState(false)
  const [friendsOpen, setFriendsOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { open: openAddWish } = useAddWishModal()
  const pathname = usePathname()

  const handleEnter = () => { if (closeTimer.current) clearTimeout(closeTimer.current); setInspOpen(true) }
  const handleLeave = () => { closeTimer.current = setTimeout(() => setInspOpen(false), 150) }

  const initials = getInitials(profile)

  const navLink = (href: string, label: string, isActive: boolean) => (
    <Link
      href={href}
      style={{
        fontSize: 14, fontWeight: isActive ? 500 : 400,
        color: isActive ? "#38A3C7" : "#334155",
        textDecoration: "none",
      }}
    >
      {label}
    </Link>
  )

  const wishlistsActive = pathname.startsWith("/dashboard") || pathname.startsWith("/wishlists")
  const activityActive  = pathname.startsWith("/activity")
  const inspireActive   = pathname.startsWith("/inspire")

  const currentWishlistId = (() => {
    const m = pathname.match(/^\/wishlists\/([^/]+)\/?$/)
    return m && m[1] !== "new" ? m[1] : undefined
  })()

  return (
    <>
      {/* Header uses CSS classes for responsive sizing — no JS media query needed */}
      <header style={{ background: "white", borderBottom: "1px solid #E2E8F0", position: "relative", zIndex: 100 }}>
        <div className="wi-app-header-inner">

          {/* Logo */}
          <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none", flexShrink: 0 }}>
            <img src="/surprise.png" width={44} height={44} alt="Wish It logo" style={{ width: "clamp(34px, 5vw, 44px)", height: "clamp(34px, 5vw, 44px)" }} />
            <span style={{ fontWeight: 700, fontSize: "clamp(15px, 2vw, 18px)", letterSpacing: "0.05em", color: "#0F172A" }}>WISH IT</span>
          </Link>

          {/* Center nav — hidden on mobile via CSS */}
          <nav
            className="wi-app-header-desktop-nav"
            style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", alignItems: "center", gap: 32 }}
          >
            {navLink("/dashboard", "Wishlists", wishlistsActive)}
            {navLink("/activity",  "Activity",  activityActive)}
            <div
              style={{ position: "relative", cursor: "pointer", userSelect: "none" }}
              onMouseEnter={handleEnter}
              onMouseLeave={handleLeave}
            >
              {navLink("/inspire", "Inspiration", inspireActive)}
              {inspOpen && <InspirationsDropdown onMouseEnter={handleEnter} onMouseLeave={handleLeave} />}
            </div>
          </nav>

          {/* Right actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
            {/* Desktop Add Wish button — hidden on mobile via CSS */}
            <div className="wi-app-header-desktop-add">
              <Button onClick={() => openAddWish(currentWishlistId)} style={{ fontSize: 12, letterSpacing: "0.05em" }}>
                ☁ ADD WISH
              </Button>
            </div>

            {/* Mobile Add Wish button — shown on mobile via CSS */}
            <button
              className="wi-app-header-mobile-add"
              onClick={() => openAddWish(currentWishlistId)}
              aria-label="Add wish"
              style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "#38A3C7", color: "white",
                border: "none", cursor: "pointer",
                fontSize: 18, fontWeight: 700,
                alignItems: "center", justifyContent: "center",
              }}
            >
              +
            </button>

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
              currentUserId={profile.id}
            />

            {/* Avatar */}
            <button
              onClick={() => { setPanelOpen(true); setNotifOpen(false); setFriendsOpen(false) }}
              aria-label="Open profile"
              style={{
                width: 36, height: 36, borderRadius: "50%", background: "#38A3C7",
                border: "none", cursor: "pointer", color: "white", fontWeight: 700, fontSize: 13,
                display: "flex", alignItems: "center", justifyContent: "center",
                position: "relative", overflow: "hidden", padding: 0, flexShrink: 0,
              }}
            >
              {initials}
              {profile.avatar_url && (
                <img
                  src={staticAvatarUrl(profile.avatar_url)!}
                  alt=""
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => { e.currentTarget.style.display = "none" }}
                />
              )}
            </button>
          </div>

        </div>
      </header>

      <ProfilePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        profile={profile as Profile}
        email={email}
      />
    </>
  )
}
