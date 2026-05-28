// Proactively refresh the Supabase session before it expires so the popup
// never opens to a stale token. The alarm fires every 50 minutes; Supabase
// access tokens last 60 minutes, so this keeps plenty of headroom.

const SUPABASE_URL = "https://xkluvitzmftxhlmefckr.supabase.co"
const ANON_KEY     = "sb_publishable_KkOmSUSOUhnONxf1Vy6I_w_P5Hmv2Ys"

chrome.alarms.create("refresh", { periodInMinutes: 50 })

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== "refresh") return
  const { session } = await chrome.storage.local.get("session")
  if (!session?.refresh_token) return

  try {
    const res = await fetch(
      `${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,
      {
        method:  "POST",
        headers: { "apikey": ANON_KEY, "Content-Type": "application/json" },
        body:    JSON.stringify({ refresh_token: session.refresh_token }),
      }
    )
    if (!res.ok) { await chrome.storage.local.remove("session"); return }
    const data = await res.json()
    await chrome.storage.local.set({
      session: {
        access_token:  data.access_token,
        refresh_token: data.refresh_token,
        expires_at:    data.expires_at,
        user:          data.user,
      },
    })
  } catch {
    // Network error — try again next alarm tick
  }
})
