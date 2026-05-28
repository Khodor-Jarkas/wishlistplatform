"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { createClient, withQueryTimeout } from "@/lib/supabase/client"
import { acceptFriendRequest, declineFriendRequest } from "@/lib/actions/friends"
import { markAllNotificationsRead } from "@/lib/actions/notifications"
import Drawer from "@/components/ui/Drawer"
import type { Notification } from "@/types"

interface Props {
  open: boolean
  onOpen: () => void
  onClose: () => void
  currentUserId: string | null
}

export default function NotificationBell({ open, onOpen, onClose, currentUserId }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount]     = useState(0)
  const [loading, setLoading]             = useState(false)
  const [isPending, start]                = useTransition()

  // Fetch unread count on mount + subscribe to real-time inserts.
  // Filter the channel to this user's rows only — without the filter every
  // INSERT on the notifications table would increment every connected user's
  // badge count, which is both incorrect and a data exposure risk.
  useEffect(() => {
    if (!currentUserId) return
    fetchUnreadCount()

    const supabase = createClient()
    const channel = supabase
      .channel(`notifications-live-${currentUserId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "notifications",
        filter: `user_id=eq.${currentUserId}`,
      }, () => {
        setUnreadCount((c) => c + 1)
      })
      .subscribe()

    // Don't poll while the drawer is open — the open-effect already refetches.
    // Fully pause the timer when the tab is hidden: cancel the scheduled tick
    // so a forgotten tab never fires even a no-op setTimeout chain, and restart
    // the cycle as soon as the tab becomes visible again.
    let timer: ReturnType<typeof setTimeout> | null = null
    const BASE_MS = 60_000   // 60s base interval
    const JITTER  = 0.4      // ±40% randomization

    function scheduleNext() {
      if (document.visibilityState !== "visible") return  // don't schedule while hidden
      const factor = 1 + (Math.random() - 0.5) * JITTER * 2
      const delay  = Math.round(BASE_MS * factor)
      timer = setTimeout(tick, delay)
    }
    function tick() {
      fetchUnreadCount()
      scheduleNext()
    }
    function onVisibility() {
      if (document.visibilityState === "visible") {
        fetchUnreadCount()  // immediate refresh on tab focus
        scheduleNext()      // restart the polling cycle
      } else {
        if (timer) { clearTimeout(timer); timer = null }  // stop cold when hidden
      }
    }

    scheduleNext()
    document.addEventListener("visibilitychange", onVisibility)

    return () => {
      supabase.removeChannel(channel)
      if (timer) clearTimeout(timer)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [currentUserId])

  // Fetch + mark read when opened
  useEffect(() => {
    if (!open) return
    fetchNotifications()
    setUnreadCount(0)
    start(() => void markAllNotificationsRead())
  }, [open])

  async function fetchUnreadCount() {
    if (!currentUserId) return
    try {
      const supabase = createClient()
      const { count } = await withQueryTimeout(
        supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", currentUserId)
          .eq("is_read", false)
      )
      setUnreadCount(count ?? 0)
    } catch (e) {
      console.warn("[NotificationBell] fetchUnreadCount", e)
    }
  }

  async function fetchNotifications() {
    if (!currentUserId) return
    setLoading(true)
    try {
      const supabase = createClient()
      const { data } = await withQueryTimeout(
        supabase
          .from("notifications")
          .select("*, actor:actor_id(id, username, first_name, last_name, avatar_url)")
          .eq("user_id", currentUserId)
          .order("created_at", { ascending: false })
          .limit(30)
      )
      setNotifications((data as unknown as Notification[]) ?? [])
    } catch (e) {
      console.warn("[NotificationBell] fetchNotifications", e)
    } finally {
      setLoading(false)
    }
  }

  function handleFriendAction(notifId: string, type: "accept" | "decline", friendshipId: string) {
    // Optimistic — flip the row's type immediately, then call the server.
    // On error, revert to the previous state.
    const before = notifications
    setNotifications((prev) =>
      type === "accept"
        ? prev.map((n) => n.id === notifId ? { ...n, type: "friend_accepted" as const } : n)
        : prev.filter((n) => n.id !== notifId)
    )
    start(async () => {
      const res = type === "accept"
        ? await acceptFriendRequest(friendshipId)
        : await declineFriendRequest(friendshipId)
      if (res?.error) setNotifications(before)
    })
  }

  return (
    <>
      {/* Bell button */}
      <button
        onClick={onOpen}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: "#334155", display: "flex", alignItems: "center", justifyContent: "center",
          width: 36, height: 36, flexShrink: 0,
          position: "relative", padding: 0,
        }}
        title="Notifications"
      >
        <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span style={{
            position: "absolute", top: 0, right: 0,
            minWidth: 16, height: 16, borderRadius: 8,
            background: "#EF4444", color: "white",
            fontSize: 10, fontWeight: 700, lineHeight: "16px",
            textAlign: "center", padding: "0 3px",
            boxShadow: "0 0 0 2px white",
          }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Drawer */}
      <Drawer open={open} onClose={onClose} title="Notifications">
        {loading ? (
          <div style={{ padding: "48px 0", textAlign: "center", color: "#94A3B8", fontSize: 13 }}>
            Loading…
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: "64px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>🔔</div>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: "0 0 6px" }}>All caught up</p>
            <p style={{ fontSize: 13, color: "#94A3B8", margin: 0 }}>No notifications yet</p>
          </div>
        ) : (
          <div>
            {notifications.map((n) => (
              <NotifRow
                key={n.id}
                notification={n}
                isPending={isPending}
                onFriendAction={handleFriendAction}
                onNavigate={onClose}
              />
            ))}
          </div>
        )}
      </Drawer>
    </>
  )
}

// ── Notification icons ───────────────────────────────────────
function NotifIcon({ type }: { type: string }) {
  const configs: Record<string, { bg: string; emoji: string }> = {
    friend_request:         { bg: "#E0F4FA", emoji: "👤" },
    friend_accepted:        { bg: "#DCFCE7", emoji: "🤝" },
    wishlist_followed:      { bg: "#F3E8FF", emoji: "⭐" },
    wish_reserved:          { bg: "#FEF3C7", emoji: "🎁" },
    wish_bought:            { bg: "#DCFCE7", emoji: "🛍️" },
    event_reminder:         { bg: "#FCE7F3", emoji: "🎉" },
    wishlist_collaboration: { bg: "#E0F4FA", emoji: "🤝" },
  }
  const cfg = configs[type] ?? { bg: "#F1F5F9", emoji: "🔔" }
  return (
    <div style={{
      width: 40, height: 40, borderRadius: 12,
      background: cfg.bg, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 19,
    }}>
      {cfg.emoji}
    </div>
  )
}

// ── Single notification row ──────────────────────────────────
function NotifRow({ notification: n, isPending, onFriendAction, onNavigate }: {
  notification: Notification
  isPending: boolean
  onFriendAction: (notifId: string, type: "accept" | "decline", friendshipId: string) => void
  onNavigate: () => void
}) {
  const actor = n.actor
  const actorName = actor
    ? (actor.first_name ? `${actor.first_name} ${actor.last_name ?? ""}`.trim() : actor.username) ?? "Someone"
    : "Someone"
  const wishTitle = (n.meta?.wish_title as string | undefined) ?? "a wish"
  const wishlistIdFromMeta = n.meta?.wishlist_id as string | undefined

  const href = (() => {
    switch (n.type) {
      case "friend_request":   return "/friends"
      case "friend_accepted":  return actor?.username ? `/users/${actor.username}` : "/friends"
      case "wishlist_followed": return n.target_id ? `/wishlists/${n.target_id}` : null
      case "wish_reserved":          return wishlistIdFromMeta ? `/wishlists/${wishlistIdFromMeta}` : null
      case "wish_bought":            return wishlistIdFromMeta ? `/wishlists/${wishlistIdFromMeta}` : null
      case "event_reminder":         return n.target_id ? `/wishlists/${n.target_id}` : null
      case "wishlist_collaboration": return n.target_id ? `/wishlists/${n.target_id}` : null
      default: return null
    }
  })()

  function renderBody() {
    switch (n.type) {
      case "friend_request":
        return (
          <>
            <p style={textStyle}><strong>{actorName}</strong> sent you a friend request</p>
            {n.target_id && (
              <div style={{ display: "flex", gap: 8, marginTop: 10 }} onClick={(e) => e.preventDefault()}>
                <SmallBtn label="Accept"  primary disabled={isPending} onClick={() => onFriendAction(n.id, "accept",  n.target_id!)} />
                <SmallBtn label="Decline"         disabled={isPending} onClick={() => onFriendAction(n.id, "decline", n.target_id!)} />
              </div>
            )}
          </>
        )
      case "friend_accepted":
        return <p style={textStyle}><strong>{actorName}</strong> accepted your friend request 🎉</p>
      case "wishlist_followed":
        return <p style={textStyle}><strong>{actorName}</strong> started following one of your wishlists</p>
      case "wish_reserved":
        return <p style={textStyle}>Someone reserved <strong>{wishTitle}</strong> on your wishlist 🎁</p>
      case "wish_bought":
        return <p style={textStyle}><strong>{actorName}</strong> bought <strong>{wishTitle}</strong> from your wishlist! 🛍️</p>
      case "wishlist_collaboration": {
        const wTitle = (n.meta?.title as string | undefined) ?? "a wishlist"
        return (
          <p style={textStyle}>
            <strong>{actorName}</strong> added you as a collaborator on{" "}
            {n.target_id
              ? <Link href={`/wishlists/${n.target_id}`} style={{ color: "#38A3C7", fontWeight: 600, textDecoration: "none" }}>{wTitle}</Link>
              : <strong>{wTitle}</strong>
            }
            {" "}🤝
          </p>
        )
      }
      case "event_reminder": {
        const ownerName  = (n.meta?.owner_name  as string | undefined) ?? "Someone"
        const daysUntil  = (n.meta?.days_until  as number | undefined) ?? 0
        const occasion   = (n.meta?.occasion    as string | undefined)
        const label      = occasionLabel(occasion)
        return daysUntil === 0
          ? <p style={textStyle}>🎉 Today is <strong>{ownerName}</strong>&apos;s {label}! Check out their wishlist</p>
          : <p style={textStyle}>📅 <strong>{ownerName}</strong>&apos;s {label} is in <strong>1 week</strong> — check their wishlist</p>
      }
      default:
        return null
    }
  }

  const rowStyle: React.CSSProperties = {
    display: "flex", gap: 14, padding: "16px 20px",
    borderBottom: "1px solid #F8FAFC",
    background: n.is_read ? "transparent" : "#F0F9FF",
    textDecoration: "none", color: "inherit",
    cursor: href ? "pointer" : "default",
  }

  const inner = (
    <>
      <NotifIcon type={n.type} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {renderBody()}
        <p style={{ margin: "5px 0 0", fontSize: 11, color: "#94A3B8" }}>{timeAgo(n.created_at)}</p>
      </div>
      {!n.is_read && (
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#38A3C7", flexShrink: 0, marginTop: 6 }} />
      )}
    </>
  )

  return href ? (
    <Link href={href} style={rowStyle} onClick={onNavigate}>
      {inner}
    </Link>
  ) : (
    <div style={rowStyle}>{inner}</div>
  )
}

function SmallBtn({ label, onClick, primary = false, disabled }: {
  label: string; onClick: () => void; primary?: boolean; disabled?: boolean
}) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      fontSize: 12, fontWeight: 600, padding: "6px 14px",
      borderRadius: 8, border: "1.5px solid",
      cursor: "pointer",
      background:  primary ? "#0F172A" : "transparent",
      color:       primary ? "white"   : "#334155",
      borderColor: primary ? "#0F172A" : "#E2E8F0",
      opacity: disabled ? 0.6 : 1,
    }}>
      {label}
    </button>
  )
}

const textStyle: React.CSSProperties = { margin: 0, fontSize: 13, color: "#0F172A", lineHeight: 1.5 }

function occasionLabel(occasion: string | undefined): string {
  const map: Record<string, string> = {
    birthday:    "birthday",
    christmas:   "Christmas",
    wedding:     "wedding",
    baby_shower: "baby shower",
    graduation:  "graduation",
    anniversary: "anniversary",
    other:       "event",
  }
  return occasion ? (map[occasion] ?? "event") : "event"
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
