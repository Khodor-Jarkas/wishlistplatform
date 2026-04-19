"use client"

import type { ReactNode } from "react"
import { useEffect, useRef, useState, useTransition } from "react"
import {
  deleteWish,
  toggleMostWanted,
  markAsReceived,
  moveWish,
  copyWishToList,
  reserveWish,
  unreserveWish,
} from "@/lib/actions/wishes"
import { formatPrice } from "@/lib/utils"
import { useAuthModal } from "@/context/AuthModalContext"
import { useUser } from "@/hooks/useUser"
import type { Wish } from "@/types"

// ── Icons ────────────────────────────────────────────────────
const IconDots = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <circle cx="3"  cy="8" r="1.4" />
    <circle cx="8"  cy="8" r="1.4" />
    <circle cx="13" cy="8" r="1.4" />
  </svg>
)
const IconShare = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7.5 1v9" /><path d="M4.5 4L7.5 1l3 3" /><path d="M2.5 9.5v4h10v-4" />
  </svg>
)
const IconExternalLink = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6.5 2.5H3a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V8" />
    <path d="M9.5 1.5H13.5V5.5" /><path d="M13.5 1.5L7 8" />
  </svg>
)
const IconStarFilled = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7.5 1.5l1.6 3.24 3.58.52-2.59 2.53.61 3.57-3.2-1.68-3.2 1.68.61-3.57L2.32 5.26l3.58-.52z" />
  </svg>
)
const IconStarOutline = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7.5 1.5l1.6 3.24 3.58.52-2.59 2.53.61 3.57-3.2-1.68-3.2 1.68.61-3.57L2.32 5.26l3.58-.52z" />
  </svg>
)
const IconGift = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1.5" y="5" width="12" height="2" rx="0.5" />
    <path d="M2.5 7v6.5h10V7" /><path d="M7.5 5v8.5" />
    <path d="M7.5 5c0 0-1-1-1-2.25a1.25 1.25 0 012.5 0C9 4 8 5 8 5H7.5" />
    <path d="M7.5 5c0 0 1-1 1-2.25a1.25 1.25 0 00-2.5 0C6 4 7 5 7 5H7.5" />
  </svg>
)
const IconEdit = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.5 1.5a1.5 1.5 0 012.12 2.12l-8.5 8.5-3 .88.88-3 8.5-8.5z" />
    <path d="M9.5 2.5l2.5 2.5" />
  </svg>
)
const IconTrash = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1.5 4h12" /><path d="M5 4V2.5a.5.5 0 01.5-.5h4a.5.5 0 01.5.5V4" />
    <path d="M2.5 4l.75 9h8.5l.75-9" /><path d="M6 7v3.5M9 7v3.5" />
  </svg>
)
const IconMove = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 4l4 3.5-4 3.5" /><path d="M2 7.5h11.5" />
    <path d="M2 3.5h5" /><path d="M2 11.5h3.5" />
  </svg>
)
const IconBookmarkPlus = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3.5 2h8v12l-4-2.5-4 2.5V2z" /><path d="M7.5 5v4M5.5 7h4" />
  </svg>
)
const IconCheck = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 7.5l4 4L13 4" />
  </svg>
)
const IconXMark = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3l9 9M12 3l-9 9" />
  </svg>
)
const IconChevronLeft = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 3L5.5 7.5l4 4.5" />
  </svg>
)

// ── Types ────────────────────────────────────────────────────
interface Props {
  wish: Wish
  wishlistId: string
  isOwner: boolean
  currentUserId: string | null
  userWishlists?: { id: string; title: string }[]
  onEditRequest: (wish: Wish) => void
}

