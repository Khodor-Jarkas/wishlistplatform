"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import {
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  removeFriend,
  sendFriendRequest,
  searchUsers,
  fetchSuggestedUsers,
} from "@/lib/actions/friends"
import { getCreators, type CreatorCard as CreatorCardData } from "@/lib/actions/creators"
import { getInitials } from "@/lib/utils"
import Drawer from "@/components/ui/Drawer"
import type { Profile } from "@/types"

interface FriendshipRow {
  id: string
  requester_id: string
  addressee_id: string
  status: string
  requester: Profile
  addressee: Profile
}

interface Props {
  open: boolean
  onOpen: () => void
  onClose: () => void
  currentUserId: string | null
}

type Tab = "friends" | "requests" | "suggested" | "creators"

export default function FriendsDrawer({ open, onOpen, onClose, currentUserId }: Props) {
  const [tab, setTab]                           = useState<Tab>("friends")
  const [friends, setFriends]                   = useState<FriendshipRow[]>([])
  const [incoming, setIncoming]                 = useState<FriendshipRow[]>([])
  const [outgoing, setOutgoing]                 = useState<FriendshipRow[]>([])
  const [suggested, setSuggested]               = useState<Profile[]>([])
  const [creators, setCreators]                 = useState<CreatorCardData[]>([])
  const [sentIds, setSentIds]                   = useState<Set<string>>(new Set())
  const [loading, setLoading]                   = useState(false)
  const [loadingSuggested, setLoadingSuggested] = useState(false)
  const [loadingCreators, setLoadingCreators]   = useState(false)
  const [searchQuery, setSearchQuery]           = useState("")
  const [searchResults, setSearchResults]       = useState<Profile[]>([])
  const [removingId, setRemovingId]             = useState<string | null>(null)
  const [isPending, start]                      = useTransition()

  useEffect(() => {
    if (open && currentUserId) fetchFriends()
  }, [open, currentUserId])

  useEffect(() => {
    if (open && tab === "suggested" && suggested.length === 0 && !loadingSuggested) {
      loadSuggested()
    }
    if (open && tab === "creators" && creators.length === 0 && !loadingCreators) {
      loadCreators()
    }
  }, [open, tab])

  async function fetchFriends() {
    if (!currentUserId) return
    setLoading(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("friendships")
        .select(
          "*, requester:requester_id(id,username,first_name,last_name,avatar_url), " +
          "addressee:addressee_id(id,username,first_name,last_name,avatar_url)"
        )
        .or(`requester_id.eq.${currentUserId},addressee_id.eq.${currentUserId}`)
        .order("created_at", { ascending: false })

      if (error) console.error("[FriendsDrawer] fetchFriends", error)

      const all = (data ?? []) as unknown as FriendshipRow[]
      setFriends(all.filter((f) => f.status === "accepted"))
      setIncoming(all.filter((f) => f.status === "pending" && f.addressee_id === currentUserId))
      setOutgoing(all.filter((f) => f.status === "pending" && f.requester_id === currentUserId))
    } catch (e) {
      console.error("[FriendsDrawer] fetchFriends threw", e)
    } finally {
      setLoading(false)
    }
  }

  async function loadSuggested() {
    setLoadingSuggested(true)
    try {
      const { users } = await fetchSuggestedUsers()
      setSuggested(users)
    } finally {
      setLoadingSuggested(false)
    }
  }

  async function loadCreators() {
    setLoadingCreators(true)
    try {
      const list = await getCreators()
      setCreators(list)
    } finally {
      setLoadingCreators(false)
    }
  }

  const knownIds = new Set([
    ...friends.flatMap((f) => [f.requester_id, f.addressee_id]),
    ...incoming.flatMap((f) => [f.requester_id, f.addressee_id]),
    ...outgoing.flatMap((f) => [f.requester_id, f.addressee_id]),
    currentUserId ?? "",
  ])

  function handleSearch(q: string) {
    setSearchQuery(q)
    if (q.length < 2) { setSearchResults([]); return }
    start(async () => {
      const { users } = await searchUsers(q)
      setSearchResults(users)
    })
  }

  function getFriendProfile(f: FriendshipRow) {
    return f.requester_id === currentUserId ? f.addressee : f.requester
  }

  function refresh() {
    setSearchQuery("")
    setSearchResults([])
    fetchFriends()
  }

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: "friends",   label: "Friends",   badge: friends.length || undefined },
    { id: "requests",  label: "Requests",  badge: incoming.length || undefined },
    { id: "suggested", label: "Suggested" },
    { id: "creators",  label: "Creators"  },
  ]

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={onOpen}
        title="Friends"
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: "#64748B", display: "flex", alignItems: "center", padding: 4,
          position: "relative",
        }}
      >
        <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-6 3a5 5 0 110-10 5 5 0 010 10zm-7 7a8 8 0 0116 0H3z" />
        </svg>
        {incoming.length > 0 && (
          <span style={{
            position: "absolute", top: 0, right: 0,
            minWidth: 16, height: 16, borderRadius: 8,
            background: "#8B5CF6", color: "white",
            fontSize: 10, fontWeight: 700, lineHeight: "16px",
            textAlign: "center", padding: "0 3px",
            boxShadow: "0 0 0 2px white",
          }}>
            {incoming.length}
          </span>
        )}
      </button>

      {/* Drawer — no title prop, we render our own header */}
      <Drawer open={open} onClose={onClose} width={420}>

        {/* ── Custom header ── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "20px 20px 0", position: "relative",
        }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: "#0F172A" }}>Friends</span>
          <button
            onClick={onClose}
            style={{
              position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
              width: 34, height: 34, borderRadius: "50%",
              background: "#F1F5F9", border: "none",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              color: "#64748B", fontSize: 16, fontWeight: 700,
            }}
          >
            ✕
          </button>
        </div>

        {/* ── Tabs ── */}
        <div style={{
          display: "flex", padding: "16px 20px 0",
          borderBottom: "1px solid #F1F5F9",
          gap: 0,
        }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1, background: "none", border: "none", cursor: "pointer",
                padding: "10px 4px 12px",
                fontSize: 13, fontWeight: tab === t.id ? 700 : 400,
                color: tab === t.id ? "#38A3C7" : "#64748B",
                borderBottom: tab === t.id ? "2px solid #38A3C7" : "2px solid transparent",
                transition: "color 0.15s, border-color 0.15s",
                marginBottom: -1,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              }}
            >
              {t.label}
              {t.badge && (
                <span style={{
                  background: tab === t.id ? "#38A3C7" : "#E2E8F0",
                  color: tab === t.id ? "white" : "#64748B",
                  borderRadius: 10, fontSize: 10, fontWeight: 700,
                  padding: "1px 6px", lineHeight: "16px",
                }}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Search bar ── */}
        <div style={{ padding: "16px 20px 4px" }}>
          <div style={{
            display: "flex", alignItems: "center",
            background: "#F1F5F9", borderRadius: 50,
            padding: "0 16px", gap: 10,
          }}>
            <svg width="16" height="16" fill="none" stroke="#94A3B8" strokeWidth="1.8" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0Z" />
            </svg>
            <input
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Find friends"
              style={{
                flex: 1, border: "none", outline: "none",
                background: "transparent", fontSize: 14, color: "#0F172A",
                padding: "12px 0",
              }}
            />
            {isPending && <span style={{ fontSize: 12, color: "#94A3B8" }}>…</span>}
          </div>
        </div>

        {/* ── Tab content ── */}
        <div style={{ overflowY: "auto", flex: 1, padding: "12px 20px 32px" }}>

          {/* Search results overlay */}
          {searchQuery.length >= 2 && (
            <>
              {searchResults.length > 0 ? (
                <div style={{ background: "white", borderRadius: 14, border: "1px solid #E2E8F0", overflow: "hidden", marginBottom: 16 }}>
                  {searchResults.map((u) => (
                    <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: "1px solid #F8FAFC" }}>
                      <Avatar profile={u} size={38} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#0F172A" }}>
                          {u.first_name ? `${u.first_name} ${u.last_name ?? ""}`.trim() : u.username}
                        </p>
                        <p style={{ margin: 0, fontSize: 11, color: "#94A3B8" }}>@{u.username}</p>
                      </div>
                      {knownIds.has(u.id)
                        ? <span style={{ fontSize: 11, color: "#94A3B8", fontStyle: "italic" }}>Connected</span>
                        : <Btn label="Add" primary onClick={() => start(async () => { await sendFriendRequest(u.id); setSearchResults((p) => p.filter((x) => x.id !== u.id)); refresh() })} />
                      }
                    </div>
                  ))}
                </div>
              ) : !isPending && (
                <EmptyState icon="🔍" message={`No users found for "${searchQuery}"`} />
              )}
            </>
          )}

          {!loading && searchQuery.length < 2 && (
            <>
              {/* Friends tab */}
              {tab === "friends" && (
                friends.length === 0
                  ? <NoFriendsEmpty />
                  : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {friends.map((f) => {
                        const p = getFriendProfile(f)
                        return (
                          <FriendRow key={f.id} profile={p}>
                            <Btn label="View" href={`/users/${p.username}`} onClick={onClose} />
                            <Btn
                              label={removingId === f.id ? "Sure?" : "Remove"}
                              danger
                              onClick={() => {
                                if (removingId !== f.id) { setRemovingId(f.id); return }
                                setRemovingId(null)
                                start(async () => { await removeFriend(f.id); refresh() })
                              }}
                            />
                          </FriendRow>
                        )
                      })}
                    </div>
              )}

              {/* Requests tab */}
              {tab === "requests" && (
                incoming.length === 0 && outgoing.length === 0
                  ? <EmptyState icon="📬" message="No pending friend requests." />
                  : <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                      {incoming.length > 0 && (
                        <div>
                          <Label text="Incoming" />
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {incoming.map((f) => (
                              <FriendRow key={f.id} profile={f.requester}>
                                <Btn label="Accept"  primary onClick={() => start(async () => { await acceptFriendRequest(f.id);  refresh() })} />
                                <Btn label="Decline"         onClick={() => start(async () => { await declineFriendRequest(f.id); refresh() })} />
                              </FriendRow>
                            ))}
                          </div>
                        </div>
                      )}
                      {outgoing.length > 0 && (
                        <div>
                          <Label text="Sent" />
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            {outgoing.map((f) => (
                              <FriendRow key={f.id} profile={f.addressee}>
                                <span style={{ fontSize: 11, color: "#94A3B8", fontStyle: "italic" }}>Pending</span>
                                <Btn label="Cancel" onClick={() => start(async () => { await cancelFriendRequest(f.id); refresh() })} />
                              </FriendRow>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
              )}

              {/* Suggested */}
              {tab === "suggested" && (
                loadingSuggested
                  ? <div style={{ padding: "48px 0", textAlign: "center", color: "#94A3B8", fontSize: 13 }}>Finding people you may know…</div>
                  : suggested.length === 0
                    ? <NoSuggestionsEmpty />
                    : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {suggested.map((p) => (
                          <FriendRow key={p.id} profile={p}>
                            {sentIds.has(p.id)
                              ? <span style={{ fontSize: 11, color: "#94A3B8", fontStyle: "italic" }}>Sent ✓</span>
                              : <Btn label="Add" primary onClick={() => start(async () => {
                                  await sendFriendRequest(p.id)
                                  setSentIds(prev => new Set([...prev, p.id]))
                                })} />
                            }
                          </FriendRow>
                        ))}
                      </div>
              )}

              {/* Creators */}
              {tab === "creators" && (
                loadingCreators
                  ? <div style={{ padding: "48px 0", textAlign: "center", color: "#94A3B8", fontSize: 13 }}>Loading creators…</div>
                  : creators.length === 0
                    ? <EmptyState icon="🌟" message="No Creators yet — check the Inspiration page for updates." />
                    : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {creators.map((c) => (
                          <CreatorRow key={c.id} creator={c} onNavigate={onClose} />
                        ))}
                        <Link
                          href="/inspire"
                          onClick={onClose}
                          style={{
                            display: "block", textAlign: "center",
                            marginTop: 8, padding: "10px 0",
                            fontSize: 12, fontWeight: 600, color: "#38A3C7",
                            textDecoration: "none",
                          }}
                        >
                          See all Creators →
                        </Link>
                      </div>
              )}
            </>
          )}

          {loading && (
            <div style={{ padding: "48px 0", textAlign: "center", color: "#94A3B8", fontSize: 13 }}>Loading…</div>
          )}
        </div>

      </Drawer>
    </>
  )
}

// ── Sub-components ─────────────────────────────────────────────────

function Label({ text }: { text: string }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 10px" }}>
      {text}
    </p>
  )
}

function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 16px" }}>
      <div style={{ fontSize: 52, marginBottom: 14 }}>{icon}</div>
      <p style={{ fontSize: 14, color: "#94A3B8", margin: 0, lineHeight: 1.6 }}>{message}</p>
    </div>
  )
}

