import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import FriendsClient from "@/components/friends/FriendsClient"

export default async function FriendsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/")

  // Fetch all friendships involving this user (any status)
  const { data: raw } = await supabase
    .from("friendships")
    .select(
      "*, " +
      "requester:requester_id(id, username, first_name, last_name, avatar_url), " +
      "addressee:addressee_id(id, username, first_name, last_name, avatar_url)"
    )
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
    .order("created_at", { ascending: false })

  const all              = (raw ?? []) as any[]
  const friends          = all.filter((f) => f.status === "accepted")
  const incomingRequests = all.filter((f) => f.status === "pending" && f.addressee_id === user.id)
  const outgoingRequests = all.filter((f) => f.status === "pending" && f.requester_id === user.id)

  return (
    <FriendsClient
      currentUserId={user.id}
      friends={friends}
      incomingRequests={incomingRequests}
      outgoingRequests={outgoingRequests}
    />
  )
}
