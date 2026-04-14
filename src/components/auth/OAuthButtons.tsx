"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuthModal } from "@/context/AuthModalContext"

type Provider = "google" | "facebook" | "apple"

interface Props {
  mode: "signup" | "login"
  usePopup?: boolean
  onNewUser?: () => void
}

// Keys shared with OAuthPopupHandler and popup-callback page.
const OAUTH_RESULT_KEY  = "wish_it_oauth_result"
const POPUP_PENDING_KEY = "wish_it_popup_pending"

const FacebookIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
)

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
)

const AppleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
  </svg>
)

const providers: {
  id: Provider
  label: string
  Icon: () => React.JSX.Element
  bg: string
  color: string
  border?: string
  popup?: boolean
}[] = [
  { id: "facebook", label: "CONTINUE WITH FACEBOOK", Icon: FacebookIcon, bg: "#1877F2", color: "white" },
  { id: "google",   label: "CONTINUE WITH GOOGLE",   Icon: GoogleIcon,   bg: "white",   color: "#334155", border: "1px solid #E2E8F0", popup: true },
  { id: "apple",    label: "CONTINUE WITH APPLE",    Icon: AppleIcon,    bg: "#000",    color: "white" },
]

export default function OAuthButtons({ mode, usePopup, onNewUser }: Props) {
  const { close: closeModal } = useAuthModal()
  const [error, setError]     = useState("")
  const [loading, setLoading] = useState<Provider | null>(null)

  async function handleOAuth(provider: Provider, supportsPopup?: boolean) {
    setError("")
    setLoading(provider)

    const supabase    = createClient()
    const shouldPopup = usePopup && supportsPopup

    const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        skipBrowserRedirect: !!shouldPopup,
        redirectTo: shouldPopup
          ? `${window.location.origin}/auth/popup-callback`
          : `${window.location.origin}/auth/callback`,
      },
    })

    if (oauthError || !data.url) {
      const msg = (oauthError?.message ?? "").toLowerCase()
      setError(
        msg.includes("not enabled") || msg.includes("unsupported")
          ? `${provider.charAt(0).toUpperCase() + provider.slice(1)} login is not configured yet. Use email instead.`
          : (oauthError?.message ?? "Could not start sign-in. Please try again.")
      )
      setLoading(null)
      return
    }

    if (shouldPopup) {
      // Mark that a popup flow is in progress (timestamp so it expires).
      // OAuthPopupHandler reads this to know whether a code on "/" came
      // from the popup and should be forwarded to /auth/popup-callback.
      localStorage.setItem(POPUP_PENDING_KEY, Date.now().toString())

      const popup = window.open(
        data.url,
        "oauth_popup",
        "width=520,height=620,scrollbars=yes,resizable=yes,left=200,top=80"
      )

      if (!popup) {
        // Popup blocked — fall back to server-side callback flow.
        localStorage.removeItem(POPUP_PENDING_KEY)
        document.cookie = "auth_from_modal=1; path=/; max-age=300; SameSite=Lax"
        const { data: fd } = await supabase.auth.signInWithOAuth({
          provider,
          options: { redirectTo: `${window.location.origin}/auth/callback` },
        })
        if (fd?.url) window.location.href = fd.url
        else setLoading(null)
        return
      }

      // Clears all listeners and the main interval.
      let mainInterval: ReturnType<typeof setInterval>
      function cleanup() {
        clearInterval(mainInterval)
        window.removeEventListener("storage", onStorage)
        window.removeEventListener("message", onMessage)
        localStorage.removeItem(OAUTH_RESULT_KEY)
        localStorage.removeItem(POPUP_PENDING_KEY)
      }

      // Closes the modal and navigates to the dashboard.
      function navigateToDashboard() {
        closeModal()
        window.location.href = "/dashboard"
      }

      // ── Path 1: storage event (same-origin) ───────────────────────────
      // Fires when popup-callback (same origin as this window) writes
      // OAUTH_RESULT_KEY. Does NOT fire in cross-origin scenarios.
      function onStorage(e: StorageEvent) {
        if (e.key !== OAUTH_RESULT_KEY || !e.newValue) return
        try {
          const result = JSON.parse(e.newValue) as { type: string; isNewUser?: boolean }
          if (!["oauth_complete", "oauth_failed"].includes(result.type)) return
          cleanup(); popup?.close(); setLoading(null)
          if (result.type === "oauth_failed") { setError("Sign-in failed. Please try again."); return }
          if (result.isNewUser) onNewUser?.()
          else navigateToDashboard()
        } catch { /* ignore malformed */ }
      }
      window.addEventListener("storage", onStorage)

      // ── Path 2: ping/pong postMessage (cross-origin) ──────────────────
      // When the parent is on a different origin than the popup (e.g. network
      // IP vs localhost), the storage event never fires. The main interval
      // below pings the popup every 300 ms; the popup responds with session
      // tokens so we can call setSession() on this origin.
      function onMessage(e: MessageEvent) {
        // Parent-side exchange: popup sent us the raw OAuth code because the
        // PKCE verifier lives here. Reset UI immediately (synchronously), then
        // exchange the code and navigate once it resolves.
        if (e.data?.type === "wish_it_code") {
          const { code } = e.data as { code: string }
          cleanup()         // stop interval + remove listeners now
          popup?.close()
          setLoading(null)  // unblock UI before any async work
          supabase.auth.exchangeCodeForSession(code)
            .then(({ data, error }) => {
              if (error || !data.session?.user) {
                setError("Sign-in failed. Please try again.")
                return
              }
              return supabase
                .from("profiles").select("first_name")
                .eq("id", data.session.user.id).single()
                .then(({ data: profile }) => {
                  if (!profile?.first_name) onNewUser?.()
                  else navigateToDashboard()
                })
            })
            .catch(() => setError("Sign-in failed. Please try again."))
          return
        }

        if (e.data?.type !== "wish_it_pong") return
        const { failed, isNewUser, access_token, refresh_token } = e.data as {
          failed: boolean; isNewUser: boolean
          access_token?: string; refresh_token?: string
        }
        cleanup()
        if (failed || !access_token || !refresh_token) {
          setError("Sign-in failed. Please try again.")
          setLoading(null)
          return
        }
        supabase.auth.setSession({ access_token, refresh_token })
          .then(() => {
            setLoading(null)
            if (isNewUser) onNewUser?.()
            else navigateToDashboard()
          })
          .catch(() => { setError("Sign-in failed. Please try again."); setLoading(null) })
      }
      window.addEventListener("message", onMessage)

      // ── Main interval: ping popup + detect close ──────────────────────
      // Sends a wish_it_ping to the popup on every tick (cross-origin signal).
      // Also detects when the user manually closes the popup.
      mainInterval = setInterval(() => {
        // popup.closed may throw when Google's COOP header severs the opener
        // reference while the user is on Google's auth page. Treat a throw as
        // "still open" and keep pinging — cleanup happens via onMessage.
        let isClosed = false
        try { isClosed = popup.closed } catch { isClosed = false }

        if (!isClosed) {
          try { popup.postMessage({ type: "wish_it_ping" }, "*") } catch { /* COOP — ignore */ }
          return
        }
        // Popup closed — check localStorage fallback (same-origin) then cancel.
        const stored = localStorage.getItem(OAUTH_RESULT_KEY)
        if (stored) {
          try {
            const result = JSON.parse(stored) as { type: string; isNewUser?: boolean }
            if (["oauth_complete", "oauth_failed"].includes(result.type)) {
              cleanup(); setLoading(null)
              if (result.type === "oauth_failed") { setError("Sign-in failed. Please try again."); return }
              if (result.isNewUser) onNewUser?.()
              else navigateToDashboard()
              return
            }
          } catch { /* ignore */ }
        }
        cleanup(); setLoading(null)
      }, 300)

      return
    }

    // Non-popup providers — standard full-page redirect.
    window.location.href = data.url
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {providers.map(({ id, label, Icon, bg, color, border, popup }) => (
        <button
          key={id}
          onClick={() => handleOAuth(id, popup)}
          disabled={loading !== null}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
            width: "100%", padding: "15px 24px", borderRadius: 10,
            border: border ?? "none", background: bg, color,
            fontWeight: 600, fontSize: 13, letterSpacing: "0.06em",
            cursor: loading !== null ? "wait" : "pointer",
            opacity: loading !== null && loading !== id ? 0.6 : 1,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            <Icon />
          </span>
          {loading === id ? "Please wait…" : label}
        </button>
      ))}

      {error && (
        <p style={{
          fontSize: 12, color: "#EF4444", textAlign: "center",
          background: "#FEE2E2", borderRadius: 8, padding: "10px 14px", margin: 0,
        }}>
          {error}
        </p>
      )}
    </div>
  )
}