function NoFriendsEmpty() {
  return (
    <div style={{ textAlign: "center", padding: "40px 16px" }}>
      {/* Illustration */}
      <svg width="120" height="100" viewBox="0 0 120 100" fill="none" style={{ marginBottom: 20, opacity: 0.55 }}>
        <circle cx="40" cy="32" r="18" fill="#E0F4FA" stroke="#38A3C7" strokeWidth="2" />
        <circle cx="80" cy="32" r="18" fill="#F3E8FF" stroke="#8B5CF6" strokeWidth="2" />
        <path d="M22 68c0-9.94 8.06-18 18-18s18 8.06 18 18" stroke="#38A3C7" strokeWidth="2" strokeLinecap="round" fill="#E0F4FA" />
        <path d="M62 68c0-9.94 8.06-18 18-18s18 8.06 18 18" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" fill="#F3E8FF" />
        <path d="M56 50c2.5-2 5.5-3 8-3" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 3" />
        <circle cx="40" cy="32" r="5" fill="#38A3C7" opacity="0.4" />
        <circle cx="80" cy="32" r="5" fill="#8B5CF6" opacity="0.4" />
      </svg>
      <p style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: "0 0 8px" }}>
        No friends yet
      </p>
      <p style={{ fontSize: 13, color: "#94A3B8", margin: "0 0 16px", lineHeight: 1.6 }}>
        Search for friends by name above,<br />or check the Suggested tab.
      </p>
    </div>
  )
}

