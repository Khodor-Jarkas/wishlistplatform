"use client"

import { useState, useTransition } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { toast } from "sonner"
import { followWishlist, unfollowWishlist } from "@/lib/actions/wishlists"
import Container from "@/components/ui/Container"
import DeleteConfirmModal from "./DeleteConfirmModal"
import WishCard from "./WishCard"
import { getInitials, staticAvatarUrl, timeAgo } from "@/lib/utils"
import { useAddWishModal } from "@/context/AddWishModalContext"
import { useAuthModal } from "@/context/AuthModalContext"
import type { Wishlist, Wish } from "@/types"

// Lazy-load — only fetched when the user clicks Edit (most visitors never do).
const EditWishlistModal = dynamic(() => import("./EditWishlistModal"), { ssr: false })
const EditWishModal     = dynamic(() => import("./EditWishModal"),     { ssr: false })

type CollabProfile = {
  id: string
  username: string | null
  first_name: string | null
  last_name: string | null
  full_name: string | null
  avatar_url: string | null
}

interface WishlistFull extends Wishlist {
  wish_count: number
  follower_count: number
  profiles?: {
    first_name?: string | null
    last_name?: string | null
    full_name?: string | null
    username?: string | null
    avatar_url?: string | null
  }
}

interface Props {
  wishlist: WishlistFull
  wishes: Wish[]
  isOwner: boolean
  isFollowing: boolean
  currentUserId: string | null
  userWishlists: { id: string; title: string }[]
  isFriend: boolean
  collaborators?: CollabProfile[]
}

