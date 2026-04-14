import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import AppHeaderClient from "./AppHeaderClient"

export default async function AppHeader() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  return (
    <AppHeaderClient
      profile={profile ?? { id: user.id, username: user.email ?? "" }}
      email={user.email ?? ""}
    />
  )
}
