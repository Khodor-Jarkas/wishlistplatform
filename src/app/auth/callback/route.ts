import { createClient } from "@/lib/supabase/server"
import { NextResponse, type NextRequest } from "next/server"

/**
 * Server-side OAuth callback.
 * Used by: Facebook, Apple, and the popup-blocked fallback from the modal.
 * Google popup flow uses /auth/popup-callback (client-side) instead.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name")
        .eq("id", data.user.id)
        .single()

      const isNewUser = !profile?.first_name

      if (isNewUser) {
        // If triggered from the modal (popup was blocked), redirect to /?setup=1
        // so OAuthPopupHandler opens the profile step in the AuthModal.
        // Otherwise use the standalone /signup/profile page.
        const fromModal = request.cookies.get("auth_from_modal")?.value === "1"
        const destination = fromModal ? `${origin}/?setup=1` : `${origin}/signup/profile`
        const response = NextResponse.redirect(destination)
        response.cookies.set("auth_from_modal", "", { path: "/", maxAge: 0 })
        return response
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
}
