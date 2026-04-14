"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { createClient } from "@/lib/supabase/client"
import { acceptFriendRequest, declineFriendRequest } from "@/lib/actions/friends"
import { markAllNotificationsRead } from "@/lib/actions/notifications"
import type { Notification } from "@/types"

export default function NotificationBell() {
  const [open, setOpen]                 = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount]   = useState(0)
  const [loading, setLoading]           = useState(false)
  const [isPending, start]              = useTransition()
  const dropdownRef                     = useRef<HTMLDivElement>(null)

  // Fetch unread count on mount
  useEffect(() => {
    fetchUnreadCount()
  }, [])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [open])

  async function fetchUnreadCount() {
    const supabase = createClient()
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("is_read", false)
    setUnreadCount(count ?? 0)
  }

  async function fetchNotifications() {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from("notifications")
      .select("*, actor:actor_id(id, username, first_name, last_name, avatar_url)")
      .order("created_at", { ascending: false })
      .limit(25)
    setNotifications((data as unknown as Notification[]) ?? [])
    setLoading(false)
  }

  function handleOpen() {
    setOpen(true)
    fetchNotifications()
    // Optimistically clear badge
    setUnreadCount(0)
    // Mark all as read server-side (fire-and-forget)
    start(() => void markAllNotificationsRead())
  }

  function handleFriendAction(notifId: string, type: "accept" | "decline", friendshipId: string) {
    start(async () => {
      if (type === "accept") await acceptFriendRequest(friendshipId)
      else await declineFriendRequest(friendshipId)
      // Remove handled notification from list
      setNotifications((prev) => prev.map((n) =>
        n.id === notifId ? { ...n, type: "friend_accepted" as any } : n
      ))
    })
  }

  return (
    <div ref={dropdownRef} style={{ position: "relative" }}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: "#64748B", display: "flex", alignItems: "center",
          position: "relative",
        }}
        title="Notifications"
      >
        <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span style={{
            position: "absolute", top: -4, right: -4,
            minWidth: 16, height: 16, borderRadius: 8,
            background: "#EF4444", color: "white",
            fontSize: 10, fontWeight: 700, lineHeight: "16px",
            textAlign: "center", padding: "0 3px",
          }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 12px)", right: 0,
          background: "white", borderRadius: 14,
          boxShadow: "0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)",
          border: "1px solid #F1F5F9",
          width: 340, maxHeight: 460, overflowY: "auto",
          zIndex: 200,
        }}>
          {/* Header */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "14px 16px 10px",
            borderBottom: "1px solid #F1F5F9",
          }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>Notifications</span>
            <button
              onClick={() => setOpen(false)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#94A3B8", fontSize: 18, lineHeight: 1 }}
            >
              ×
            </button>
          </div>

          {loading ? (
            <div style={{ padding: "32px 0", textAlign: "center", color: "#94A3B8", fontSize: 13 }}>
              Loading…
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ padding: "40px 16px", textAlign: "center", color: "#94A3B8", fontSize: 13 }}>
              No notifications yet
            </div>
          ) : (
            notifications.map((n) => (
              <NotifRow
                key={n.id}
                notification={n}
                isPending={isPending}
                onFriendAction={handleFriendAction}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ── Single notification row ──────────────────────────────────
function NotifRow({
  notification: n, isPending, onFriendAction,
}: {
  notification: Notification
  isPending: boolean
  onFriendAction: (notifId: string, type: "accept" | "decline", friendshipId: string) => void
}) {
  const actor = n.actor
  const actorName = actor
    ? (actor.first_name ? `${actor.first_name} ${actor.last_name ?? ""}`.trim() : actor.username) ?? "Someone"
    : "Someone"

  function renderBody() {
    switch (n.type) {
      case "friend_request":
        return (
          <>
            <p style={textStyle}><strong>{actorName}</strong> sent you a friend request</p>
            {n.target_id && (
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <SmallBtn
                  label="Accept"
                  primary
                  disabled={isPending}
                  onClick={() => onFriendAction(n.id, "accept", n.target_id!)}
                />
                <SmallBtn
                  label="Decline"
                  disabled={isPending}
                  onClick={() => onFriendAction(n.id, "decline", n.target_id!)}
                />
              </div>
            )}
          </>
        )
      case "friend_accepted":
        return (
          <p style={textStyle}><strong>{actorName}</strong> accepted your friend request</p>
        )
      case "wishlist_followed":
        return (
          <p style={textStyle}><strong>{actorName}</strong> followed one of your wishlists</p>
        )
      default:
        return null
    }
  }

  return (
    <div style={{
      display: "flex", gap: 12, padding: "12px 16px",
      borderBottom: "1px solid #F8FAFC",
      background: n.is_read ? "transparent" : "#F0F9FF",
    }}>
      {/* Actor avatar */}
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        background: "#38A3C7", flexShrink: 0, overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "white", fontWeight: 700, fontSize: 13,
      }}>
        {actor?.avatar_url
          ? <img src={actor.avatar_url} alt={actorName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : (actorName[0] ?? "?")}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {renderBody()}
        <p style={{ margin: "4px 0 0", fontSize: 11, color: "#94A3B8" }}>
          {timeAgo(n.created_at)}
        </p>
      </div>
    </div>
  )
}

function SmallBtn({
  label, onClick, primary = false, disabled,
}: { label: string; onClick: () => void; primary?: boolean; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontSize: 11, fontWeight: 700, padding: "5px 12px",
        borderRadius: 6, border: "1.5px solid",
        cursor: "pointer",
        background:  primary ? "#0F172A" : "transparent",
        color:       primary ? "white"   : "#334155",
        borderColor: primary ? "#0F172A" : "#E2E8F0",
        opacity: disabled ? 0.6 : 1,
        letterSpacing: "0.03em",
      }}
    >
      {label}
    </button>
  )
}

const textStyle: React.CSSProperties = {
  margin: 0, fontSize: 13, color: "#0F172A", lineHeight: 1.45,
}

function timeAgo(dateStr: string): string {
  const diff  = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 1)  return "Just now"
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days  < 7)  return `${days}d ago`
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}
