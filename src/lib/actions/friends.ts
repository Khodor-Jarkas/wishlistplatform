"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Profile } from "@/types"

export async function sendFriendRequest(addresseeId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  // Check for an existing friendship in either direction
  const { data: existing } = await supabase
    .from("friendships")
    .select("id, status")
    .or(
      `and(requester_id.eq.${user.id},addressee_id.eq.${addresseeId}),` +
      `and(requester_id.eq.${addresseeId},addressee_id.eq.${user.id})`
    )
    .maybeSingle()

  if (existing) {
    if (existing.status === "accepted") return { error: "Already friends" }
    if (existing.status === "pending")  return { error: "Request already pending" }
    // Re-send a previously declined request
    await supabase.from("friendships").delete().eq("id", existing.id)
  }

  const { error } = await supabase.from("friendships").insert({
    requester_id: user.id,
    addressee_id: addresseeId,
  })

  if (error) return { error: error.message }

  revalidatePath("/friends")
  revalidatePath(`/users`)
  return { success: true }
}

export async function acceptFriendRequest(friendshipId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const { data: friendship, error: fetchErr } = await supabase
    .from("friendships")
    .select("*")
    .eq("id", friendshipId)
    .eq("addressee_id", user.id)
    .eq("status", "pending")
    .single()

  if (fetchErr || !friendship) return { error: "Request not found" }

  const { error } = await supabase
    .from("friendships")
    .update({ status: "accepted" })
    .eq("id", friendshipId)

  if (error) return { error: error.message }

  // Fetch both profiles so we can store usernames in activity meta
  const [{ data: myProfile }, { data: theirProfile }] = await Promise.all([
    supabase.from("profiles").select("username, first_name, last_name").eq("id", user.id).single(),
    supabase.from("profiles").select("username, first_name, last_name").eq("id", friendship.requester_id).single(),
  ])

  const myName    = myProfile?.first_name    ? `${myProfile.first_name} ${myProfile.last_name ?? ""}`.trim()    : myProfile?.username    ?? "Someone"
  const theirName = theirProfile?.first_name ? `${theirProfile.first_name} ${theirProfile.last_name ?? ""}`.trim() : theirProfile?.username ?? "Someone"

  // Activity for both parties (meta stores the other person's name + username for linking)
  await supabase.from("activity").insert([
    {
      user_id:   user.id,
      type:      "friendship_started",
      target_id: friendship.requester_id,
      meta:      { friend_username: theirProfile?.username, friend_name: theirName },
    },
    {
      user_id:   friendship.requester_id,
      type:      "friendship_started",
      target_id: user.id,
      meta:      { friend_username: myProfile?.username, friend_name: myName },
    },
  ])

  // Mark the originating friend_request notification as read
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("type", "friend_request")
    .eq("actor_id", friendship.requester_id)

  revalidatePath("/friends")
  revalidatePath("/activity")
  return { success: true }
}

export async function declineFriendRequest(friendshipId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("id", friendshipId)
    .eq("addressee_id", user.id)

  if (error) return { error: error.message }

  // Mark the friend_request notification as read
  await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("type", "friend_request")

  revalidatePath("/friends")
  return { success: true }
}

export async function cancelFriendRequest(friendshipId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("id", friendshipId)
    .eq("requester_id", user.id)
    .eq("status", "pending")

  if (error) return { error: error.message }
  revalidatePath("/friends")
  return { success: true }
}

export async function removeFriend(friendshipId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated" }

  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("id", friendshipId)
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

  if (error) return { error: error.message }
  revalidatePath("/friends")
  revalidatePath("/activity")
  return { success: true }
}

export async function searchUsers(query: string): Promise<{ users: Profile[]; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { users: [], error: "Not authenticated" }

  const q = query.trim()
  if (q.length < 2) return { users: [] }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .neq("id", user.id)
    .or(
      `username.ilike.%${q}%,` +
      `full_name.ilike.%${q}%,` +
      `first_name.ilike.%${q}%,` +
      `last_name.ilike.%${q}%`
    )
    .limit(10)

  if (error) return { users: [], error: error.message }
  return { users: (data as Profile[]) ?? [] }
}
