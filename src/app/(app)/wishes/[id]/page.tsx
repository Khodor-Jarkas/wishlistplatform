import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import type { Metadata } from "next"
import WishDetailClient from "@/components/wishes/WishDetailClient"

interface Props {
  params: Promise<{ id: string }>
}

async function fetchWish(id: string) {
  const supabase = await createClient()
  const [{ data: { user } }, wishRes] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("wishes")
      .select(
        "*, " +
        "reservations(id, reserved_by, status), " +
        "wishlist:wishlist_id(id, title, user_id, visibility, " +
        "  profiles!user_id(username, first_name, last_name, full_name, avatar_url)" +
        ")"
      )
      .eq("id", id)
      .single(),
  ])
  return { user, raw: wishRes.data as any, error: wishRes.error }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const { raw } = await fetchWish(id)
  if (!raw || raw.wishlist?.visibility === "private") {
    return { title: "Wish", robots: { index: false } }
  }
  const description = raw.description ?? `Check out "${raw.title}" on Wish It`
  return {
    title: raw.title,
    description,
    openGraph: { title: raw.title, description, type: "website" },
  }
}

export default async function WishDetailPage({ params }: Props) {
  const { id } = await params
  const { user, raw, error } = await fetchWish(id)

  if (error?.code === "PGRST116" || !raw) notFound()
  if (error) throw new Error(`Failed to load wish: ${error.message}`)
  if (!raw.wishlist) notFound()

  const isOwner = user?.id === raw.wishlist.user_id

  // Visibility enforcement — private wishlists are owner-only
  if (raw.wishlist.visibility === "private" && !isOwner) redirect("/")

  const reservationsRaw = raw.reservations
  const reservations: { id: string; reserved_by: string; status?: string }[] = Array.isArray(reservationsRaw)
    ? reservationsRaw
    : reservationsRaw
      ? [reservationsRaw]
      : []
  const myReservation = user ? reservations.find((r) => r.reserved_by === user.id) : null

  return (
    <WishDetailClient
      wish={{
        id:           raw.id,
        wishlist_id:  raw.wishlist_id,
        title:        raw.title,
        description:  raw.description ?? null,
        price:        raw.price ?? null,
        currency:     raw.currency ?? "USD",
        url:          raw.url ?? null,
        image_url:    raw.image_url ?? null,
        priority:     raw.priority ?? 0,
        quantity:     raw.quantity ?? 1,
        is_reserved:  raw.is_reserved ?? false,
        is_received:  raw.is_received ?? false,
        created_at:   raw.created_at,
        updated_at:   raw.updated_at,
      }}
      wishlist={{
        id:    raw.wishlist.id,
        title: raw.wishlist.title,
      }}
      owner={raw.wishlist.profiles}
      isOwner={isOwner}
      currentUserId={user?.id ?? null}
      myReservationId={myReservation?.id ?? null}
      myReservationStatus={(myReservation?.status as "reserved" | "bought" | undefined) ?? null}
    />
  )
}
