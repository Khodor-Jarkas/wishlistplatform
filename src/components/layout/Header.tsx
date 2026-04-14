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
import AuthModal from "@/components/auth/AuthModal"

export default function Header() {
  const { user, profile, loading } = useUser()
  const { openLogin, openSignup }  = useAuthModal()
  const [inspOpen, setInspOpen]    = useState(false)
  const [panelOpen, setPanelOpen]  = useState(false)
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
                <div className="flex items-center gap-4 shrink-0">
                  <Button href="/wishlists/new" style={{ fontSize: 12, letterSpacing: "0.05em" }}>
                    ☁ ADD WISH
                  </Button>

                  {/* Add friend */}
                  <button className="bg-transparent border-none cursor-pointer text-neutral-500 hover:text-brand" title="Find friends">
                    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-6 3a5 5 0 110-10 5 5 0 010 10zm-7 7a8 8 0 0116 0H3z" />
                    </svg>
                  </button>

                  {/* Bell */}
                  <button className="bg-transparent border-none cursor-pointer text-neutral-500 hover:text-brand" title="Notifications">
                    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </button>

                  {/* Avatar */}
                  <button
                    onClick={() => setPanelOpen(true)}
                    style={{
                      width: 36, height: 36, borderRadius: "50%", background: "#38A3C7",
                      border: "none", cursor: "pointer", color: "white", fontWeight: 700, fontSize: 13,
                    }}
                  >
                    {initials}
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

      {/* Profile panel */}
      {panelOpen && profile && (
        <ProfilePanel
          profile={profile}
          email={user?.email ?? ""}
          onClose={() => setPanelOpen(false)}
        />
      )}

      {/* Auth modal — rendered here so it overlays the full page */}
      <AuthModal />
    </>
  )
}
