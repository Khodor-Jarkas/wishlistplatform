"use client"

import Link from "next/link"
import { signOut } from "@/lib/actions/auth"
import { getInitials } from "@/lib/utils"
import Drawer from "@/components/ui/Drawer"
import type { Profile } from "@/types"

interface Props {
  open: boolean
  onClose: () => void
  profile: Profile
  email: string
}

const quickLinks = [
  { icon: "🔖", label: "Reservations", href: "/reservations" },
  { icon: "👥", label: "Friends",      href: "/friends"      },
  { icon: "📋", label: "Activity",     href: "/activity"     },
  { icon: "👤", label: "Account",      href: "/profile"      },
]

export default function ProfilePanel({ open, onClose, profile, email }: Props) {
  const initials = getInitials(profile)
  const displayName = profile.first_name
    ? `${profile.first_name} ${profile.last_name ?? ""}`.trim()
    : profile.full_name ?? profile.username ?? "User"

  return (
    <Drawer open={open} onClose={onClose} title="Profile">
      <div style={{ padding: "20px" }}>

        {/* User card */}
        <div style={{
          display: "flex", alignItems: "center", gap: 14,
          background: "linear-gradient(135deg, #1E8FAD, #38A3C7)",
          borderRadius: 16, padding: "18px 20px", marginBottom: 20,
          color: "white",
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%",
            background: "rgba(255,255,255,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: 20, flexShrink: 0,
            boxShadow: "0 0 0 3px rgba(255,255,255,0.3)",
            overflow: "hidden",
          }}>
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: 16, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {displayName}
            </p>
            <p style={{ margin: 0, fontSize: 12, opacity: 0.8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {email}
            </p>
          </div>
        </div>

        {/* Quick links grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          {quickLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={onClose}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: 8, background: "#F8FAFC", borderRadius: 14, padding: "18px 12px",
                textDecoration: "none", color: "#0F172A", fontSize: 13, fontWeight: 600,
                border: "1px solid #F1F5F9",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#F1F5F9"}
              onMouseLeave={e => e.currentTarget.style.background = "#F8FAFC"}
            >
              <span style={{ fontSize: 24 }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "#F1F5F9", marginBottom: 16 }} />

        {/* Help link */}
        <Link
          href="/help"
          onClick={onClose}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "#F8FAFC", borderRadius: 12, padding: "14px 16px",
            textDecoration: "none", color: "#0F172A", fontSize: 14, fontWeight: 500,
            marginBottom: 12, border: "1px solid #F1F5F9",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>❓</span> Help & Support
          </span>
          <span style={{ color: "#94A3B8" }}>›</span>
        </Link>

        {/* Log out */}
        <form action={signOut}>
          <button
            type="submit"
            style={{
              width: "100%", padding: "14px",
              background: "#0F172A", color: "white",
              border: "none", borderRadius: 12,
              fontWeight: 700, fontSize: 14,
              letterSpacing: "0.05em", cursor: "pointer",
              marginTop: 4,
            }}
          >
            LOG OUT
          </button>
        </form>
      </div>
    </Drawer>
  )
}