function NoSuggestionsEmpty() {
  return (
    <div style={{ textAlign: "center", padding: "40px 16px" }}>
      <svg width="100" height="90" viewBox="0 0 100 90" fill="none" style={{ marginBottom: 20, opacity: 0.55 }}>
        <circle cx="50" cy="35" r="22" fill="#FEF9C3" stroke="#F59E0B" strokeWidth="2" />
        <path d="M50 18v4M50 48v4M33 35h-4M71 35h-4" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
        <circle cx="50" cy="35" r="10" fill="#FDE68A" />
        <path d="M28 70c0-12.15 9.85-22 22-22s22 9.85 22 22" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" fill="#FEF9C3" />
      </svg>
      <p style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: "0 0 8px" }}>
        No suggestions yet
      </p>
      <p style={{ fontSize: 13, color: "#94A3B8", margin: 0, lineHeight: 1.6 }}>
        Once you have friends or fill in your<br />country in your profile, we'll suggest<br />people you may know.
      </p>
    </div>
  )
}

function Avatar({ profile, size }: { profile: Profile; size: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "#38A3C7", flexShrink: 0, overflow: "hidden",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "white", fontWeight: 700, fontSize: size * 0.35,
    }}>
      {profile.avatar_url
        ? <img src={profile.avatar_url} alt={profile.username} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : getInitials(profile)}
    </div>
  )
}

