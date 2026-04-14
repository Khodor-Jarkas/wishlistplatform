"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import {
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  removeFriend,
  sendFriendRequest,
  searchUsers,
} from "@/lib/actions/friends"
import { getInitials } from "@/lib/utils"
import Container from "@/components/ui/Container"
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
  currentUserId: string
  friends: FriendshipRow[]
  incomingRequests: FriendshipRow[]
  outgoingRequests: FriendshipRow[]
}

export default function FriendsClient({
  currentUserId,
  friends,
  incomingRequests,
  outgoingRequests,
}: Props) {
  const [searchQuery, setSearchQuery]     = useState("")
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [isPending, start]                = useTransition()
  const [removingId, setRemovingId]       = useState<string | null>(null)

  // Build a set of all known user IDs from existing relationships
  const knownIds = new Set([
    ...friends.flatMap((f) => [f.requester_id, f.addressee_id]),
    ...incomingRequests.flatMap((f) => [f.requester_id, f.addressee_id]),
    ...outgoingRequests.flatMap((f) => [f.requester_id, f.addressee_id]),
    currentUserId,
  ])

  function handleSearchChange(q: string) {
    setSearchQuery(q)
    if (q.length < 2) { setSearchResults([]); return }
    start(async () => {
      const { users } = await searchUsers(q)
      setSearchResults(users)
    })
  }

  function getFriendProfile(f: FriendshipRow): Profile {
    return f.requester_id === currentUserId ? f.addressee : f.requester
  }

  return (
    <main style={{ minHeight: "100vh", background: "#F8FAFC", paddingBottom: 60 }}>
      <Container>
        <div style={{ paddingTop: 48, maxWidth: 680, margin: "0 auto" }}>

          {/* Page title */}
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", margin: "0 0 32px" }}>
            Friends
          </h1>

          {/* ── Search ── */}
          <div style={{ marginBottom: 40 }}>
            <div style={{
              display: "flex", alignItems: "center",
              border: "1.5px solid #E2E8F0", borderRadius: 10,
              background: "white", overflow: "hidden",
              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            }}>
              <svg width="18" height="18" fill="none" stroke="#94A3B8" strokeWidth="1.5" viewBox="0 0 24 24"
                style={{ flexShrink: 0, margin: "0 14px" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0Z" />
              </svg>
              <input
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by name or username…"
                style={{
                  flex: 1, border: "none", outline: "none", background: "transparent",
                  fontSize: 14, color: "#0F172A", padding: "14px 14px 14px 0",
                }}
              />
              {isPending && (
                <span style={{ marginRight: 14, fontSize: 12, color: "#94A3B8" }}>…</span>
              )}
            </div>

            {/* Search results */}
            {searchResults.length > 0 && (
              <div style={{
                marginTop: 4, background: "white", borderRadius: 10,
                border: "1px solid #E2E8F0", overflow: "hidden",
                boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              }}>
                {searchResults.map((user) => (
                  <SearchResultRow
                    key={user.id}
                    user={user}
                    isKnown={knownIds.has(user.id)}
                    onAdd={() => {
                      start(async () => {
                        await sendFriendRequest(user.id)
                        setSearchResults((prev) => prev.filter((u) => u.id !== user.id))
                      })
                    }}
                  />
                ))}
              </div>
            )}

            {searchQuery.length >= 2 && searchResults.length === 0 && !isPending && (
              <p style={{ fontSize: 13, color: "#94A3B8", marginTop: 12, textAlign: "center" }}>
                No users found for "{searchQuery}"
              </p>
            )}
          </div>

          {/* ── Incoming Requests ── */}
          {incomingRequests.length > 0 && (
            <section style={{ marginBottom: 40 }}>
              <SectionLabel label={`Requests (${incomingRequests.length})`} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {incomingRequests.map((f) => {
                  const p = f.requester
                  return (
                    <FriendRow key={f.id} profile={p}>
                      <ActionButton
                        label="Accept"
                        primary
                        onClick={() => start(() => void acceptFriendRequest(f.id))}
                      />
                      <ActionButton
                        label="Decline"
                        onClick={() => start(() => void declineFriendRequest(f.id))}
                      />
                    </FriendRow>
                  )
                })}
              </div>
            </section>
          )}

          {/* ── Friends ── */}
          <section style={{ marginBottom: 40 }}>
            <SectionLabel label={`My Friends (${friends.length})`} />
            {friends.length === 0 ? (
              <p style={{ fontSize: 14, color: "#94A3B8", textAlign: "center", padding: "32px 0" }}>
                No friends yet — search above to find people!
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {friends.map((f) => {
                  const p = getFriendProfile(f)
                  return (
                    <FriendRow key={f.id} profile={p}>
                      <Link
                        href={`/users/${p.username}`}
                        style={{
                          fontSize: 12, fontWeight: 600, color: "#38A3C7",
                          textDecoration: "none", padding: "7px 14px",
                          border: "1.5px solid #38A3C7", borderRadius: 8,
                          letterSpacing: "0.03em",
                        }}
                      >
                        View
                      </Link>
                      <ActionButton
                        label={removingId === f.id ? "Sure?" : "Remove"}
                        danger
                        onClick={() => {
                          if (removingId !== f.id) { setRemovingId(f.id); return }
                          setRemovingId(null)
                          start(() => void removeFriend(f.id))
                        }}
                      />
                    </FriendRow>
                  )
                })}
              </div>
            )}
          </section>

          {/* ── Sent Requests ── */}
          {outgoingRequests.length > 0 && (
            <section>
              <SectionLabel label={`Sent (${outgoingRequests.length})`} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {outgoingRequests.map((f) => {
                  const p = f.addressee
                  return (
                    <FriendRow key={f.id} profile={p}>
                      <span style={{ fontSize: 12, color: "#94A3B8", fontStyle: "italic", marginRight: 8 }}>
                        Pending
                      </span>
                      <ActionButton
                        label="Cancel"
                        onClick={() => start(() => void cancelFriendRequest(f.id))}
                      />
                    </FriendRow>
                  )
                })}
              </div>
            </section>
          )}

        </div>
      </Container>
    </main>
  )
}

// ── Sub-components ──────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <p style={{
      fontSize: 11, fontWeight: 700, color: "#94A3B8",
      textTransform: "uppercase", letterSpacing: "0.08em",
      margin: "0 0 12px",
    }}>
      {label}
    </p>
  )
}

