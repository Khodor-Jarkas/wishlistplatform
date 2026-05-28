import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * POST /api/cron/event-reminders
 *
 * Triggers the event-reminder notification job.
 * Secured by the CRON_SECRET env var — pass it as the
 * "x-cron-secret" request header.
 *
 * Call this daily at ~09:00 from any scheduler:
 *   curl -X POST https://your-domain/api/cron/event-reminders \
 *        -H "x-cron-secret: <CRON_SECRET>"
 *
 * If you're on Supabase Cloud with pg_cron enabled, the migration
 * already schedules this automatically — this route is the fallback
 * for self-hosted / Docker setups.
 */
function isAuthorized(req: Request): boolean {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return false
  // Vercel cron: Authorization: Bearer <CRON_SECRET>
  const bearer = req.headers.get("authorization")
  if (bearer === `Bearer ${cronSecret}`) return true
  // Manual / legacy: x-cron-secret header
  return req.headers.get("x-cron-secret") === cronSecret
}

async function runJob() {
  const supabase = createAdminClient()
  const { error } = await supabase.rpc("send_event_reminders")
  if (error) {
    console.error("[event-reminders cron]", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    return await runJob()
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("[event-reminders cron]", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    return await runJob()
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("[event-reminders cron]", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
