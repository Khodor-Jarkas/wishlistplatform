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
