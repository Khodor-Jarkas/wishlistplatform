import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import Container from "@/components/ui/Container"
import EmptyState from "@/components/ui/EmptyState"
import { getInitials } from "@/lib/utils"
import type { Activity } from "@/types"

// ── Activity type config ─────────────────────────────────────
const typeConfig: Record<string, { color: string; bg: string; icon: string }> = {
  wishlist_created:  { color: "#8B5CF6", bg: "#F3E8FF", icon: "📋" },
  wish_added:        { color: "#38A3C7", bg: "#E0F4FA", icon: "✨" },
  friendship_started:{ color: "#10B981", bg: "#D1FAE5", icon: "🤝" },
}

// ── Date grouping ────────────────────────────────────────────
function getDateLabel(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const weekAgo   = new Date(today.getTime() - 7 * 86400000)
  const item = new Date(d.getFullYear(), d.getMonth(), d.getDate())

  if (item.getTime() === today.getTime())     return "Today"
  if (item.getTime() === yesterday.getTime()) return "Yesterday"
  if (item.getTime() > weekAgo.getTime())     return "This week"
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric" })
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

// ── Page ─────────────────────────────────────────────────────
export default async function ActivityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/")

  const { data: raw } = await supabase
    .from("activity")
    .select("*, profile:user_id(id, username, first_name, last_name, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(60)

  const activities = (raw ?? []) as (Activity & { profile: any })[]

  // Group by date label, preserving order
  const groups: { label: string; items: typeof activities }[] = []
  for (const a of activities) {
    const label = getDateLabel(a.created_at)
    const last = groups[groups.length - 1]
    if (last && last.label === label) {
      last.items.push(a)
    } else {
      groups.push({ label, items: [a] })
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "#F8FAFC", paddingBottom: 80 }}>
      <Container>
        <div style={{ paddingTop: 48, maxWidth: 620, margin: "0 auto" }}>

          {/* Header */}
          <div style={{ marginBottom: 36 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
              Activity
            </h1>
            <p style={{ fontSize: 14, color: "#94A3B8", margin: 0 }}>
              What your friends have been up to
            </p>
          </div>

          {activities.length === 0 ? (
            <EmptyState
              icon="🌱"
              title="Nothing yet"
              description="Add friends to see their wishlists, wishes, and updates here."
              action={{ label: "Find friends", href: "/friends" }}
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              {groups.map((group) => (
                <section key={group.label}>
                  {/* Date label */}
                  <div style={{
                    fontSize: 11, fontWeight: 700, color: "#94A3B8",
                    textTransform: "uppercase", letterSpacing: "0.1em",
                    marginBottom: 12,
                  }}>
                    {group.label}
                  </div>

                  {/* Cards */}
                  <div style={{
                    background: "white",
                    borderRadius: 16,
                    border: "1px solid #F1F5F9",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                    overflow: "hidden",
                  }}>
                    {group.items.map((a, i) => (
                      <ActivityCard
                        key={a.id}
                        activity={a}
                        currentUserId={user.id}
                        isLast={i === group.items.length - 1}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

        </div>
      </Container>
    </main>
  )
}

// ── Activity card ─────────────────────────────────────────────
function ActivityCard({
  activity, currentUserId, isLast,
}: {
  activity: Activity & { profile: any }
  currentUserId: string
  isLast: boolean
}) {
  const profile     = activity.profile
  const isMe        = activity.user_id === currentUserId
  const meta        = (activity.meta ?? {}) as Record<string, string>
  const cfg         = typeConfig[activity.type] ?? { color: "#64748B", bg: "#F1F5F9", icon: "📌" }

  const displayName = isMe
    ? "You"
    : profile?.first_name
      ? `${profile.first_name} ${profile.last_name ?? ""}`.trim()
      : profile?.username ?? "Someone"

  const initials = getInitials(profile ?? {})

  function renderBody() {
    switch (activity.type) {
      case "wishlist_created":
        return (
          <span>
            {" "}created the wishlist{" "}
            {activity.target_id
              ? <Link href={`/wishlists/${activity.target_id}`} style={{ color: cfg.color, fontWeight: 600, textDecoration: "none" }}>{meta.title ?? "a wishlist"}</Link>
              : <strong>{meta.title ?? "a wishlist"}</strong>
            }
          </span>
        )
      case "wish_added":
        return (
          <span>
            {" "}added <strong>{meta.wish_title ?? "a wish"}</strong>
            {meta.wishlist_title && (
              <span>
                {" "}to{" "}
                {activity.target_id
                  ? <Link href={`/wishlists/${activity.target_id}`} style={{ color: cfg.color, fontWeight: 600, textDecoration: "none" }}>{meta.wishlist_title}</Link>
                  : <strong>{meta.wishlist_title}</strong>
                }
              </span>
            )}
          </span>
        )
      case "friendship_started": {
        const friendUsername = meta.friend_username
        const friendName     = meta.friend_name ?? "a friend"
        return (
          <span>
            {" "}and{" "}
            {friendUsername
              ? <Link href={`/users/${friendUsername}`} style={{ color: cfg.color, fontWeight: 600, textDecoration: "none" }}>{friendName}</Link>
              : <strong>{friendName}</strong>
            }{" "}are now friends 🎉
          </span>
        )
      }
      default:
        return null
    }
  }

  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 14,
      padding: "16px 20px",
      borderBottom: isLast ? "none" : "1px solid #F8FAFC",
    }}>

      {/* Avatar + type badge */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <div style={{
          width: 44, height: 44, borderRadius: "50%",
          background: "#38A3C7", overflow: "hidden",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white", fontWeight: 700, fontSize: 14,
        }}>
          {profile?.avatar_url
            ? <img src={profile.avatar_url} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : initials}
        </div>
        {/* Activity type badge */}
        <div style={{
          position: "absolute", bottom: -2, right: -4,
          width: 20, height: 20, borderRadius: "50%",
          background: cfg.bg,
          border: "2px solid white",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 10,
        }}>
          {cfg.icon}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: "0 0 5px", fontSize: 14, color: "#0F172A", lineHeight: 1.5 }}>
          {profile && !isMe ? (
            <Link href={`/users/${profile.username}`} style={{ fontWeight: 700, color: "#0F172A", textDecoration: "none" }}>
              {displayName}
            </Link>
          ) : (
            <strong>{displayName}</strong>
          )}
          {renderBody()}
        </p>
        <span style={{
          fontSize: 11, color: "#94A3B8", fontWeight: 500,
          display: "inline-flex", alignItems: "center", gap: 4,
        }}>
          {timeAgo(activity.created_at)}
        </span>
      </div>

      {/* Type pill */}
      <div style={{
        flexShrink: 0,
        fontSize: 10, fontWeight: 700,
        color: cfg.color, background: cfg.bg,
        borderRadius: 20, padding: "3px 9px",
        letterSpacing: "0.04em", textTransform: "uppercase",
        alignSelf: "flex-start", marginTop: 2,
      }}>
        {activity.type === "wishlist_created"   ? "List"   :
         activity.type === "wish_added"          ? "Wish"   :
         activity.type === "friendship_started"  ? "Friend" : ""}
      </div>

    </div>
  )
}
