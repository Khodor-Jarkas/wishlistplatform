"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import Container from "@/components/ui/Container"
import WishlistGrid from "@/components/wishlist/WishlistGrid"
import {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  removeFriend,
} from "@/lib/actions/friends"
import { getInitials, staticAvatarUrl } from "@/lib/utils"
import { useAuthModal } from "@/context/AuthModalContext"
import type { Profile } from "@/types"
import type { WishlistWithCounts } from "@/components/wishlist/WishlistCard"

interface Props {
  profile: Profile
  currentUserId: string | null
  isOwnProfile: boolean
  friendship: {
    id: string
    requester_id: string
    addressee_id: string
    status: string
  } | null
  wishlists: WishlistWithCounts[]
}

export default function UserProfileClient({
  profile,
  currentUserId,
  isOwnProfile,
  friendship,
  wishlists,
}: Props) {
  const [isPending, start] = useTransition()
  const [menuOpen, setMenuOpen] = useState(false)
  const { openLogin } = useAuthModal()

  const displayName = profile.first_name
    ? `${profile.first_name} ${profile.last_name ?? ""}`.trim()
    : profile.full_name ?? profile.username

  const initials = getInitials(profile)
  const isRequester  = friendship?.requester_id === currentUserId
  const isAccepted   = friendship?.status === "accepted"
  const isPendingReq = friendship?.status === "pending"
  const isFriend     = isAccepted
  const isSentByMe   = isPendingReq && isRequester
  const isSentToMe   = isPendingReq && !isRequester

  return (
    <main style={{ minHeight: "100vh", background: "#F8FAFC", paddingBottom: 60 }}>
      <Container>
        <div style={{ paddingTop: 48 }}>

          {/* Profile header */}
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 24, marginBottom: 48,
            flexWrap: "wrap",
          }}>
            {/* Avatar */}
            <div style={{
              width: 96, height: 96, borderRadius: "50%",
              background: "#38A3C7", flexShrink: 0, overflow: "hidden",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontWeight: 700, fontSize: 32,
            }}>
              {profile.avatar_url
                ? <img src={staticAvatarUrl(profile.avatar_url)!} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : initials}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", margin: "0 0 4px" }}>
                {displayName}
              </h1>
              <p style={{ fontSize: 14, color: "#64748B", margin: "0 0 8px" }}>@{profile.username}</p>
              {profile.bio && (
                <p style={{ fontSize: 14, color: "#334155", margin: "0 0 16px", maxWidth: 480 }}>
                  {profile.bio}
                </p>
              )}

              {/* Action buttons */}
              {!isOwnProfile && (
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  {/* Anon visitors see the same Add Friend button — clicking
                      opens the login modal so the action is discoverable. */}
                  {!currentUserId && (
                    <button onClick={openLogin} style={btnStyle("primary")}>
                      + Add Friend
                    </button>
                  )}
                  {isFriend && (
                    <div style={{ position: "relative" }}>
                      <button
                        onClick={() => setMenuOpen((v) => !v)}
                        disabled={isPending}
                        style={btnStyle("secondary")}
                      >
                        Friends ✓ ▾
                      </button>
                      {menuOpen && (
                        <div style={{
                          position: "absolute", top: "calc(100% + 6px)", left: 0,
                          background: "white", borderRadius: 10,
                          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                          border: "1px solid #F1F5F9",
                          minWidth: 160, zIndex: 50, padding: "4px 0",
                        }}>
                          <button
                            onClick={() => {
                              setMenuOpen(false)
                              start(() => void removeFriend(friendship!.id))
                            }}
                            style={{
                              width: "100%", textAlign: "left",
                              padding: "10px 16px", background: "none", border: "none",
                              cursor: "pointer", fontSize: 13, color: "#EF4444",
                              fontWeight: 500,
                            }}
                          >
                            Remove friend
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {isSentByMe && (
                    <button
                      onClick={() => start(() => void cancelFriendRequest(friendship!.id))}
                      disabled={isPending}
                      style={btnStyle("secondary")}
                    >
                      {isPending ? "…" : "Pending…"}
                    </button>
                  )}

                  {isSentToMe && (
                    <>
                      <button
                        onClick={() => start(() => void acceptFriendRequest(friendship!.id))}
                        disabled={isPending}
                        style={btnStyle("primary")}
                      >
                        Accept Request
                      </button>
                      <button
                        onClick={() => start(() => void declineFriendRequest(friendship!.id))}
                        disabled={isPending}
                        style={btnStyle("secondary")}
                      >
                        Decline
                      </button>
                    </>
                  )}

                  {currentUserId && !friendship && (
                    <button
                      onClick={() => start(() => void sendFriendRequest(profile.id))}
                      disabled={isPending}
                      style={btnStyle("primary")}
                    >
                      {isPending ? "Sending…" : "+ Add Friend"}
                    </button>
                  )}
                </div>
              )}

              {isOwnProfile && (
                <Link
                  href="/profile"
                  style={{
                    display: "inline-block",
                    fontSize: 13, fontWeight: 600, color: "#334155",
                    textDecoration: "none", padding: "8px 16px",
                    border: "1.5px solid #E2E8F0", borderRadius: 8,
                  }}
                >
                  Edit profile
                </Link>
              )}
            </div>
          </div>

          {/* Wishlists */}
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#0F172A", margin: "0 0 20px" }}>
            Wishlists
          </h2>
          {wishlists.length === 0 ? (
            <p style={{ fontSize: 14, color: "#94A3B8", padding: "40px 0", textAlign: "center" }}>
              No public wishlists yet.
            </p>
          ) : (
            <WishlistGrid wishlists={wishlists} isOwner={isOwnProfile} showOwner={false} />
          )}

        </div>
      </Container>
    </main>
  )
}

function btnStyle(variant: "primary" | "secondary"): React.CSSProperties {
  return {
    fontSize: 13, fontWeight: 600, padding: "9px 18px",
    borderRadius: 8, border: "1.5px solid",
    cursor: "pointer", letterSpacing: "0.03em",
    background:  variant === "primary" ? "#0F172A" : "transparent",
    color:       variant === "primary" ? "white"   : "#334155",
    borderColor: variant === "primary" ? "#0F172A" : "#E2E8F0",
    transition: "opacity 0.15s",
  }
}
