import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import ReservationsClient from "@/components/reservations/ReservationsClient"

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

  return <ReservationsClient reservations={(raw ?? []) as any[]} />
}
