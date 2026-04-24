import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import ProfileSettingsClient from "@/components/auth/ProfileSettingsClient"
import { getCreatorEligibility } from "@/lib/actions/creators"

export const metadata = { title: "Profile Settings" }

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [{ data: profile }, eligibilityRaw] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    getCreatorEligibility(),
  ])

  const creatorEligibility = "error" in eligibilityRaw ? null : eligibilityRaw

  return (
    <ProfileSettingsClient
      profile={profile}
      email={user.email ?? ""}
      creatorEligibility={creatorEligibility}
    />
  )
}