function FriendRow({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  const displayName = profile.first_name
    ? `${profile.first_name} ${profile.last_name ?? ""}`.trim()
    : profile.full_name ?? profile.username

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      background: "white", borderRadius: 12, padding: "12px 16px",
      border: "1px solid #F1F5F9",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    }}>
      <Avatar profile={profile} size={40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#0F172A", lineHeight: 1.3 }}>
          {displayName}
        </p>
        <p style={{ margin: 0, fontSize: 12, color: "#94A3B8" }}>@{profile.username}</p>
      </div>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        {children}
      </div>
    </div>
  )
}

function SearchResultRow({
  user, isKnown, onAdd,
}: { user: Profile; isKnown: boolean; onAdd: () => void }) {
  const displayName = user.first_name
    ? `${user.first_name} ${user.last_name ?? ""}`.trim()
    : user.full_name ?? user.username

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "12px 16px",
      borderBottom: "1px solid #F8FAFC",
    }}>
      <Avatar profile={user} size={36} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color: "#0F172A" }}>{displayName}</p>
        <p style={{ margin: 0, fontSize: 12, color: "#94A3B8" }}>@{user.username}</p>
      </div>
      {!isKnown && (
        <ActionButton label="Add Friend" primary onClick={onAdd} />
      )}
      {isKnown && (
        <span style={{ fontSize: 12, color: "#94A3B8", fontStyle: "italic" }}>Connected</span>
      )}
    </div>
  )
}

function Avatar({ profile, size }: { profile: Profile; size: number }) {
  const initials = getInitials(profile)
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "#38A3C7", flexShrink: 0, overflow: "hidden",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "white", fontWeight: 700, fontSize: size * 0.35,
    }}>
      {profile.avatar_url
        ? <img src={profile.avatar_url} alt={profile.username} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : initials}
    </div>
  )
}

function ActionButton({
  label, onClick, primary = false, danger = false,
}: { label: string; onClick: () => void; primary?: boolean; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontSize: 12, fontWeight: 600, padding: "7px 14px",
        borderRadius: 8, border: "1.5px solid",
        cursor: "pointer", letterSpacing: "0.03em",
        background:   primary ? "#0F172A"  : danger  ? "transparent" : "transparent",
        color:        primary ? "white"    : danger  ? "#EF4444"     : "#334155",
        borderColor:  primary ? "#0F172A"  : danger  ? "#EF4444"     : "#E2E8F0",
        transition: "opacity 0.1s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.75")}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
    >
      {label}
    </button>
  )
}
