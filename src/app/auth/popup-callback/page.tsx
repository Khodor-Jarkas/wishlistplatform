"use client"

/**
 * Popup OAuth callback — exchanges the code, then signals the parent window.
 *
 * Two parallel communication paths:
 * ────────────────────────────────────────────────────────────────────────
 * 1. localStorage + storage event (same-origin):
 *    Works when parent and popup share the same origin (e.g. both localhost:3000).
 *    The popup writes OAUTH_RESULT_KEY; the storage event fires in the parent.
 *
 * 2. ping/pong postMessage (cross-origin):
 *    When accessed via a network IP the parent (172.x.x.x:3000) and popup
 *    (localhost:3000, Supabase's Site URL) are on different origins.
 *    localStorage is partitioned and COOP severs window.opener — but the parent
 *    holds a direct reference to the popup object and can call popup.postMessage().
 *    The popup responds via e.source.postMessage() with the session tokens so the
 *    parent can call supabase.auth.setSession() on its own origin.
 *
 * Race-condition resilience:
 * ──────────────────────────
 * @supabase/ssr hardcodes detectSessionInUrl:true in createBrowserClient.
 * If the popup lands on the home page first (/?code=...) the Supabase singleton
 * may auto-exchange the code before we redirect here. The getSession() fallback
 * handles that case.
 */

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

const OAUTH_RESULT_KEY  = "wish_it_oauth_result"
const POPUP_PENDING_KEY = "wish_it_popup_pending"

export default function PopupCallbackPage() {
  useEffect(() => {
    async function run() {
      const params = new URLSearchParams(window.location.search)
      const code   = params.get("code")

      if (!code) { done(false, true, null); return }

      const supabase = createClient()

      // Primary: exchange the code ourselves.
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (!error && data.user && data.session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name")
          .eq("id", data.user.id)
          .single()
        done(!profile?.first_name, false, data.session)
        return
      }

      // Fallback: detectSessionInUrl may have consumed the code first.
      const { data: { session } } = await supabase.auth.getSession()

      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name")
          .eq("id", session.user.id)
          .single()
        done(!profile?.first_name, false, session)
        return
      }

      done(false, true, null)
    }

    function done(
      isNewUser: boolean,
      failed: boolean,
      session: { access_token: string; refresh_token: string } | null,
    ) {
      // ── Path 1: localStorage (same-origin) ────────────────────────────
      localStorage.removeItem(POPUP_PENDING_KEY)
      localStorage.setItem(OAUTH_RESULT_KEY, JSON.stringify({
        type: failed ? "oauth_failed" : "oauth_complete",
        isNewUser,
      }))

      // ── Path 2: ping/pong postMessage (cross-origin) ──────────────────
      // The parent sends "wish_it_ping" via popup.postMessage(). We respond
      // with tokens so the parent can establish the session on its own origin.
      let pongSent = false
      function onPing(e: MessageEvent) {
        if (e.data?.type !== "wish_it_ping" || pongSent) return
        pongSent = true
        window.removeEventListener("message", onPing)
        ;(e.source as Window).postMessage(
          {
            type:          "wish_it_pong",
            failed,
            isNewUser,
            access_token:  session?.access_token,
            refresh_token: session?.refresh_token,
          },
          e.origin,
        )
        setTimeout(() => window.close(), 300)
      }
      window.addEventListener("message", onPing)

      // Grace period: close after 800 ms regardless.
      // By then the storage event will have fired (same-origin) or we've had
      // enough time to exchange a pong (cross-origin, parent pings every 300 ms).
      setTimeout(() => {
        window.removeEventListener("message", onPing)
        window.close()

        // Fallback navigation if window.close() was blocked.
        setTimeout(() => {
          localStorage.removeItem(OAUTH_RESULT_KEY)
          if (failed) { window.location.href = "/login?error=oauth_failed"; return }
          window.location.href = isNewUser ? "/signup/profile" : "/dashboard"
        }, 600)
      }, 800)
    }

    run()
  }, [])

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: "100vh", fontFamily: "system-ui, sans-serif", background: "white",
    }}>
      <p style={{ color: "#64748B", fontSize: 15, margin: 0 }}>Signing in…</p>
    </div>
  )
}
