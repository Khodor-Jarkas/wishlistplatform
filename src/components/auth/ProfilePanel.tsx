"use client"

import Link from "next/link"
import { signOut } from "@/lib/actions/auth"
import { getInitials } from "@/lib/utils"
import type { Profile } from "@/types"

interface Props {
  profile: Profile
  email: string
  onClose: () => void
}

const quickLinks = [
  { icon: "🔖", label: "Reservations", href: "/reservations" },
  { icon: "👥", label: "Friends",      href: "/friends"      },
  { icon: "📋", label: "Activity",     href: "/activity"     },
  { icon: "👤", label: "Account",      href: "/profile"      },
]

const listLinks = [
  { icon: "❓", label: "Help", href: "/help" },
]

export default function ProfilePanel({ profile, email, onClose }: Props) {
  const initials = getInitials(profile)

  const displayName = profile.first_name
    ? `${profile.first_name} ${profile.last_name ?? ""}`.trim()
    : profile.full_name ?? profile.username ?? "User"

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, zIndex: 90, background: "rgba(0,0,0,0.2)" }}
      />

      {/* Panel */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 95,
          background: "white",
          borderRadius: 20,
          width: "100%",
          maxWidth: 400,
          padding: "24px 20px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Profile</h2>
          <button
            onClick={onClose}
            style={{ background: "#F1F5F9", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: 14 }}
          >
            ✕
          </button>
        </div>

        {/* User card */}
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "#F8FAFC", borderRadius: 12, padding: "14px 16px", marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: "50%", background: "#38A3C7",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontWeight: 700, fontSize: 16,
            }}>
              {initials}
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>{displayName}</p>
              <p style={{ margin: 0, fontSize: 12, color: "#64748B" }}>{email}</p>
            </div>
          </div>
          <button style={{ background: "none", border: "none", fontSize: 12, color: "#38A3C7", cursor: "pointer", fontWeight: 500 }}>
            Share
          </button>
        </div>

        {/* Quick links grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          {quickLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={onClose}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                background: "#F8FAFC", borderRadius: 12, padding: "14px 16px",
                textDecoration: "none", color: "#0F172A", fontSize: 14, fontWeight: 500,
              }}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>

        {/* List links */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
          {listLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={onClose}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "#F8FAFC", borderRadius: 12, padding: "14px 16px",
                textDecoration: "none", color: "#0F172A", fontSize: 14, fontWeight: 500,
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                {item.label}
              </span>
              <span style={{ color: "#94A3B8" }}>›</span>
            </Link>
          ))}
        </div>

        {/* Log out */}
        <form action={signOut}>
          <button
            type="submit"
            style={{
              width: "100%", padding: "14px", background: "#0F172A", color: "white",
              border: "none", borderRadius: 12, fontWeight: 700, fontSize: 14,
              letterSpacing: "0.05em", cursor: "pointer",
            }}
          >
            LOG OUT
          </button>
        </form>
      </div>
    </>
  )
}
