import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

/**
 * Refreshes the Supabase auth session on every request.
 * Called from src/middleware.ts — do not call directly.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // Use SUPABASE_URL/SUPABASE_ANON_KEY (server-only, runtime) in the proxy so
  // Vercel's "Sensitive" flag doesn't strip them out during build-time inlining.
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) {
    console.error("[middleware] Missing Supabase URL/key env vars")
    return supabaseResponse
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
          // Apply cache-control headers added in @supabase/ssr 0.10.0
          if (headers) {
            Object.entries(headers).forEach(([key, val]) =>
              supabaseResponse.headers.set(key, val)
            )
          }
        },
      },
    }
  )

  // Refresh session — do not add logic between createServerClient and getUser.
  // Catch refresh_token_already_used: happens when concurrent requests all try
  // to exchange the same expired token simultaneously. The first one wins and
  // invalidates the token; the rest fail. Treat as unauthenticated for this
  // request — the client will re-auth on the next navigation.
  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    // silently treat as logged-out for this request
  }

  const { pathname } = request.nextUrl

  // Logged-in users hitting the marketing home page go straight to the dashboard.
  // Two exceptions:
  //  1. Server action requests (Next-Action header) — redirecting a POST causes
  //     "unexpected response" on the client.
  //  2. OAuth callback codes (?code=) — the popup may land here when Supabase
  //     ignores redirectTo. OAuthPopupHandler needs to run client-side to forward
  //     the code to /auth/popup-callback. Redirecting here swallows the code and
  //     the popup ends up stuck on /dashboard?code=... forever.
  const isServerAction  = request.headers.has("next-action")
  const isOAuthCallback = request.nextUrl.searchParams.has("code")
  if (user && pathname === "/" && !isServerAction && !isOAuthCallback) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    url.search = ""          // never carry query params into the dashboard redirect
    return NextResponse.redirect(url)
  }

  // Redirect unauthenticated users away from protected routes.
  // /wishlists/[id] is intentionally NOT protected — public/hidden wishlists
  // are accessible by anyone with the link. Visibility is enforced in the page.
  const isProtectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname === "/wishlists/new" ||
    pathname.startsWith("/profile")

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
