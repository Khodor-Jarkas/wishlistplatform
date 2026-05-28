import { createBrowserClient } from "@supabase/ssr"

/**
 * Browser (client-side) Supabase client.
 * Use this in Client Components ("use client").
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Disabled because we exchange the OAuth code manually in
        // /auth/popup-callback and /auth/callback. Leaving this enabled
        // causes a race: the popup lands on /?code= first, Supabase starts
        // auto-exchanging in the background, then OAuthPopupHandler redirects
        // to /auth/popup-callback — where the code is already consumed but the
        // session hasn't been stored yet, causing "Sign-in failed".
        detectSessionInUrl: false,
      },
    }
  )
}

/**
 * Races a Supabase/PostgREST query against a hard client-side timeout.
 * If the DB never responds (connection hang, lock wait, etc.) the UI
 * still transitions out of its loading state after `ms` milliseconds.
 * The no-op rejection handler on `req` prevents an unhandled-rejection
 * warning if the underlying request fails after the timeout already fired.
 */
export function withQueryTimeout<T>(
  query: Promise<T> | PromiseLike<T>,
  ms = 12_000,
): Promise<T> {
  const req = Promise.resolve(query)
  req.then(undefined, () => undefined) // silence post-timeout errors
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Query timed out")), ms),
  )
  return Promise.race([req, timeout])
}
