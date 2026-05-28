"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { formatPrice, getInitials, staticAvatarUrl } from "@/lib/utils"
import { unreserveWish, markAsBought, markAsUnbought } from "@/lib/actions/wishes"

interface Props {
  reservation: any
}

export default function ReservationCard({ reservation }: Props) {
  const router = useRouter()
  const [isPending, start] = useTransition()

  const wish       = reservation.wish
  const wishlistId = wish?.wishlist?.id
  const owner      = wish?.wishlist?.profiles
  const ownerName  = owner?.first_name
    ? `${owner.first_name} ${owner.last_name ?? ""}`.trim()
    : owner?.username ?? "Unknown"
  const ownerInitials = owner ? getInitials(owner) : "?"
  const isBought   = reservation.status === "bought"

  function handleBoughtToggle() {
    if (!wishlistId) return
    start(async () => {
      if (isBought) await markAsUnbought(reservation.id, wishlistId)
      else          await markAsBought(reservation.id, wishlistId)
      router.refresh()
    })
  }

  function handleUnreserve() {
    if (!wishlistId) return
    start(async () => {
      await unreserveWish(wish.id, wishlistId)
      router.refresh()
    })
  }

  return (
    <div style={{
      background: "white",
      borderRadius: 16,
      overflow: "hidden",
      border: isBought ? "1.5px solid #D1FAE5" : "1px solid #F1F5F9",
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      display: "flex",
      flexDirection: "column",
      opacity: isPending ? 0.6 : 1,
      transition: "opacity 0.15s",
    }}>
      {/* Image */}
      <Link
        href={wishlistId ? `/wishlists/${wishlistId}` : `/users/${owner?.username ?? ""}`}
        style={{ display: "block", position: "relative", paddingTop: "120%", background: "#F1F5F9", flexShrink: 0 }}
      >
        {wish.image_url ? (
          <img
            src={wish.image_url}
            alt={wish.title}
            loading="lazy"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 40,
          }}>
            🎁
          </div>
        )}

        {isBought && (
          <div style={{
            position: "absolute", inset: 0,
            background: "rgba(16,185,129,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{
              color: "white", fontSize: 13, fontWeight: 800,
              textTransform: "uppercase", letterSpacing: "0.06em",
              textShadow: "0 1px 4px rgba(0,0,0,0.2)",
              textAlign: "center",
            }}>
              Bought
            </span>
          </div>
        )}
      </Link>

      {/* Info */}
      <div style={{ padding: "12px 12px 14px", display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>

        {owner && (
          <Link
            href={`/users/${owner.username}`}
            style={{ display: "flex", alignItems: "center", gap: 7, textDecoration: "none", marginBottom: 2 }}
          >
            <div style={{
              width: 22, height: 22, borderRadius: "50%",
              background: "#38A3C7", flexShrink: 0, overflow: "hidden",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "white", fontWeight: 700, fontSize: 9,
            }}>
              {owner.avatar_url
                ? <img src={staticAvatarUrl(owner.avatar_url)!} alt={ownerName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : ownerInitials}
            </div>
            <span style={{ fontSize: 11, color: "#64748B", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {ownerName}
            </span>
          </Link>
        )}

        <p style={{
          margin: 0, fontSize: 13, fontWeight: 600, color: "#0F172A",
          lineHeight: 1.35,
          display: "-webkit-box", WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {wish.title}
        </p>

        {wish.price != null && (
          <p style={{ margin: 0, fontSize: 12, color: "#64748B", fontWeight: 500 }}>
            {formatPrice(wish.price, wish.currency)}
          </p>
        )}

        {wishlistId && (
          <div style={{ marginTop: "auto", paddingTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
            <button
              type="button"
              onClick={handleBoughtToggle}
              disabled={isPending}
              style={{
                width: "100%",
                fontSize: 11, fontWeight: 700, padding: "7px 0",
                borderRadius: 8,
                border: "1.5px solid #10B981",
                background: isBought ? "#10B981" : "transparent",
                color: isBought ? "white" : "#10B981",
                cursor: isPending ? "wait" : "pointer", letterSpacing: "0.04em",
              }}
            >
              {isBought ? "✓ Bought" : "Mark as bought"}
            </button>

            {!isBought && (
              <button
                type="button"
                onClick={handleUnreserve}
                disabled={isPending}
                style={{
                  width: "100%",
                  fontSize: 11, fontWeight: 700, padding: "7px 0",
                  borderRadius: 8, border: "1.5px solid #EF4444",
                  background: "transparent", color: "#EF4444",
                  cursor: isPending ? "wait" : "pointer", letterSpacing: "0.04em",
                }}
              >
                Unreserve
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
