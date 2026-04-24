"use client"

import Link from "next/link"
import { useIsTablet, useIsMobile } from "@/lib/hooks/useMediaQuery"

const InstagramIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
)
const FacebookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
)
const TikTokIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z"/>
  </svg>
)
const XIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
)

const socials = [
  { label: "Instagram", Icon: InstagramIcon, href: "#" },
  { label: "Facebook",  Icon: FacebookIcon,  href: "#" },
  { label: "TikTok",    Icon: TikTokIcon,    href: "#" },
  { label: "X",         Icon: XIcon,         href: "#" },
]

const links = {
  Product:  ["Create a Wishlist", "How It Works", "Inspiration", "Gift Finder"],
  Company:  ["About", "Blog", "Careers", "Press"],
  Support:  ["Help Center", "Contact Us", "Privacy Policy", "Terms of Service"],
}

export default function Footer() {
  const isTablet = useIsTablet()
  const isMobile = useIsMobile()

  return (
    <footer style={{ background: "#0F172A", color: "white" }}>

      {/* ── Main content ── */}
      <div style={{
        maxWidth: 1200, margin: "0 auto",
        padding: isMobile ? "48px 20px 36px" : "72px 32px 56px",
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr 1fr" : "2fr 1fr 1fr 1fr",
          gap: isMobile ? 32 : 48,
          alignItems: "flex-start",
        }}>

          {/* Brand column */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
              <img src="/surprise.png" width={36} height={36} alt="Wish It" />
              <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: "0.06em" }}>WISH IT</span>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: "#94A3B8", maxWidth: 280, marginBottom: 28 }}>
              The easiest way to create, share, and manage wishlists with friends and family. No more duplicate gifts.
            </p>

            {/* Socials */}
            <div style={{ display: "flex", gap: 10 }}>
              {socials.map(({ label, Icon, href }) => (
                <a
                  key={label}
                  href={href}
                  title={label}
                  style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#94A3B8", textDecoration: "none",
                    transition: "background 0.15s, color 0.15s",
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget
                    el.style.background = "rgba(255,255,255,0.14)"
                    el.style.color = "white"
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget
                    el.style.background = "rgba(255,255,255,0.07)"
                    el.style.color = "#94A3B8"
                  }}
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([heading, items]) => (
            <div key={heading}>
              <h4 style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#64748B", marginBottom: 16 }}>
                {heading}
              </h4>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                {items.map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      style={{
                        fontSize: 14, color: "#94A3B8", textDecoration: "none",
                        transition: "color 0.15s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = "white"}
                      onMouseLeave={e => e.currentTarget.style.color = "#94A3B8"}
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{
          maxWidth: 1200, margin: "0 auto",
          padding: isMobile ? "16px 20px" : "20px 32px",
          display: "flex", alignItems: "center",
          justifyContent: isMobile ? "center" : "space-between",
          flexWrap: "wrap", gap: isMobile ? 8 : 12,
          textAlign: isMobile ? "center" : "left",
        }}>
          <p style={{ fontSize: 13, color: "#475569", margin: 0 }}>
            © {new Date().getFullYear()} Wish It. All rights reserved.
          </p>
          <div style={{ display: "flex", gap: isMobile ? 14 : 24, flexWrap: "wrap", justifyContent: "center" }}>
            {["Privacy Policy", "Terms of Service", "Cookie Settings"].map((item) => (
              <a
                key={item}
                href="#"
                style={{ fontSize: 13, color: "#475569", textDecoration: "none", transition: "color 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.color = "#94A3B8"}
                onMouseLeave={e => e.currentTarget.style.color = "#475569"}
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>

    </footer>
  )
}
