"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { signInWithEmail } from "@/lib/actions/auth"
import AuthPageLayout from "@/components/auth/AuthPageLayout"
import OAuthButtons from "@/components/auth/OAuthButtons"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"

export default function LoginPage() {
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    const form = e.currentTarget
    startTransition(async () => {
      const result = await signInWithEmail(new FormData(form))
      if (result?.error) { setError(result.error); return }
      // Full reload so the server-rendered Header re-fetches the session.
      // router.push wouldn't bust the layout cache and the UI would still
      // show "logged out" until a manual refresh.
      if (result?.redirect) window.location.href = result.redirect
    })
  }

  return (
    <AuthPageLayout title="Log In" backHref="/">
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <Input label="Email"    name="email"    type="email"    placeholder="youremail@gmail.com" required />
        <Input label="Password" name="password" type="password" placeholder="Your password"       required />

        {error && <p style={{ color: "#EF4444", fontSize: 13, textAlign: "center" }}>{error}</p>}

        <Button type="submit" disabled={isPending}>
          {isPending ? "Logging in…" : "LOG IN"}
        </Button>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
          <span style={{ fontSize: 13, color: "#94A3B8" }}>or</span>
          <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
        </div>

        <OAuthButtons mode="login" />

        <p style={{ textAlign: "center", fontSize: 13, color: "#64748B", marginTop: 4 }}>
          Don&apos;t have an account?{" "}
          <Link href="/signup" style={{ color: "#38A3C7", fontWeight: 500 }}>Sign up</Link>
        </p>
      </form>
    </AuthPageLayout>
  )
}
