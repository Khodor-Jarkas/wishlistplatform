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
import { useIsMobile } from "@/lib/hooks/useMediaQuery"
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
  const [menuOpen, setMenuOpen]     = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { open: openAddWish } = useAddWishModal()
  const pathname = usePathname()
  const isMobile = useIsMobile()

  const handleEnter = () => { if (closeTimer.current) clearTimeout(closeTimer.current); setInspOpen(true) }
  const handleLeave = () => { closeTimer.current = setTimeout(() => setInspOpen(false), 150) }

  const initials = getInitials(profile)

  const navLink = (href: string, label: string, isActive: boolean) => (
    <Link
      href={href}
      onClick={() => setMenuOpen(false)}
      style={{
        fontSize: 14, fontWeight: isActive ? 500 : 400,
        color: isActive ? "#38A3C7" : "#334155",
        textDecoration: "none",
      }}
    >
      {label}
    </Link>
  )

  const wishlistsActive  = pathname.startsWith("/dashboard") || pathname.startsWith("/wishlists")
  const activityActive   = pathname.startsWith("/activity")
  const inspireActive    = pathname.startsWith("/inspire")

  return (
    <>
      <header style={{ background: "white", borderBottom: "1px solid #E2E8F0", position: "relative", zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "0 16px" : "0 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: isMobile ? 64 : 80, gap: 12 }}>

            {/* Hamburger (mobile only) */}
            {isMobile && (
              <button
                onClick={() => setMenuOpen(v => !v)}
                aria-label="Menu"
                style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: menuOpen ? "#F1F5F9" : "transparent",
                  border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, padding: 0,
                }}
              >
                <svg width="22" height="22" fill="none" stroke="#0F172A" strokeWidth="2" viewBox="0 0 24 24">
                  {menuOpen
                    ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    : <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
                  }
                </svg>
              </button>
            )}

            {/* Logo */}
            <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 12, textDecoration: "none", flexShrink: 0 }}>
              <img src="/surprise.png" width={isMobile ? 34 : 44} height={isMobile ? 34 : 44} alt="Wish It logo" />
              {!isMobile && (
                <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: "0.05em", color: "#0F172A" }}>WISH IT</span>
              )}
            </Link>

            {/* Center nav (desktop only) */}
            {!isMobile && (
              <nav style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 32 }}>
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
            )}

            {/* Right actions */}
            <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 16, flexShrink: 0 }}>
              {!isMobile && (
                <Button onClick={openAddWish} style={{ fontSize: 12, letterSpacing: "0.05em" }}>
                  ☁ ADD WISH
                </Button>
              )}
              {isMobile && (
                <button
                  onClick={() => openAddWish()}
                  aria-label="Add wish"
                  style={{
                    width: 36, height: 36, borderRadius: "50%",
                    background: "#38A3C7", color: "white",
                    border: "none", cursor: "pointer",
                    fontSize: 18, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  +
                </button>
              )}

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
                  position: "relative", overflow: "hidden", padding: 0, flexShrink: 0,
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

        {/* Mobile menu drawer */}
        {isMobile && menuOpen && (
          <>
            <div
              onClick={() => setMenuOpen(false)}
              style={{
                position: "fixed", inset: "64px 0 0 0", background: "rgba(15,23,42,0.3)",
                zIndex: 98,
              }}
            />
            <nav style={{
              position: "absolute", top: "100%", left: 0, right: 0,
              background: "white", borderBottom: "1px solid #E2E8F0",
              padding: "12px 16px 20px", display: "flex", flexDirection: "column", gap: 4,
              boxShadow: "0 8px 24px rgba(0,0,0,0.08)", zIndex: 99,
            }}>
              <MobileLink href="/dashboard" active={wishlistsActive} onClick={() => setMenuOpen(false)}>Wishlists</MobileLink>
              <MobileLink href="/activity"  active={activityActive}  onClick={() => setMenuOpen(false)}>Activity</MobileLink>
              <MobileLink href="/inspire"   active={inspireActive}   onClick={() => setMenuOpen(false)}>Inspiration</MobileLink>
            </nav>
          </>
        )}
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

function MobileLink({
  href, active, onClick, children,
}: { href: string; active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display: "block", padding: "12px 14px", borderRadius: 10,
        textDecoration: "none", fontSize: 15, fontWeight: 600,
        background: active ? "#E0F4FA" : "transparent",
        color: active ? "#1E6B88" : "#0F172A",
      }}
    >
      {children}
    </Link>
  )
}
