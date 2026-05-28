"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

function IconGrid({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  )
}

function IconActivity({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  )
}

function IconLightbulb({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 21h6M12 3a6 6 0 00-3.6 10.8C9.2 14.7 9 15.8 9 17h6c0-1.2-.2-2.3 1.4-3.2A6 6 0 0012 3z" />
    </svg>
  )
}

function IconPerson({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}

const tabs = [
  { href: "/dashboard", label: "Wishlists", Icon: IconGrid,      match: (p: string) => p.startsWith("/dashboard") || p.startsWith("/wishlists") },
  { href: "/activity",  label: "Activity",  Icon: IconActivity,  match: (p: string) => p.startsWith("/activity") },
  { href: "/inspire",   label: "Inspire",   Icon: IconLightbulb, match: (p: string) => p.startsWith("/inspire") },
  { href: "/profile",   label: "Profile",   Icon: IconPerson,    match: (p: string) => p.startsWith("/profile") },
]

export default function MobileBottomNav() {
  const pathname = usePathname()

  // Rendered always, hidden/shown via CSS media query to avoid hydration mismatch.
  return (
    <nav className="wi-mobile-nav" aria-label="Mobile navigation">
      {tabs.map(({ href, label, Icon, match }) => {
        const active = match(pathname)
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
              padding: "10px 0 8px",
              textDecoration: "none",
              color: active ? "#38A3C7" : "#94A3B8",
              transition: "color 0.15s",
            }}
          >
            <Icon active={active} />
            <span style={{
              fontSize: 10, fontWeight: active ? 600 : 400,
              marginTop: 3, letterSpacing: "0.02em",
            }}>
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
