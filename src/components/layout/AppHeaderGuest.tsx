"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { useRef, useState } from "react"
import { useAuthModal } from "@/context/AuthModalContext"
import Button from "@/components/ui/Button"
import InspirationsDropdown from "@/components/wishit/InspirationsDropdown"

const AuthModal = dynamic(() => import("@/components/auth/AuthModal"), { ssr: false })

export default function AppHeaderGuest() {
  const { openLogin, openSignup } = useAuthModal()
  const [inspOpen, setInspOpen] = useState(false)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleEnter = () => { if (closeTimer.current) clearTimeout(closeTimer.current); setInspOpen(true) }
  const handleLeave = () => { closeTimer.current = setTimeout(() => setInspOpen(false), 150) }

  return (
    <>
      <header style={{ background: "white", borderBottom: "1px solid #E2E8F0", position: "relative", zIndex: 100 }}>
        <div className="wi-app-header-inner">

          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none", flexShrink: 0 }}>
            <img src="/surprise.png" width={44} height={44} alt="Wish It logo" style={{ width: "clamp(34px, 5vw, 44px)", height: "clamp(34px, 5vw, 44px)" }} />
            <span style={{ fontWeight: 700, fontSize: "clamp(15px, 2vw, 18px)", letterSpacing: "0.05em", color: "#0F172A" }}>WISH IT</span>
          </Link>

          <nav
            className="wi-app-header-desktop-nav"
            style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", alignItems: "center", gap: 32 }}
          >
            <div
              style={{ position: "relative", cursor: "pointer", userSelect: "none" }}
              onMouseEnter={handleEnter}
              onMouseLeave={handleLeave}
            >
              <Link href="/inspire" style={{ fontSize: 14, fontWeight: 500, color: "#38A3C7", textDecoration: "none" }}>
                Inspiration
              </Link>
              {inspOpen && <InspirationsDropdown onMouseEnter={handleEnter} onMouseLeave={handleLeave} />}
            </div>
          </nav>

          <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <Button variant="secondary" onClick={openLogin}>LOG IN</Button>
            <Button onClick={openSignup}>SIGN UP</Button>
          </div>

        </div>
      </header>

      <AuthModal />
    </>
  )
}
