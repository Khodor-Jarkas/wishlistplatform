import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import Container from "@/components/ui/Container"
import { formatPrice, getInitials } from "@/lib/utils"
import { unreserveWish, markAsBought, markAsUnbought } from "@/lib/actions/wishes"

export default async function ReservationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/")

  const { data: raw } = await supabase
    .from("reservations")
    .select(
      "id, status, reserved_at, " +
      "wish:wish_id(id, title, price, currency, image_url, url, is_reserved, " +
      "  wishlist:wishlist_id(id, title, user_id, " +
      "    profiles!user_id(username, first_name, last_name, avatar_url)" +
      "  )" +
      ")"
    )
    .eq("reserved_by", user.id)
    .order("reserved_at", { ascending: false })

  const reservations = (raw ?? []) as any[]

  // Split by status
  const active = reservations.filter(r => r.status !== "bought")
  const bought  = reservations.filter(r => r.status === "bought")

  // Group by wishlist helper
  function groupByWishlist(items: any[]) {
    const map: Record<string, { wishlistTitle: string; ownerName: string; wishlistId: string; items: any[] }> = {}
    for (const r of items) {
      const wish     = r.wish
      const wishlist = wish?.wishlist
      if (!wish || !wishlist) continue
      const wid = wishlist.id
      if (!map[wid]) {
        const owner = wishlist.profiles
        const ownerName = owner?.first_name
          ? `${owner.first_name} ${owner.last_name ?? ""}`.trim()
          : owner?.username ?? "Unknown"
        map[wid] = { wishlistTitle: wishlist.title, ownerName, wishlistId: wid, items: [] }
      }
      map[wid].items.push({ ...r, wish })
    }
    return Object.values(map)
  }

  const activeGroups = groupByWishlist(active)
  const boughtGroups = groupByWishlist(bought)

  return (
    <main style={{ minHeight: "100vh", background: "#F8FAFC", paddingBottom: 80 }}>
      <Container>
        <div style={{ paddingTop: 48, maxWidth: 900, margin: "0 auto" }}>

          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", margin: "0 0 6px" }}>
            My Reservations
          </h1>
          <p style={{ fontSize: 14, color: "#64748B", margin: "0 0 44px" }}>
            Wishes you've committed to buying. Only you can see these.
          </p>

          {reservations.length === 0 ? (
            <div style={{ textAlign: "center", padding: "80px 0", color: "#94A3B8" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎁</div>
              <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: "#475569" }}>No reservations yet</p>
              <p style={{ margin: "8px 0 0", fontSize: 13 }}>
                Browse a friend&apos;s wishlist and reserve a wish to help out!
              </p>
            </div>
          ) : (
            <>
              {/* ── Active reservations ── */}
              {activeGroups.map((group) => (
                <WishlistGroup key={group.wishlistId} group={group} status="reserved" />
              ))}

              {/* ── Bought section ── */}
              {boughtGroups.length > 0 && (
                <div style={{ marginTop: activeGroups.length > 0 ? 56 : 0 }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 10, marginBottom: 28,
                  }}>
                    <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: "#94A3B8",
                      textTransform: "uppercase", letterSpacing: "0.1em", whiteSpace: "nowrap",
                    }}>
                      Already bought
                    </span>
                    <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
                  </div>
                  {boughtGroups.map((group) => (
                    <WishlistGroup key={group.wishlistId} group={group} status="bought" />
                  ))}
                </div>
              )}
            </>
          )}

        </div>
      </Container>
    </main>
  )
}

// ── Wishlist group ────────────────────────────────────────────
function WishlistGroup({ group, status }: { group: any; status: "reserved" | "bought" }) {
  return (
    <section style={{ marginBottom: 48 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 20 }}>
        <Link
          href={`/wishlists/${group.wishlistId}`}
          style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", textDecoration: "none" }}
        >
          {group.wishlistTitle}
        </Link>
        <span style={{ fontSize: 13, color: "#94A3B8" }}>by {group.ownerName}</span>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: 16,
        opacity: status === "bought" ? 0.65 : 1,
      }}>
        {group.items.map((r: any) => (
          <ReservationCard key={r.id} reservation={r} />
        ))}
      </div>
    </section>
  )
}

// ── Reservation card ──────────────────────────────────────────
function ReservationCard({ reservation }: { reservation: any }) {
  const wish       = reservation.wish
  const wishlistId = wish?.wishlist?.id
  const owner      = wish?.wishlist?.profiles
  const ownerName  = owner?.first_name
    ? `${owner.first_name} ${owner.last_name ?? ""}`.trim()
    : owner?.username ?? "Unknown"
  const ownerInitials = owner ? getInitials(owner) : "?"
  const isBought   = reservation.status === "bought"

  return (
    <div style={{
      background: "white",
      borderRadius: 16,
      overflow: "hidden",
      border: isBought ? "1.5px solid #D1FAE5" : "1px solid #F1F5F9",
      boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
      display: "flex",
      flexDirection: "column",
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

        {/* Bought badge overlay */}
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

        {/* Owner row */}
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
                ? <img src={owner.avatar_url} alt={ownerName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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

        {/* Actions */}
        {wishlistId && (
          <div style={{ marginTop: "auto", paddingTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
            {/* Mark as bought / undo */}
            <form action={async () => {
              "use server"
              if (isBought) {
                await markAsUnbought(reservation.id, wishlistId)
              } else {
                await markAsBought(reservation.id, wishlistId)
              }
            }}>
              <button type="submit" style={{
                width: "100%",
                fontSize: 11, fontWeight: 700, padding: "7px 0",
                borderRadius: 8,
                border: isBought ? "1.5px solid #10B981" : "1.5px solid #10B981",
                background: isBought ? "#10B981" : "transparent",
                color: isBought ? "white" : "#10B981",
                cursor: "pointer", letterSpacing: "0.04em",
              }}>
                {isBought ? "✓ Bought" : "Mark as bought"}
              </button>
            </form>

            {/* Unreserve — only if not bought */}
            {!isBought && (
              <form action={async () => {
                "use server"
                await unreserveWish(wish.id, wishlistId)
              }}>
                <button type="submit" style={{
                  width: "100%",
                  fontSize: 11, fontWeight: 700, padding: "7px 0",
                  borderRadius: 8, border: "1.5px solid #EF4444",
                  background: "transparent", color: "#EF4444",
                  cursor: "pointer", letterSpacing: "0.04em",
                }}>
                  Unreserve
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
