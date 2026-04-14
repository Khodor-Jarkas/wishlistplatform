import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import Container from "@/components/ui/Container"
import { getInitials } from "@/lib/utils"
import type { Activity } from "@/types"

export default async function ActivityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/")

  // RLS filters this to own + friends' activity automatically
  const { data: raw } = await supabase
    .from("activity")
    .select("*, profile:user_id(id, username, first_name, last_name, avatar_url)")
    .order("created_at", { ascending: false })
    .limit(60)

  const activities = (raw ?? []) as (Activity & { profile: any })[]

  return (
    <main style={{ minHeight: "100vh", background: "#F8FAFC", paddingBottom: 60 }}>
      <Container>
        <div style={{ paddingTop: 48, maxWidth: 640, margin: "0 auto" }}>

          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", margin: "0 0 32px" }}>
            Activity
          </h1>

          {activities.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0", color: "#94A3B8" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
              <p style={{ margin: 0, fontWeight: 500, fontSize: 15 }}>Nothing yet</p>
              <p style={{ margin: "8px 0 0", fontSize: 13 }}>
                Add friends to see their activity here.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {activities.map((a, i) => (
                <ActivityRow
                  key={a.id}
                  activity={a}
                  currentUserId={user.id}
                  isLast={i === activities.length - 1}
                />
              ))}
            </div>
          )}

        </div>
      </Container>
    </main>
  )
}

function ActivityRow({
  activity, currentUserId, isLast,
}: { activity: Activity & { profile: any }; currentUserId: string; isLast: boolean }) {
  const profile    = activity.profile
  const isMe       = activity.user_id === currentUserId
  const meta       = activity.meta ?? {}
  const displayName = isMe
    ? "You"
    : profile?.first_name
      ? `${profile.first_name} ${profile.last_name ?? ""}`.trim()
      : profile?.username ?? "Someone"

  const initials = getInitials(profile ?? {})

  function renderText() {
    switch (activity.type) {
      case "wishlist_created":
        return (
          <>
            {" "}created the wishlist{" "}
            {activity.target_id ? (
              <Link href={`/wishlists/${activity.target_id}`} style={{ color: "#38A3C7", textDecoration: "none", fontWeight: 600 }}>
                {(meta as any).title ?? "a wishlist"}
              </Link>
            ) : (
              <strong>{(meta as any).title ?? "a wishlist"}</strong>
            )}
          </>
        )
      case "wish_added":
        return (
          <>
            {" "}added <strong>{(meta as any).wish_title ?? "a wish"}</strong>
            {(meta as any).wishlist_title ? (
              <>
                {" "}to{" "}
                {activity.target_id ? (
                  <Link href={`/wishlists/${activity.target_id}`} style={{ color: "#38A3C7", textDecoration: "none", fontWeight: 600 }}>
                    {(meta as any).wishlist_title}
                  </Link>
                ) : (
                  <strong>{(meta as any).wishlist_title}</strong>
                )}
              </>
            ) : null}
          </>
        )
      case "friendship_started": {
        const friendUsername = (meta as any).friend_username
        const friendName     = (meta as any).friend_name ?? "a friend"
        return (
          <>
            {" "}and{" "}
            {friendUsername ? (
              <Link href={`/users/${friendUsername}`} style={{ color: "#38A3C7", textDecoration: "none", fontWeight: 600 }}>
                {friendName}
              </Link>
            ) : (
              <strong>{friendName}</strong>
            )}{" "}
            are now friends
          </>
        )
      }
      default:
        return null
    }
  }

  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 14,
      padding: "14px 0",
      borderBottom: isLast ? "none" : "1px solid #F1F5F9",
    }}>
      {/* Avatar */}
      <div style={{
        width: 38, height: 38, borderRadius: "50%",
        background: "#38A3C7", flexShrink: 0, overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "white", fontWeight: 700, fontSize: 13,
      }}>
        {profile?.avatar_url
          ? <img src={profile.avatar_url} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : initials}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: "0 0 4px", fontSize: 14, color: "#0F172A", lineHeight: 1.45 }}>
          {profile && !isMe ? (
            <Link href={`/users/${profile.username}`} style={{ fontWeight: 600, color: "#0F172A", textDecoration: "none" }}>
              {displayName}
            </Link>
          ) : (
            <strong>{displayName}</strong>
          )}
          {renderText()}
        </p>
        <p style={{ margin: 0, fontSize: 12, color: "#94A3B8" }}>
          {timeAgo(activity.created_at)}
        </p>
      </div>
    </div>
  )
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  < 1)  return "Just now"
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days  < 7)  return `${days}d ago`
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" })
}
