import { createClient } from "@/lib/supabase/server"
import AppHeaderClient from "./AppHeaderClient"
import AppHeaderGuest from "./AppHeaderGuest"

export default async function AppHeader() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <AppHeaderGuest />

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, first_name, last_name, full_name, avatar_url, bio, country, is_private, is_creator, language, created_at, updated_at")
    .eq("id", user.id)
    .single()

  return (
    <AppHeaderClient
      profile={profile ?? {
        id: user.id,
        username: user.email ?? "",
        first_name: null, last_name: null, full_name: null,
        avatar_url: null, bio: null, country: null,
        is_private: false, is_creator: false, language: "en",
        created_at: "", updated_at: "",
      }}
      email={user.email ?? ""}
    />
  )
}
