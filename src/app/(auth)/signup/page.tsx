"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signUpWithEmail } from "@/lib/actions/auth"
import AuthPageLayout from "@/components/auth/AuthPageLayout"
import OAuthButtons from "@/components/auth/OAuthButtons"
import Input from "@/components/ui/Input"
import Button from "@/components/ui/Button"
import EmailIcon from "@/components/icons/EmailIcon"

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<"method" | "email">("method")
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleEmailSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    const form = e.currentTarget
    startTransition(async () => {
      const result = await signUpWithEmail(new FormData(form))
      if (result?.error) { setError(result.error); return }
      router.push("/signup/profile")
    })
  }

  return (
    <AuthPageLayout title="Create Account" backHref={step === "email" ? undefined : "/"}>
      {step === "method" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Email */}
          <button
            onClick={() => setStep("email")}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
              width: "100%", padding: "15px 24px", borderRadius: 10, border: "none",
              background: "#38A3C7", color: "white", fontWeight: 600, fontSize: 13,
              letterSpacing: "0.06em", cursor: "pointer",
            }}
          >
            <EmailIcon />
            CONTINUE WITH EMAIL
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0" }}>
            <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
            <span style={{ fontSize: 13, color: "#94A3B8" }}>or</span>
            <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
          </div>

          <OAuthButtons mode="signup" />

          <p style={{ textAlign: "center", fontSize: 13, color: "#64748B", marginTop: 8 }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "#38A3C7", fontWeight: 500 }}>Log in</Link>
          </p>
        </div>
      ) : (
        <form onSubmit={handleEmailSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <button
            type="button"
            onClick={() => setStep("method")}
            style={{ alignSelf: "flex-start", background: "none", border: "none", color: "#38A3C7", fontSize: 13, cursor: "pointer", padding: 0 }}
          >
            ‹ Back
          </button>

          <Input label="Email"    name="email"    type="email"    placeholder="youremail@gmail.com"  required />
          <Input label="Password" name="password" type="password" placeholder="Min. 8 characters"    required />

          {error && <p style={{ color: "#EF4444", fontSize: 13, textAlign: "center" }}>{error}</p>}

          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating account…" : "CONTINUE"}
          </Button>
        </form>
      )}
    </AuthPageLayout>
  )
}