function CreatorRow({ creator, onNavigate }: { creator: CreatorCardData; onNavigate: () => void }) {
  const displayName = creator.first_name
    ? `${creator.first_name} ${creator.last_name ?? ""}`.trim()
    : creator.username

  const initials = getInitials({
    first_name: creator.first_name,
    last_name: creator.last_name,
    username: creator.username,
  })

  return (
    <Link
      href={`/users/${creator.username}`}
      onClick={onNavigate}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        background: "white", borderRadius: 12, padding: "12px 14px",
        border: "1px solid #F1F5F9", textDecoration: "none",
      }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: "50%",
        background: "#38A3C7", flexShrink: 0, overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "white", fontWeight: 700, fontSize: 13,
      }}>
        {creator.avatar_url
          ? <img src={creator.avatar_url} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{displayName}</p>
        <p style={{ margin: 0, fontSize: 11, color: "#94A3B8" }}>
          {creator.public_wishlist_count} wishlist{creator.public_wishlist_count === 1 ? "" : "s"}
          {" · "}
          {creator.follower_count} follower{creator.follower_count === 1 ? "" : "s"}
        </p>
      </div>
      <span style={{ fontSize: 16, color: "#CBD5E1", flexShrink: 0 }}>›</span>
    </Link>
  )
}

function FriendRow({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  const displayName = profile.first_name
    ? `${profile.first_name} ${profile.last_name ?? ""}`.trim()
    : profile.full_name ?? profile.username

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      background: "white", borderRadius: 12, padding: "12px 14px",
      border: "1px solid #F1F5F9",
    }}>
      <Avatar profile={profile} size={38} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{displayName}</p>
        <p style={{ margin: 0, fontSize: 11, color: "#94A3B8" }}>@{profile.username}</p>
      </div>
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>{children}</div>
    </div>
  )
}

function Btn({ label, onClick, primary = false, danger = false, href }: {
  label: string; onClick?: () => void; primary?: boolean; danger?: boolean; href?: string
}) {
  const style: React.CSSProperties = {
    fontSize: 11, fontWeight: 600, padding: "6px 12px",
    borderRadius: 8, border: "1.5px solid", cursor: "pointer",
    textDecoration: "none", display: "inline-block",
    background:  primary ? "#0F172A"  : "transparent",
    color:       primary ? "white"    : danger ? "#EF4444" : "#334155",
    borderColor: primary ? "#0F172A"  : danger ? "#EF4444" : "#E2E8F0",
  }
  if (href) return <Link href={href} style={style} onClick={onClick}>{label}</Link>
  return <button onClick={onClick} style={style}>{label}</button>
}