export default function WishlistDetail({
  wishlist,
  wishes,
  isOwner,
  isFollowing: initialFollowing,
  currentUserId,
  userWishlists,
  isFriend,
  collaborators = [],
}: Props) {
  const [following, setFollowing]   = useState(initialFollowing)
  const [followerCount, setFollowerCount] = useState(wishlist.follower_count)
  const [editWishlistOpen, setEditWishlistOpen] = useState(false)
  const [deleteWishlistOpen, setDeleteWishlistOpen] = useState(false)
  const [editingWish, setEditingWish] = useState<Wish | null>(null)
  const [isPending, start]          = useTransition()
  const { open: openAddWish }       = useAddWishModal()
  const { openLogin }               = useAuthModal()

  const owner = wishlist.profiles
  const ownerInitials = getInitials({
    first_name: owner?.first_name,
    last_name:  owner?.last_name,
    full_name:  owner?.full_name,
    username:   owner?.username,
  })
  const ownerName = owner?.first_name
    ? `${owner.first_name} ${owner.last_name ? owner.last_name[0] + "." : ""}`.trim()
    : owner?.full_name ?? owner?.username ?? "User"

  // Most-recent wish for the "last updated" line
  const lastWish = wishes.length > 0
    ? [...wishes].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
    : null

  function handleFollow() {
    if (!currentUserId) { openLogin(); return }
    start(async () => {
      if (following) {
        await unfollowWishlist(wishlist.id)
        setFollowing(false)
        setFollowerCount((c) => Math.max(0, c - 1))
        toast("Unfollowed wishlist")
      } else {
        await followWishlist(wishlist.id)
        setFollowing(true)
        setFollowerCount((c) => c + 1)
        toast.success("Following wishlist!")
      }
    })
  }

  function handleShare() {
    const url = `${window.location.origin}/wishlists/${wishlist.id}`
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Link copied to clipboard!")
    })
  }

  return (
    <main style={{ minHeight: "100vh", background: "#F8FAFC", paddingBottom: 80 }}>

      {/* ── Cover banner ── */}
      <div style={{ height: 240, position: "relative", background: "#CBD5E1" }}>
        {wishlist.cover_image_url && (
          <img
            src={wishlist.cover_image_url}
            alt={wishlist.title}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        )}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 60%)",
        }} />
      </div>

      <Container>
        <div style={{ maxWidth: 960, margin: "0 auto", paddingTop: "clamp(16px, 3vw, 28px)" }}>

          {/* Back link */}
          <Link
            href={currentUserId ? "/dashboard" : "/inspire"}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 13, color: "#64748B", textDecoration: "none", marginBottom: 20,
            }}
          >
            ← {currentUserId ? "My Wishlists" : "Discover"}
          </Link>

          {/* ── Title row ── */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0F172A", margin: 0, lineHeight: 1.2, flex: "1 1 200px" }}>
              {wishlist.title}
            </h1>
            {isOwner && (
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button
                  onClick={() => setEditWishlistOpen(true)}
                  style={ownerBtn}
                  title="Edit wishlist"
                >
                  ✏️
                </button>
                <button
                  onClick={() => setDeleteWishlistOpen(true)}
                  style={{ ...ownerBtn, color: "#EF4444" }}
                  title="Delete wishlist"
                >
                  🗑
                </button>
              </div>
            )}
          </div>

          {/* On behalf badge */}
          {wishlist.is_for_others && wishlist.beneficiary_name && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "#FDF4FF", border: "1px solid #E9D5FF",
              borderRadius: 20, padding: "4px 12px", marginBottom: 14,
              fontSize: 12, fontWeight: 600, color: "#7C3AED",
            }}>
              🎁 On behalf of {wishlist.beneficiary_name}
            </div>
          )}

          {/* ── Owner + followers row ── */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
            {/* Left: creator + collaborators (YouTube-style) */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Creator avatar */}
              <div style={{
                width: 36, height: 36, borderRadius: "50%", background: "#38A3C7", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "white", fontWeight: 700, fontSize: 13, overflow: "hidden",
              }}>
                {owner?.avatar_url ? (
                  <img src={staticAvatarUrl(owner.avatar_url)!} alt={ownerName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : ownerInitials}
              </div>

              {/* Collaborator avatars overlapping */}
              {collaborators.map((c, i) => {
                const cInitials = getInitials({ first_name: c.first_name, last_name: c.last_name, full_name: c.full_name, username: c.username })
                const colors = ["#8B5CF6", "#10B981", "#F59E0B", "#EC4899", "#EF4444"]
                return (
                  <div
                    key={c.id}
                    style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: colors[i % colors.length], flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "white", fontWeight: 700, fontSize: 13, overflow: "hidden",
                      border: "2px solid white", marginLeft: -10,
                    }}
                    title={c.first_name ? `${c.first_name} ${c.last_name ?? ""}`.trim() : c.username ?? "Collaborator"}
                  >
                    {c.avatar_url ? (
                      <img src={staticAvatarUrl(c.avatar_url)!} alt={cInitials} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : cInitials}
                  </div>
                )
              })}

              {/* Name(s) */}
              <span style={{ fontSize: 15, fontWeight: 600, color: "#0F172A" }}>
                {ownerName}
                {collaborators.length > 0 && (
                  <span style={{ color: "#64748B", fontWeight: 400 }}>
                    {" "}&amp;{" "}
                    {collaborators.length === 1
                      ? (collaborators[0].first_name
                          ? `${collaborators[0].first_name} ${collaborators[0].last_name ? collaborators[0].last_name[0] + "." : ""}`.trim()
                          : collaborators[0].username ?? "Collaborator")
                      : `${collaborators.length} others`}
                  </span>
                )}
              </span>
            </div>

            {/* Right: followers + follow/share buttons */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 14, color: "#64748B" }}>
                <strong style={{ color: "#0F172A" }}>{followerCount}</strong> {followerCount === 1 ? "follower" : "followers"}
              </span>

              {!isOwner && (
                <button
                  onClick={handleFollow}
                  disabled={isPending}
                  title={!currentUserId ? "Sign in to follow this wishlist" : undefined}
                  style={{
                    padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                    border: following ? "1px solid #38A3C7" : "1px solid #E2E8F0",
                    background: following ? "#E0F4FA" : "white",
                    color: following ? "#1E6B88" : "#334155",
                    cursor: isPending ? "not-allowed" : "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  {following ? "✓ Following" : "+ Follow"}
                </button>
              )}

              <button
                onClick={handleShare}
                style={{
                  padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                  border: "1px solid #E2E8F0",
                  background: "white", color: "#334155",
                  cursor: "pointer", transition: "all 0.2s",
                }}
              >
                🔗 Share
              </button>
            </div>
          </div>

          {/* ── Separator ── */}
          <div style={{ height: 1, background: "#E2E8F0", marginBottom: 16 }} />

          {/* ── Activity line + Add Wish button ── */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            {lastWish ? (
              <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>
                <strong style={{ color: "#0F172A" }}>{wishes.length}</strong>{" "}
                {wishes.length === 1 ? "wish" : "wishes"}{" "}
                <span style={{ color: "#94A3B8" }}>{timeAgo(lastWish.created_at)}</span>
              </p>
            ) : (
              <span />
            )}
            {isOwner && (
              <button
                onClick={() => openAddWish(wishlist.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "8px 16px", borderRadius: 8, border: "none",
                  background: "#0F172A", color: "white",
                  fontSize: 13, fontWeight: 700, letterSpacing: "0.04em",
                  cursor: "pointer",
                }}
              >
                + ADD WISH
              </button>
            )}
          </div>

          {/* ── Wish grid ── */}
          {wishes.length === 0 ? (
            <div style={{
              padding: "56px 24px", background: "white", borderRadius: 16,
              border: "2px dashed #E2E8F0", textAlign: "center",
            }}>
              <div style={{ fontSize: 42, marginBottom: 12 }}>✨</div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: "#0F172A", margin: "0 0 8px" }}>
                No wishes yet
              </h3>
              <p style={{ fontSize: 13, color: "#94A3B8", margin: 0 }}>
                {isOwner ? 'Click "ADD WISH" to add your first wish.' : "This wishlist is empty for now."}
              </p>
            </div>
          ) : (
            <>
              {/* Active wishes */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                gap: 20,
              }}>
                {wishes.filter(w => !w.is_received).map((wish) => (
                  <WishCard
                    key={wish.id}
                    wish={wish}
                    wishlistId={wishlist.id}
                    isOwner={isOwner}
                    currentUserId={currentUserId}
                    userWishlists={userWishlists}
                    isFriend={isFriend}
                    onEditRequest={(w) => setEditingWish(w)}
                  />
                ))}
              </div>

              {/* Received wishes — owner only */}
              {isOwner && wishes.some(w => w.is_received) && (
                <div style={{ marginTop: 48 }}>
                  <div style={{
                    fontSize: 11, fontWeight: 700, color: "#94A3B8",
                    textTransform: "uppercase", letterSpacing: "0.1em",
                    marginBottom: 16,
                  }}>
                    Received
                  </div>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                    gap: 20,
                    opacity: 0.5,
                  }}>
                    {wishes.filter(w => w.is_received).map((wish) => (
                      <WishCard
                        key={wish.id}
                        wish={wish}
                        wishlistId={wishlist.id}
                        isOwner={isOwner}
                        currentUserId={currentUserId}
                        userWishlists={userWishlists}
                        onEditRequest={(w) => setEditingWish(w)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Container>

      {/* ── Modals ── */}
      {editWishlistOpen && (
        <EditWishlistModal wishlist={wishlist} onClose={() => setEditWishlistOpen(false)} />
      )}
      {deleteWishlistOpen && (
        <DeleteConfirmModal
          wishlistId={wishlist.id}
          title={wishlist.title}
          onClose={() => setDeleteWishlistOpen(false)}
        />
      )}
      {editingWish && (
        <EditWishModal
          wish={editingWish}
          wishlistId={wishlist.id}
          onClose={() => setEditingWish(null)}
        />
      )}
    </main>
  )
}

const ownerBtn: React.CSSProperties = {
  width: 34, height: 34, borderRadius: 8,
  border: "1px solid #E2E8F0", background: "white",
  cursor: "pointer", fontSize: 15,
  display: "flex", alignItems: "center", justifyContent: "center",
}
