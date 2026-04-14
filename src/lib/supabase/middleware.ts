import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

/**
 * Refreshes the Supabase auth session on every request.
 * Called from src/middleware.ts — do not call directly.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
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
