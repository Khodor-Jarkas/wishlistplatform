"use client"

/**
 * Handles two post-OAuth situations that land back on a page with ?code=:
 *
 * 1. Popup landed on "/" instead of /auth/popup-callback
 *    Supabase ignores redirectTo when the URL isn't whitelisted (common when
 *    accessing via a network IP). The PKCE code verifier lives on the parent's
 *    origin, not the popup's, so the popup can't exchange the code itself.
 *    Instead, we wait for the parent's next ping (arrives within ~300 ms),
 *    then send the code back via wish_it_code so the parent can exchange it.
 *
 * 2. ?setup=1 query param (popup-blocked fallback)
 *    /auth/callback sets this when a new user came through the modal with the
 *    popup blocked. Open the profile-setup step in the AuthModal.
 */

import { useEffect } from "react"
import { useAuthModal } from "@/context/AuthModalContext"

export default function OAuthPopupHandler() {
  const { openProfileSetup } = useAuthModal()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code   = params.get("code")
    const setup  = params.get("setup")

    // ── Case 1: popup landed here instead of /auth/popup-callback ──────
    if (code && window.location.pathname !== "/auth/popup-callback") {
      function onPing(e: MessageEvent) {
        if (e.data?.type !== "wish_it_ping") return
        window.removeEventListener("message", onPing)
        // Send the raw code to the parent — parent has the PKCE verifier and
        // will call exchangeCodeForSession() on its own origin.
        ;(e.source as Window)?.postMessage({ type: "wish_it_code", code }, "*")
        setTimeout(() => window.close(), 300)
      }
      window.addEventListener("message", onPing)
      // Fallback: no ping in 2 s → try the dedicated callback page directly.
      setTimeout(() => {
        window.removeEventListener("message", onPing)
        window.location.replace(`/auth/popup-callback?code=${encodeURIComponent(code)}`)
      }, 2000)
      return
    }

    // ── Case 2: post-OAuth new-user setup (popup-blocked fallback) ──────
    if (setup !== "1") return
    params.delete("setup")
    const rest = params.toString()
    history.replaceState(null, "", window.location.pathname + (rest ? "?" + rest : ""))
    openProfileSetup()
  }, [openProfileSetup])

  return null
}