// ── Component ────────────────────────────────────────────────
export default function WishCard({
  wish,
  wishlistId,
  isOwner,
  currentUserId,
  userWishlists = [],
  onEditRequest,
}: Props) {
  const { openLogin }                 = useAuthModal()
  const { user: clientUser }          = useUser()
  const [menuOpen, setMenuOpen]       = useState(false)
  const [showMove, setShowMove]       = useState(false)
  const [showCopyTo, setShowCopyTo]   = useState(false)
  const [wishCopied, setWishCopied]   = useState(false)
  const [deleting, setDeleting]       = useState(false)
  const [cardHovered, setCardHovered] = useState(false)
  const [touchDevice, setTouchDevice] = useState(false)
  const [menuPos, setMenuPos]         = useState<"above"|"below"|"right"|"left">("above")
  const [isPending, start]            = useTransition()
  const menuRef                       = useRef<HTMLDivElement>(null)
  const leaveTimer                    = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Use client-side user as fallback in case server-side auth didn't resolve
  const effectiveUserId = clientUser?.id ?? currentUserId
  const reservation     = (wish.reservations ?? [])[0] ?? null
  // Prefer server-computed value; fall back to join data + client user
  const isReservedByMe  = wish.isReservedByMe
    ?? (!!reservation && reservation.reserved_by === effectiveUserId)
  const isBoughtByMe    = isReservedByMe && reservation?.status === "bought"
  const isMostWanted   = wish.priority === 2

  // Detect touch device on first touch — show button permanently on mobile
  useEffect(() => {
    function onTouch() { setTouchDevice(true) }
    window.addEventListener("touchstart", onTouch, { once: true, passive: true })
    return () => window.removeEventListener("touchstart", onTouch)
  }, [])

  // Cleanup leave timer on unmount
  useEffect(() => () => { if (leaveTimer.current) clearTimeout(leaveTimer.current) }, [])

  // Close dropdown on outside click
  useEffect(() => {
    if (!menuOpen) return
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
        setShowMove(false)
      }
    }
    document.addEventListener("mousedown", handleOutside)
    return () => document.removeEventListener("mousedown", handleOutside)
  }, [menuOpen])

  function cancelLeave() {
    if (leaveTimer.current) { clearTimeout(leaveTimer.current); leaveTimer.current = null }
  }

  function handleCardEnter() {
    cancelLeave()
    setCardHovered(true)
  }

  // Delay before hiding so the mouse has time to reach a dropdown that extends outside the card
  function handleCardLeave() {
    leaveTimer.current = setTimeout(() => {
      setCardHovered(false)
      setMenuOpen(false)
      setShowMove(false)
      setShowCopyTo(false)
      setDeleting(false)
    }, 320)
  }

  function handleToggleMostWanted() {
    setMenuOpen(false)
    start(() => void toggleMostWanted(wish.id, wishlistId, isMostWanted))
  }
  function handleMarkReceived() {
    setMenuOpen(false)
    start(() => void markAsReceived(wish.id, wishlistId))
  }
  function handleDelete() {
    if (!deleting) { setDeleting(true); return }
    setMenuOpen(false)
    setDeleting(false)
    start(() => void deleteWish(wish.id, wishlistId))
  }
  function handleMove(newWishlistId: string) {
    setMenuOpen(false)
    setShowMove(false)
    start(() => void moveWish(wish.id, newWishlistId, wishlistId))
  }
  function handleCopyTo(targetWishlistId: string) {
    setMenuOpen(false)
    setShowCopyTo(false)
    start(async () => {
      const res = await copyWishToList(wish.id, targetWishlistId)
      if (!res?.error) {
        setWishCopied(true)
        setTimeout(() => setWishCopied(false), 2000)
      }
    })
  }
  function handleReserve() {
    setMenuOpen(false)
    start(() => void reserveWish(wish.id, wishlistId))
  }
  function handleUnreserve() {
    setMenuOpen(false)
    start(() => void unreserveWish(wish.id, wishlistId))
  }
  function handleShare() {
    setMenuOpen(false)
    navigator.clipboard.writeText(`${window.location.origin}/wishlists/${wishlistId}`)
  }

  const otherWishlists = userWishlists.filter((w) => w.id !== wishlistId)

  return (
    <div
      style={{ opacity: isPending ? 0.6 : 1, transition: "opacity 0.2s" }}
      onMouseEnter={handleCardEnter}
      onMouseLeave={handleCardLeave}
    >
      {/* ── Image area (clean — no overlapping UI) ── */}
      <div style={{
        position: "relative",
        borderRadius: 12,
        overflow: "hidden",
        aspectRatio: "3/4",
        background: "transparent",
      }}>
        {wish.image_url ? (
          <img
            src={wish.image_url}
            alt={wish.title}
            style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
          />
        ) : (
          <div style={{
            width: "100%", height: "100%",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 48, color: "#CBD5E1",
          }}>
            🎁
          </div>
        )}

        {/* Most Wanted star badge — top-left so it doesn't crowd the info row */}
        {isMostWanted && (
          <div style={{
            position: "absolute", top: 8, left: 8,
            width: 26, height: 26, borderRadius: "50%",
            background: "rgba(255,255,255,0.92)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
            color: "#F59E0B",
          }}>
            <IconStarFilled />
          </div>
        )}

        {/* Reserved / Bought overlay (visitors only) */}
        {!isOwner && wish.is_reserved && (
          <div style={{
            position: "absolute", inset: 0,
            background: isBoughtByMe ? "rgba(16,185,129,0.55)" : "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.2s",
          }}>
            <span style={{
              color: "white",
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              textAlign: "center",
              textShadow: "0 1px 4px rgba(0,0,0,0.3)",
              padding: "0 8px",
            }}>
              {isBoughtByMe
                ? <><span>Bought</span><br /><span>by you</span></>
                : isReservedByMe
                  ? <><span>Reserved</span><br /><span>by you</span></>
                  : "Reserved"}
            </span>
          </div>
        )}
      </div>

      {/* ── Info row + ··· menu (below the image) ── */}
      <div style={{ marginTop: 8, display: "flex", alignItems: "flex-start", gap: 6, minWidth: 0 }}>

        {/* Title + price */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: 13, fontWeight: 500, color: "#0F172A", margin: "0 0 2px",
            lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis",
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          }}>
            {wish.title}
          </p>
          {wish.price != null && (
            <p style={{ fontSize: 13, color: "#64748B", margin: 0, fontWeight: 500 }}>
              {formatPrice(wish.price, wish.currency)}
            </p>
          )}
        </div>

        {/* ··· button — fades in on card hover, dropdown opens upward */}
        <div
          ref={menuRef}
          style={{
            position: "relative",
            flexShrink: 0,
            opacity: cardHovered || touchDevice || menuOpen ? 1 : 0,
            transition: "opacity 0.15s",
            pointerEvents: cardHovered || touchDevice || menuOpen ? "auto" : "none",
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              cancelLeave()
              if (!menuOpen) {
                // Pick the direction with enough room, priority: right → below → left → above
                const rect = e.currentTarget.getBoundingClientRect()
                const W = 220, H = 320, G = 8
                if (window.innerWidth  - rect.right  >= W + G) setMenuPos("right")
                else if (window.innerHeight - rect.bottom >= H + G) setMenuPos("below")
                else if (rect.left           >= W + G) setMenuPos("left")
                else setMenuPos("above")
              }
              setMenuOpen((v) => !v)
              setShowMove(false)
              setShowCopyTo(false)
              setDeleting(false)
            }}
            style={{
              width: 28, height: 28, borderRadius: 8,
              background: menuOpen ? "#F1F5F9" : "transparent",
              border: "1px solid",
              borderColor: menuOpen ? "#E2E8F0" : "transparent",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#64748B",
              transition: "background 0.1s, border-color 0.1s",
            }}
            onMouseEnter={(e) => { if (!menuOpen) e.currentTarget.style.background = "#F8FAFC"; e.currentTarget.style.borderColor = "#E2E8F0" }}
            onMouseLeave={(e) => { if (!menuOpen) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "transparent" } }}
            aria-label="Wish options"
          >
            <IconDots />
          </button>

          {/* Dropdown — opens in the direction with most room */}
          {menuOpen && (
            <div onMouseEnter={cancelLeave} style={{
              position: "absolute",
              ...{
                above: { bottom: "calc(100% + 6px)", right: 0 },
                below: { top:    "calc(100% + 6px)", right: 0 },
                right: { left:   "calc(100% + 6px)", top:   0 },
                left:  { right:  "calc(100% + 6px)", top:   0 },
              }[menuPos],
              background: "white",
              borderRadius: 12,
              boxShadow: "0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)",
              border: "1px solid #F1F5F9",
              minWidth: 210,
              zIndex: 50,
              padding: "4px 0",
            }}>
              {isOwner ? (
                <>
                  {otherWishlists.length > 0 && !showMove && (
                    <MenuItem icon={<IconMove />} label="Move to another list" onClick={() => setShowMove(true)} />
                  )}
                  {showMove && (
                    <>
                      <p style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8", padding: "6px 14px 4px", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Move to
                      </p>
                      {otherWishlists.map((wl) => (
                        <MenuItem key={wl.id} icon={<IconMove />} label={wl.title} onClick={() => handleMove(wl.id)} />
                      ))}
                      <MenuItem icon={<IconChevronLeft />} label="Back" onClick={() => setShowMove(false)} />
                    </>
                  )}

                  {!showMove && (
                    <>
                      <MenuItem icon={<IconShare />} label="Share wishlist" onClick={handleShare} />
                      {wish.url && (
                        <MenuItem icon={<IconExternalLink />} label="Visit store" onClick={() => { setMenuOpen(false); window.open(wish.url!, "_blank") }} />
                      )}
                      <Divider />
                      <MenuItem
                        icon={isMostWanted ? <IconStarFilled /> : <IconStarOutline />}
                        label={isMostWanted ? "Remove most wanted" : "Mark as most wanted"}
                        onClick={handleToggleMostWanted}
                        accent={isMostWanted ? "amber" : undefined}
                      />
                      <MenuItem icon={<IconGift />} label="Mark as received" onClick={handleMarkReceived} />
                      <Divider />
                      <MenuItem icon={<IconEdit />} label="Edit wish" onClick={() => { setMenuOpen(false); onEditRequest(wish) }} />
                      <MenuItem
                        icon={<IconTrash />}
                        label={deleting ? "Tap again to confirm" : "Delete wish"}
                        onClick={handleDelete}
                        danger
                      />
                    </>
                  )}
                </>
              ) : (
                <>
                  {showCopyTo ? (
                    <>
                      <p style={{ fontSize: 11, fontWeight: 600, color: "#94A3B8", padding: "6px 14px 4px", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        Add to
                      </p>
                      {userWishlists.map((wl) => (
                        <MenuItem key={wl.id} icon={<IconBookmarkPlus />} label={wl.title} onClick={() => handleCopyTo(wl.id)} />
                      ))}
                      <MenuItem icon={<IconChevronLeft />} label="Back" onClick={() => setShowCopyTo(false)} />
                    </>
                  ) : (
                    <>
                      <MenuItem
                        icon={<IconBookmarkPlus />}
                        label={wishCopied ? "✓ Added!" : "Add to my wishlist"}
                        onClick={() => {
                          if (!effectiveUserId) { setMenuOpen(false); openLogin(); return }
                          if (userWishlists.length > 0) setShowCopyTo(true)
                        }}
                      />
                      <MenuItem icon={<IconShare />} label="Share wishlist" onClick={handleShare} />
                      {wish.url && (
                        <MenuItem icon={<IconExternalLink />} label="Visit store" onClick={() => { setMenuOpen(false); window.open(wish.url!, "_blank") }} />
                      )}
                      <Divider />
                      {isReservedByMe ? (
                        <MenuItem icon={<IconXMark />} label="Remove my reservation" onClick={handleUnreserve} danger />
                      ) : (
                        !wish.is_reserved && (
                          <MenuItem
                            icon={<IconCheck />}
                            label="Reserve this wish"
                            onClick={() => {
                              if (!effectiveUserId) { setMenuOpen(false); openLogin(); return }
                              handleReserve()
                            }}
                          />
                        )
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────
function Divider() {
  return <div style={{ height: 1, background: "#F1F5F9", margin: "3px 0" }} />
}

function MenuItem({
  icon, label, onClick, danger = false, accent,
}: {
  icon: ReactNode
  label: string
  onClick: () => void
  danger?: boolean
  accent?: "amber"
}) {
  const color = danger ? "#EF4444" : accent === "amber" ? "#D97706" : "#0F172A"
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", textAlign: "left",
        padding: "9px 14px",
        background: "none", border: "none",
        display: "flex", alignItems: "center", gap: 10,
        cursor: "pointer", fontSize: 13,
        color,
        fontWeight: danger ? 600 : 400,
        transition: "background 0.1s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = danger ? "#FEF2F2" : accent === "amber" ? "#FFFBEB" : "#F8FAFC"
      }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "none" }}
    >
      <span style={{ width: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </span>
      {label}
    </button>
  )
}
