"use client"

import { useRef, useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUser } from "@/hooks/useUser"
import { useAuthModal } from "@/context/AuthModalContext"
import { useAddWishModal } from "@/context/AddWishModalContext"
import { staticAvatarUrl } from "@/lib/utils"
import Container from "../ui/Container"
import Button from "../ui/Button"
import InspirationsDropdown from "@/components/wishit/InspirationsDropdown"
import ProfilePanel from "@/components/auth/ProfilePanel"
import NotificationBell from "@/components/notifications/NotificationBell"
import FriendsDrawer from "@/components/friends/FriendsDrawer"

const AuthModal = dynamic(() => import("@/components/auth/AuthModal"), { ssr: false })

export default function Header() {
  const { user, profile, loading } = useUser()
  const { openLogin, openSignup }  = useAuthModal()
  const { open: openAddWish }      = useAddWishModal()
  const [inspOpen, setInspOpen]       = useState(false)
  const [panelOpen, setPanelOpen]     = useState(false)
  const [notifOpen, setNotifOpen]     = useState(false)
  const [friendsOpen, setFriendsOpen] = useState(false)
  const [menuOpen, setMenuOpen]       = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pathname = usePathname()

  const handleEnter = () => { if (closeTimer.current) clearTimeout(closeTimer.current); setInspOpen(true) }
  const handleLeave = () => { closeTimer.current = setTimeout(() => setInspOpen(false), 150) }

  const initials = [profile?.first_name?.[0], profile?.last_name?.[0]]
    .filter(Boolean).join("").toUpperCase() || profile?.username?.[0]?.toUpperCase() || "?"

  const currentWishlistId = (() => {
    const m = pathname.match(/^\/wishlists\/([^/]+)\/?$/)
    return m && m[1] !== "new" ? m[1] : undefined
  })()

  const wishlistsActive = pathname.startsWith("/dashboard") || pathname.startsWith("/wishlists")
  const activityActive  = pathname.startsWith("/activity")
  const inspireActive   = pathname.startsWith("/inspire")

  return (
    <>
      {/* CSS classes handle responsive sizing — no useIsMobile needed */}
      <header className="bg-white border-b border-neutral-200 relative" style={{ zIndex: 100 }}>
        <Container>
          {/* Height is controlled by CSS via clamp — no JS media query */}
          <div className="flex justify-between items-center" style={{ height: "clamp(64px, 8vw, 80px)" }}>

            {/* Hamburger — visible on mobile via CSS (.wi-header-hamburger) */}
            {user && (
              <button
                className="wi-header-hamburger"
                onClick={() => setMenuOpen(v => !v)}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                aria-expanded={menuOpen}
                style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: menuOpen ? "#F1F5F9" : "transparent",
                  border: "none", cursor: "pointer",
                  alignItems: "center", justifyContent: "center",
                  flexShrink: 0, padding: 0,
                }}
              >
                <svg width="22" height="22" fill="none" stroke="#0F172A" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  {menuOpen
                    ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    : <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
                  }
                </svg>
              </button>
            )}

            {/* Logo */}
            <Link href="/" className="flex items-center no-underline shrink-0" style={{ gap: 12 }}>
              <img src="/surprise.png" width={44} height={44} alt="Wish It logo"
                style={{ width: "clamp(32px, 4vw, 44px)", height: "clamp(32px, 4vw, 44px)" }} />
              {/* "WISH IT" text: always shown when logged out; hidden on mobile when logged in via CSS */}
              <span
                className={user ? "wi-header-wordmark-auth" : "wi-header-wordmark"}
                style={{ fontWeight: 700, fontSize: "clamp(14px, 2vw, 18px)", letterSpacing: "0.05em", color: "#0F172A" }}
              >
                WISH IT
              </span>
            </Link>

            {/* ── Logged-in nav ── */}
            {user ? (
              <>
                {/* Center nav — hidden on mobile via CSS */}
                <nav className="wi-header-desktop-nav absolute left-1/2 -translate-x-1/2 items-center gap-8">
                  <Link href="/dashboard" className="text-sm no-underline transition-colors" style={{ fontWeight: 500, color: wishlistsActive ? "#38A3C7" : "#404040" }}>Wishlists</Link>
                  <Link href="/activity"  className="text-sm no-underline transition-colors" style={{ fontWeight: activityActive ? 500 : 400, color: activityActive ? "#38A3C7" : "#404040" }}>Activity</Link>
                  <div className="relative cursor-pointer select-none" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
                    <Link href="/inspire" className="text-sm no-underline transition-colors" style={{ fontWeight: inspireActive ? 500 : 400, color: inspireActive ? "#38A3C7" : "#404040" }}>Inspiration</Link>
                    {inspOpen && <InspirationsDropdown onMouseEnter={handleEnter} onMouseLeave={handleLeave} />}
                  </div>
                </nav>

                {/* Right actions */}
                <div className="flex items-center shrink-0" style={{ gap: 12 }}>
                  {/* Desktop Add Wish button */}
                  <div className="wi-header-desktop-add">
                    <Button onClick={() => openAddWish(currentWishlistId)} style={{ fontSize: 12, letterSpacing: "0.05em" }}>
                      ☁ ADD WISH
                    </Button>
                  </div>

                  {/* Mobile Add Wish button — circle, visible on mobile via CSS */}
                  <button
                    className="wi-header-mobile-add"
                    onClick={() => openAddWish(currentWishlistId)}
                    aria-label="Add wish"
                    style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: "#38A3C7", color: "white",
                      border: "none", cursor: "pointer",
                      fontSize: 18, fontWeight: 700,
                      alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    +
                  </button>

                  <FriendsDrawer
                    open={friendsOpen}
                    onOpen={() => { setFriendsOpen(true); setNotifOpen(false); setPanelOpen(false) }}
                    onClose={() => setFriendsOpen(false)}
                    currentUserId={user?.id ?? null}
                  />

                  <NotificationBell
                    open={notifOpen}
                    onOpen={() => { setNotifOpen(true); setFriendsOpen(false); setPanelOpen(false) }}
                    onClose={() => setNotifOpen(false)}
                    currentUserId={user?.id ?? null}
                  />

                  <button
                    onClick={() => { setPanelOpen(true); setNotifOpen(false); setFriendsOpen(false) }}
                    aria-label="Open profile"
                    style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: "#38A3C7", border: "2px solid transparent",
                      cursor: "pointer", color: "white", fontWeight: 700, fontSize: 13,
                      overflow: "hidden", flexShrink: 0,
                      transition: "border-color 0.15s",
                      outline: panelOpen ? "2px solid #38A3C7" : "none",
                      outlineOffset: 2,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      padding: 0,
                    }}
                  >
                    {profile?.avatar_url
                      ? <img src={staticAvatarUrl(profile.avatar_url)!} alt={initials} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : initials}
                  </button>
                </div>
              </>
            ) : !loading ? (
              /* ── Logged-out nav ── */
              <nav className="flex items-center" style={{ gap: 16 }}>
                <div className="wi-header-desktop-nav items-center" style={{ gap: 32 }}>
                  <div className="relative cursor-pointer select-none" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
                    <Link href="/inspire" className="text-sm text-neutral-700 hover:text-brand transition-colors no-underline">Inspiration</Link>
                    {inspOpen && <InspirationsDropdown onMouseEnter={handleEnter} onMouseLeave={handleLeave} />}
                  </div>
                  <button className="text-neutral-700 hover:text-brand transition-colors bg-transparent border-none cursor-pointer text-sm">
                    English
                  </button>
                </div>
                <Button variant="secondary" onClick={openLogin}>LOG IN</Button>
                <Button onClick={openSignup}>SIGN UP</Button>
              </nav>
            ) : (
              /* Loading skeleton */
              <div style={{ width: 180, height: 36, borderRadius: 8, background: "#F1F5F9" }} />
            )}

          </div>
        </Container>

        {/* Mobile nav drawer — shown when menuOpen (JS state) */}
        {user && menuOpen && (
          <>
            <div
              onClick={() => setMenuOpen(false)}
              style={{
                position: "fixed", inset: "64px 0 0 0",
                background: "rgba(15,23,42,0.3)", zIndex: 98,
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

      {user && (
        <ProfilePanel
          open={panelOpen}
          onClose={() => setPanelOpen(false)}
          profile={profile ?? {
            id: user.id,
            username: user.email ?? user.id,
            full_name: null, first_name: null, last_name: null,
            avatar_url: null, bio: null, date_of_birth: null,
            gender: null, phone: null, zip_code: null, country: null,
            is_private: false, is_creator: false, language: "en",
            created_at: "", updated_at: "",
          }}
          email={user.email ?? ""}
        />
      )}

      <AuthModal />
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
