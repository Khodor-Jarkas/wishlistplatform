"use client"

import { useState, useTransition } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  reserveWish, unreserveWish, markAsBought, markAsUnbought, deleteWish,
} from "@/lib/actions/wishes"
import { useAuthModal } from "@/context/AuthModalContext"
import Container from "@/components/ui/Container"
import { formatPrice, getInitials } from "@/lib/utils"
import { useIsMobile } from "@/lib/hooks/useMediaQuery"
import type { Wish } from "@/types"

const EditWishModal = dynamic(() => import("@/components/wishlist/EditWishModal"), { ssr: false })

interface OwnerProfile {
  username: string
  first_name: string | null
  last_name: string | null
  full_name: string | null
  avatar_url: string | null
}

interface Props {
  wish: Wish
  wishlist: { id: string; title: string }
  owner: OwnerProfile | null
  isOwner: boolean
  currentUserId: string | null
  myReservationId: string | null
  myReservationStatus: "reserved" | "bought" | null
}

const DESC_TRUNCATE = 220

export default function WishDetailClient({
  wish, wishlist, owner, isOwner, currentUserId,
  myReservationId, myReservationStatus,
}: Props) {
  const router = useRouter()
  const { openLogin } = useAuthModal()
  const isMobile = useIsMobile()
  const [isPending, start] = useTransition()
  const [editOpen, setEditOpen] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [copied, setCopied] = useState(false)

  const isReservedByMe = !!myReservationId
  const isBoughtByMe   = myReservationStatus === "bought"
  const isReservedBySomeoneElse = wish.is_reserved && !isReservedByMe
  const ownerName = owner?.first_name
    ? `${owner.first_name} ${owner.last_name ?? ""}`.trim()
    : owner?.full_name ?? owner?.username ?? "Someone"

  function refresh() { router.refresh() }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleReserve() {
    if (!currentUserId) { openLogin(); return }
    start(async () => { await reserveWish(wish.id, wishlist.id); refresh() })
  }
  function handleUnreserve() {
    start(async () => { await unreserveWish(wish.id, wishlist.id); refresh() })
  }
  function handleMarkBought() {
    if (!myReservationId) return
    start(async () => { await markAsBought(myReservationId, wishlist.id); refresh() })
  }
  function handleMarkUnbought() {
    if (!myReservationId) return
    start(async () => { await markAsUnbought(myReservationId, wishlist.id); refresh() })
  }
  function handleDeleteClick() {
    // Two-click confirm: first click arms, second click executes.
    if (!confirmingDelete) {
      setConfirmingDelete(true)
      return
    }
    setConfirmingDelete(false)
    start(async () => {
      await deleteWish(wish.id, wishlist.id)
      router.push(`/wishlists/${wishlist.id}`)
    })
  }

  const description = wish.description ?? ""
  const needsTruncate = description.length > DESC_TRUNCATE
  const visibleDescription = !showFullDescription && needsTruncate
    ? description.slice(0, DESC_TRUNCATE).trimEnd() + "…"
    : description

  return (
    <main style={{ minHeight: "100vh", background: "#F8FAFC", paddingBottom: 80 }}>
      <Container>
        <div style={{ paddingTop: isMobile ? 20 : 36 }}>

          {/* Back to wishlist */}
          <Link
            href={`/wishlists/${wishlist.id}`}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 13, color: "#475569", textDecoration: "none",
              marginBottom: isMobile ? 16 : 24,
            }}
          >
            ← {wishlist.title}
          </Link>

          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
            gap: isMobile ? 24 : 56,
            alignItems: "start",
          }}>

            {/* ── Left: image + share ── */}
            <div style={{
              position: "relative",
              background: "#F1F5F9",
              borderRadius: 20,
              overflow: "hidden",
              aspectRatio: "1 / 1",
              maxWidth: isMobile ? "100%" : 560,
            }}>
              {wish.image_url ? (
                <img
                  src={wish.image_url}
                  alt={wish.title}
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              ) : (
                <div style={{
                  position: "absolute", inset: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 80,
                }}>
                  🎁
                </div>
              )}

              {/* Share overlay */}
              <button
                onClick={handleShare}
                title={copied ? "Link copied" : "Copy link"}
                style={{
                  position: "absolute", top: 16, right: 16,
                  width: 38, height: 38, borderRadius: "50%",
                  background: "rgba(255,255,255,0.95)",
                  border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#0F172A",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
                }}
              >
                {copied ? "✓" : (
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15M9 12l3-3m0 0 3 3m-3-3v12" />
                  </svg>
                )}
              </button>
            </div>

            {/* ── Right: details ── */}
            <div>
              <h1 style={{
                margin: 0, fontSize: isMobile ? 22 : 28,
                fontWeight: 700, color: "#0F172A",
                letterSpacing: "-0.01em", lineHeight: 1.25,
              }}>
                {wish.title}
              </h1>

              {wish.price != null && (
                <p style={{
                  margin: "12px 0 0", fontSize: isMobile ? 22 : 26,
                  fontWeight: 700, color: "#0F172A",
                }}>
                  {formatPrice(wish.price, wish.currency)}
                </p>
              )}

              {description && (
                <p style={{
                  margin: "20px 0 0", fontSize: 15, color: "#475569",
                  lineHeight: 1.6, whiteSpace: "pre-wrap",
                }}>
                  {visibleDescription}
                  {needsTruncate && (
                    <button
                      onClick={() => setShowFullDescription((v) => !v)}
                      style={{
                        marginLeft: 4, background: "none", border: "none",
                        color: "#38A3C7", cursor: "pointer", fontWeight: 600,
                        fontSize: 15, padding: 0,
                      }}
                    >
                      {showFullDescription ? "less" : "more"}
                    </button>
                  )}
                </p>
              )}

              {/* Go to store — primary CTA */}
              {wish.url && (
                <a
                  href={wish.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    width: "100%", padding: "14px 24px",
                    borderRadius: 10,
                    background: "#38A3C7", color: "white",
                    fontWeight: 700, fontSize: 14, letterSpacing: "0.04em",
                    textDecoration: "none",
                    marginTop: 28,
                  }}
                >
                  Go to store
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                </a>
              )}

              {/* Action buttons */}
              <div style={{ marginTop: wish.url ? 12 : 28, display: "flex", flexDirection: "column", gap: 10 }}>
                {isOwner ? (
                  <>
                    <button
                      onClick={() => setEditOpen(true)}
                      style={secondaryBtn}
                    >
                      ✎ Edit wish
                    </button>
                    <button
                      onClick={handleDeleteClick}
                      onBlur={() => setConfirmingDelete(false)}
                      disabled={isPending}
                      style={{
                        ...secondaryBtn,
                        color: confirmingDelete ? "white" : "#EF4444",
                        background: confirmingDelete ? "#EF4444" : "white",
                        borderColor: "#EF4444",
                      }}
                    >
                      {confirmingDelete ? "Click again to confirm" : "Delete wish"}
                    </button>
                  </>
                ) : isReservedByMe ? (
                  <>
                    {isBoughtByMe ? (
                      <button
                        onClick={handleMarkUnbought}
                        disabled={isPending}
                        style={{ ...secondaryBtn, color: "#10B981", borderColor: "#10B981" }}
                      >
                        ✓ Bought · undo
                      </button>
                    ) : (
                      <button
                        onClick={handleMarkBought}
                        disabled={isPending}
                        style={{ ...primaryBtnGreen, opacity: isPending ? 0.7 : 1 }}
                      >
                        Mark as bought
                      </button>
                    )}
                    <button
                      onClick={handleUnreserve}
                      disabled={isPending}
                      style={{ ...secondaryBtn, color: "#EF4444", borderColor: "#FCA5A5" }}
                    >
                      Remove my reservation
                    </button>
                  </>
                ) : isReservedBySomeoneElse ? (
                  <div style={{
                    padding: "12px 14px", borderRadius: 10,
                    background: "#F1F5F9", color: "#475569",
                    fontSize: 13, textAlign: "center", lineHeight: 1.5,
                  }}>
                    Already reserved by another friend.
                  </div>
                ) : currentUserId ? (
                  <button
                    onClick={handleReserve}
                    disabled={isPending}
                    style={{ ...primaryBtnGreen, opacity: isPending ? 0.7 : 1 }}
                  >
                    Reserve this wish
                  </button>
                ) : null /* guests: no reserve option */}
              </div>

              {/* Owner footer */}
              <div style={{
                marginTop: 32, paddingTop: 20,
                borderTop: "1px solid #E2E8F0",
                display: "flex", alignItems: "center", gap: 10,
                fontSize: 13, color: "#64748B",
              }}>
                {owner && (
                  <Link
                    href={`/users/${owner.username}`}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      textDecoration: "none", color: "#475569",
                    }}
                  >
                    <span style={{
                      width: 26, height: 26, borderRadius: "50%",
                      background: "#38A3C7", overflow: "hidden",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: "white", fontSize: 11, fontWeight: 700,
                    }}>
                      {owner.avatar_url
                        ? <img src={owner.avatar_url} alt={ownerName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : getInitials(owner)}
                    </span>
                    <span>From <strong style={{ color: "#0F172A" }}>{wishlist.title}</strong> by {ownerName}</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* Edit modal */}
      {editOpen && (
        <EditWishModal
          wish={wish}
          wishlistId={wishlist.id}
          onClose={() => { setEditOpen(false); refresh() }}
        />
      )}
    </main>
  )
}

// ── Button styles ─────────────────────────────────────────────
const primaryBtnGreen: React.CSSProperties = {
  width: "100%", padding: "13px 20px", borderRadius: 10,
  border: "none", background: "#10B981", color: "white",
  fontWeight: 700, fontSize: 13, letterSpacing: "0.04em",
  cursor: "pointer", textAlign: "center",
}

const secondaryBtn: React.CSSProperties = {
  width: "100%", padding: "12px 20px", borderRadius: 10,
  border: "1.5px solid #E2E8F0", background: "white", color: "#334155",
  fontWeight: 600, fontSize: 13, letterSpacing: "0.04em",
  cursor: "pointer", textAlign: "center",
}
