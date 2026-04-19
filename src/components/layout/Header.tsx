"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useUser } from "@/hooks/useUser"
import { useAuthModal } from "@/context/AuthModalContext"
import Container from "../ui/Container"
import Button from "../ui/Button"
import InspirationsDropdown from "@/components/wishit/InspirationsDropdown"
import ProfilePanel from "@/components/auth/ProfilePanel"
import NotificationBell from "@/components/notifications/NotificationBell"
import FriendsDrawer from "@/components/friends/FriendsDrawer"
import AuthModal from "@/components/auth/AuthModal"

export default function Header() {
  const { user, profile, loading } = useUser()
  const { openLogin, openSignup }  = useAuthModal()
  const [inspOpen, setInspOpen]      = useState(false)
  const [panelOpen, setPanelOpen]    = useState(false)
  const [notifOpen, setNotifOpen]    = useState(false)
  const [friendsOpen, setFriendsOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pathname = usePathname()

  const handleEnter = () => { if (closeTimer.current) clearTimeout(closeTimer.current); setInspOpen(true) }
  const handleLeave = () => { closeTimer.current = setTimeout(() => setInspOpen(false), 150) }

  const initials = [profile?.first_name?.[0], profile?.last_name?.[0]]
    .filter(Boolean).join("").toUpperCase() || profile?.username?.[0]?.toUpperCase() || "?"

  return (
    <>
      <header className="bg-white border-b border-neutral-200 relative" style={{ zIndex: 100 }}>
        <Container>
          <div className="flex justify-between items-center h-[80px]">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 no-underline shrink-0">
              <img src="/surprise.png" width={44} height={44} alt="Wish It logo" />
              <span className="font-bold text-lg tracking-wide text-neutral-900">WISH IT</span>
            </Link>

            {/* Nav — logged in */}
            {!loading && user ? (
              <>
                {/* Center nav */}
                <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-8">
                  <Link href="/dashboard" className="text-sm no-underline transition-colors" style={{ fontWeight: 500, color: pathname.startsWith("/dashboard") || pathname.startsWith("/wishlists") ? "#38A3C7" : "#404040" }}>Wishlists</Link>
                  <Link href="/activity"  className="text-sm no-underline transition-colors" style={{ fontWeight: pathname.startsWith("/activity") ? 500 : 400, color: pathname.startsWith("/activity") ? "#38A3C7" : "#404040" }}>Activity</Link>
                  <div className="relative cursor-pointer select-none" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
                    <Link href="/inspire" className="text-sm no-underline transition-colors" style={{ fontWeight: pathname.startsWith("/inspire") ? 500 : 400, color: pathname.startsWith("/inspire") ? "#38A3C7" : "#404040" }}>Inspiration</Link>
                    {inspOpen && <InspirationsDropdown onMouseEnter={handleEnter} onMouseLeave={handleLeave} />}
                  </div>
                </nav>

                {/* Right actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <Button href="/wishlists/new" style={{ fontSize: 12, letterSpacing: "0.05em" }}>
                    ☁ ADD WISH
                  </Button>

                  {/* Friends */}
                  <FriendsDrawer
                    open={friendsOpen}
                    onOpen={() => { setFriendsOpen(true); setNotifOpen(false); setPanelOpen(false) }}
                    onClose={() => setFriendsOpen(false)}
                    currentUserId={user?.id ?? null}
                  />

                  {/* Notifications */}
                  <NotificationBell
                    open={notifOpen}
                    onOpen={() => { setNotifOpen(true); setFriendsOpen(false); setPanelOpen(false) }}
                    onClose={() => setNotifOpen(false)}
                  />

                  {/* Avatar → profile drawer */}
                  <button
                    onClick={() => { setPanelOpen(true); setNotifOpen(false); setFriendsOpen(false) }}
                    style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: "#38A3C7", border: "2px solid transparent",
                      cursor: "pointer", color: "white", fontWeight: 700, fontSize: 13,
                      overflow: "hidden", flexShrink: 0,
                      transition: "border-color 0.15s",
                      outline: panelOpen ? "2px solid #38A3C7" : "none",
                      outlineOffset: 2,
                    }}
                    title="Profile"
                  >
                    {profile?.avatar_url
                      ? <img src={profile.avatar_url} alt={initials} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : initials}
                  </button>
                </div>
              </>
            ) : (
              /* Nav — logged out */
              <nav className="flex items-center gap-8">
                <div className="relative cursor-pointer select-none" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
                  <Link href="/inspire" className="text-sm text-neutral-700 hover:text-brand transition-colors no-underline">Inspiration</Link>
                  {inspOpen && <InspirationsDropdown onMouseEnter={handleEnter} onMouseLeave={handleLeave} />}
                </div>

                <button className="text-neutral-700 hover:text-brand transition-colors bg-transparent border-none cursor-pointer text-sm">
                  English
                </button>

                <Button variant="secondary" onClick={openLogin}>LOG IN</Button>
                <Button onClick={openSignup}>SIGN UP</Button>
              </nav>
            )}

          </div>
        </Container>
      </header>

      {/* Profile drawer */}
      {profile && (
        <ProfilePanel
          open={panelOpen}
          onClose={() => setPanelOpen(false)}
          profile={profile}
          email={user?.email ?? ""}
        />
      )}

      {/* Auth modal */}
      <AuthModal />
    </>
  )
}
