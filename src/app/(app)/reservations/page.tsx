import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import Container from "@/components/ui/Container"
import { formatPrice } from "@/lib/utils"
import { unreserveWish } from "@/lib/actions/wishes"

export default async function ReservationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/")

  // Fetch all reservations made by this user, joined with wish + wishlist + owner
  const { data: raw } = await supabase
    .from("reservations")
    .select(
      "*, " +
      "wish:wish_id(id, title, price, currency, image_url, url, is_reserved, " +
      "  wishlist:wishlist_id(id, title, user_id, " +
      "    profiles!user_id(username, first_name, last_name)" +
      "  )" +
      ")"
    )
    .eq("reserved_by", user.id)
    .order("reserved_at", { ascending: false })

  const reservations = (raw ?? []) as any[]

  // Group by wishlist
  const byWishlist: Record<string, { wishlistTitle: string; ownerName: string; wishlistId: string; items: any[] }> = {}
  for (const r of reservations) {
    const wish     = r.wish
    const wishlist = wish?.wishlist
    if (!wish || !wishlist) continue
    const wid = wishlist.id
    if (!byWishlist[wid]) {
      const owner = wishlist.profiles
      const ownerName = owner?.first_name
        ? `${owner.first_name} ${owner.last_name ?? ""}`.trim()
        : owner?.username ?? "Unknown"
      byWishlist[wid] = { wishlistTitle: wishlist.title, ownerName, wishlistId: wid, items: [] }
    }
    byWishlist[wid].items.push({ ...r, wish })
  }

  const groups = Object.values(byWishlist)

  return (
    <main style={{ minHeight: "100vh", background: "#F8FAFC", paddingBottom: 60 }}>
      <Container>
        <div style={{ paddingTop: 48, maxWidth: 720, margin: "0 auto" }}>

          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0F172A", margin: "0 0 8px" }}>
            My Reservations
          </h1>
          <p style={{ fontSize: 14, color: "#64748B", margin: "0 0 40px" }}>
            Wishes you've committed to buying. Only you can see these.
          </p>

          {groups.length === 0 ? (
            <div style={{
              textAlign: "center", padding: "80px 0",
              color: "#94A3B8", fontSize: 15,
            }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎁</div>
              <p style={{ margin: 0, fontWeight: 500 }}>No reservations yet</p>
              <p style={{ margin: "8px 0 0", fontSize: 13 }}>
                Browse a friend's wishlist and reserve a wish to help out!
              </p>
            </div>
          ) : (
            groups.map((group) => (
              <section key={group.wishlistId} style={{ marginBottom: 40 }}>
                {/* Group header */}
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
                  <Link
                    href={`/wishlists/${group.wishlistId}`}
                    style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", textDecoration: "none" }}
                  >
                    {group.wishlistTitle}
                  </Link>
                  <span style={{ fontSize: 13, color: "#94A3B8" }}>by {group.ownerName}</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {group.items.map((r) => (
                    <ReservationRow key={r.id} reservation={r} />
                  ))}
                </div>
              </section>
            ))
          )}

        </div>
      </Container>
    </main>
  )
}

function ReservationRow({ reservation }: { reservation: any }) {
  const wish = reservation.wish
  const wishlistId = wish?.wishlist?.id

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14,
      background: "white", borderRadius: 12, padding: "12px 16px",
      border: "1px solid #F1F5F9",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    }}>
      {/* Thumbnail */}
      <div style={{
        width: 56, height: 56, borderRadius: 8, background: "#F1F5F9",
        flexShrink: 0, overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {wish.image_url
          ? <img src={wish.image_url} alt={wish.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <span style={{ fontSize: 24 }}>🎁</span>}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: "0 0 2px", fontSize: 14, fontWeight: 600, color: "#0F172A",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {wish.title}
        </p>
        {wish.price != null && (
          <p style={{ margin: 0, fontSize: 13, color: "#64748B" }}>
            {formatPrice(wish.price, wish.currency)}
          </p>
        )}
      </div>

      {/* Unreserve form */}
      {wishlistId && (
        <form
          action={async () => {
            "use server"
            await unreserveWish(wish.id, wishlistId)
          }}
        >
          <button
            type="submit"
            style={{
              fontSize: 12, fontWeight: 600, padding: "7px 14px",
              borderRadius: 8, border: "1.5px solid #EF4444",
              background: "transparent", color: "#EF4444",
              cursor: "pointer", letterSpacing: "0.03em",
            }}
          >
            Unreserve
          </button>
        </form>
      )}
    </div>
  )
}
