"use client"

import { useEffect, useState, useTransition } from "react"
import { useAuthModal } from "@/context/AuthModalContext"
import { signUpWithEmail, signInWithEmail, setupProfile } from "@/lib/actions/auth"
import OAuthButtons from "./OAuthButtons"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import { useIsMobile } from "@/lib/hooks/useMediaQuery"

type Step = "method" | "email" | "profile" | "confirm"

// ── Months / Days / Years for DOB ───────────────────────────
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"]
  .map((m, i) => ({ label: m, value: String(i + 1).padStart(2, "0") }))
const DAYS  = Array.from({ length: 31 }, (_, i) => ({ label: String(i + 1), value: String(i + 1).padStart(2, "0") }))
const YEARS = Array.from({ length: 100 }, (_, i) => { const y = new Date().getFullYear() - i; return { label: String(y), value: String(y) } })
const GENDERS = [
  { label: "Male",              value: "male"              },
  { label: "Female",            value: "female"            },
  { label: "Non-binary",        value: "non_binary"        },
  { label: "Prefer not to say", value: "prefer_not_to_say" },
]

function EmailIcon({ dark = false }: { dark?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke={dark ? "#0F172A" : "white"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

// ── Main modal ───────────────────────────────────────────────
export default function AuthModal() {
  const { modal, openLogin, openSignup, close } = useAuthModal()
  const isMobile = useIsMobile()

  const [step, setStep]         = useState<Step>("method")
  const [signedUpEmail, setSignedUpEmail] = useState("")
  const [dobMonth, setDobMonth] = useState("")
  const [dobDay,   setDobDay]   = useState("")
  const [dobYear,  setDobYear]  = useState("")
  const [error, setError]       = useState("")
  const [isPending, start]      = useTransition()

  // profileSetup mode: opened after Google OAuth for new users
  const isProfileSetup = modal === "profileSetup"
  const isLogin        = modal === "login"

  // Reset on open
  useEffect(() => {
    if (modal) {
      setStep(isProfileSetup ? "profile" : "method")
      setError("")
      setSignedUpEmail("")
      setDobMonth(""); setDobDay(""); setDobYear("")
    }
  }, [modal]) // eslint-disable-line react-hooks/exhaustive-deps

  // Escape to close
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") close() }
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [close])

  if (!modal) return null

  // ── Email / password submit ────────────────────────────────
  function handleEmailSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    const fd   = new FormData(e.currentTarget)
    const mail = fd.get("email") as string
    start(async () => {
      try {
        if (isLogin) {
          const res = await signInWithEmail(fd)
          if (res?.error) { setError(res.error); return }
          if (res?.redirect) window.location.href = res.redirect
        } else {
          const res = await signUpWithEmail(fd)
          if (res?.error) { setError(res.error); return }
          if (res?.emailConfirmationRequired) {
            setSignedUpEmail(mail)
            setStep("confirm")
            return
          }
          setSignedUpEmail(mail)
          setStep("profile")
          setError("")
        }
      } catch {
        setError("Something went wrong. Please try again.")
      }
    })
  }

  // ── Profile submit ─────────────────────────────────────────
  function handleProfileSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    const fd = new FormData(e.currentTarget)
    if (dobMonth && dobDay && dobYear) fd.set("date_of_birth", `${dobYear}-${dobMonth}-${dobDay}`)
    start(async () => {
      try {
        const res = await setupProfile(fd)
        if (res?.error) { setError(res.error); return }
        if (res?.redirect) window.location.href = res.redirect
      } catch {
        setError("Something went wrong. Please try again.")
      }
    })
  }

  // ── Back logic ─────────────────────────────────────────────
  function handleBack() {
    if (isProfileSetup) { close(); return }        // after OAuth, back = close
    if (step === "email")   setStep("method")
    if (step === "profile") setStep("email")
    setError("")
  }

  // ── Titles ─────────────────────────────────────────────────
  const title = isProfileSetup
    ? "Set up your profile"
    : step === "confirm"
      ? "Check your inbox"
      : step === "profile"
        ? "Create Account"
        : isLogin ? "Log in" : "Create Account"

  const subtitle = isProfileSetup || step === "profile"
    ? ""
    : isLogin
      ? "Log in to continue exploring"
      : "If you want to continue exploring, please create an account"

  const showProgress = !isLogin && !isProfileSetup && step !== "confirm"

  return (
    <>
      {/* Backdrop */}
      <div onClick={close} style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(3px)",
        WebkitBackdropFilter: "blur(3px)",
      }} />

      {/* Card */}
      <div role="dialog" aria-modal="true" aria-label={title} style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 201, background: "white", borderRadius: 24,
        width: "calc(100% - 32px)", maxWidth: 480,
        padding: isMobile ? "20px 20px 28px" : "24px 28px 32px",
        boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
        maxHeight: "90vh", overflowY: "auto",
      }}>

        {/* Top bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          {step !== "method" || isProfileSetup ? (
            <button onClick={handleBack} style={iconBtn}>‹</button>
          ) : <div style={{ width: 36 }} />}

          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: "#38A3C7",
            display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
          }}>
            <img src="/surprise.png" width={40} height={40} alt="Wish It" style={{ objectFit: "contain" }} />
          </div>

          <button onClick={close} style={iconBtn}>✕</button>
        </div>

        {/* Step progress indicator — signup (not login, not profileSetup) */}
        {showProgress && (
          <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 4, borderRadius: 99, background: "#38A3C7", transition: "background 0.3s" }} />
            <div style={{
              flex: 1, height: 4, borderRadius: 99,
              background: step === "profile" ? "#38A3C7" : "#E2E8F0",
              transition: "background 0.3s",
            }} />
          </div>
        )}

        {/* Title + subtitle */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 600, margin: "0 0 6px", color: "#0F172A" }}>{title}</h2>
          {subtitle && <p style={{ fontSize: 13, color: "#94A3B8", margin: 0 }}>{subtitle}</p>}
          {step === "profile" && signedUpEmail && (
            <div style={{
              display: "inline-block", marginTop: 10,
              background: "#E0F4FA", color: "#2B82A0",
              borderRadius: 9999, padding: "5px 14px", fontSize: 13, fontWeight: 500,
            }}>
              {signedUpEmail}
            </div>
          )}
          {isProfileSetup && (
            <p style={{ fontSize: 13, color: "#94A3B8", margin: "6px 0 0" }}>
              Almost there! Tell us a little about yourself.
            </p>
          )}
        </div>

        {/* ── Step: Method selection ── */}
        {step === "method" && !isProfileSetup && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button onClick={() => { setStep("email"); setError("") }} style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
              width: "100%", padding: "15px 20px", borderRadius: 10, border: "none",
              background: isLogin ? "#0F172A" : "#38A3C7",
              color: "white", fontWeight: 700, fontSize: 13,
              letterSpacing: "0.07em", cursor: "pointer",
            }}>
              <EmailIcon dark={false} />
              CONTINUE WITH E-MAIL
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "2px 0" }}>
              <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
              <span style={{ fontSize: 12, color: "#94A3B8" }}>or</span>
              <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
            </div>

            <OAuthButtons
              mode={isLogin ? "login" : "signup"}
              usePopup
              onNewUser={() => setStep("profile")}
            />

            <p style={{ textAlign: "center", fontSize: 12, color: "#64748B", marginTop: 4 }}>
              {isLogin
                ? <> No account? <button onClick={openSignup} style={linkBtn}>Sign up</button> </>
                : <> Already have an account? <button onClick={openLogin} style={linkBtn}>Log in</button> </>}
            </p>

            {!isLogin && (
              <p style={{ fontSize: 11, color: "#94A3B8", textAlign: "center", lineHeight: 1.6, marginTop: 4 }}>
                By creating a profile, you accept our{" "}
                <span style={{ textDecoration: "underline", cursor: "pointer" }}>Terms</span>{" "}and{" "}
                <span style={{ textDecoration: "underline", cursor: "pointer" }}>Privacy Policy</span>.
              </p>
            )}
          </div>
        )}

        {/* ── Step: Email + password ── */}
        {step === "email" && (
          <form onSubmit={handleEmailSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Input label="Email"    name="email"    type="email"    placeholder="youremail@gmail.com" required autoFocus />
            <Input label="Password" name="password" type="password" placeholder="Min. 8 characters"   required />
            {error && <ErrorMsg>{error}</ErrorMsg>}
            <SubmitBtn isPending={isPending} dark={isLogin}>
              {isLogin ? "LOG IN" : "CONTINUE"}
            </SubmitBtn>
          </form>
        )}

        {/* ── Step: Email confirmation pending ── */}
        {step === "confirm" && (
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontSize: 48 }}>📬</div>
            <p style={{ fontSize: 14, color: "#334155", margin: 0, lineHeight: 1.6 }}>
              We sent a confirmation link to
            </p>
            {signedUpEmail && (
              <div style={{
                display: "inline-block",
                background: "#E0F4FA", color: "#2B82A0",
                borderRadius: 9999, padding: "5px 14px", fontSize: 13, fontWeight: 500,
              }}>
                {signedUpEmail}
              </div>
            )}
            <p style={{ fontSize: 13, color: "#64748B", margin: 0, lineHeight: 1.6 }}>
              Click the link in the email to activate your account, then log in.
            </p>
            <button
              onClick={() => { setStep("method"); setError("") }}
              style={{
                width: "100%", padding: "15px", borderRadius: 10, border: "none",
                background: "#0F172A", color: "white",
                fontWeight: 700, fontSize: 13, letterSpacing: "0.07em",
                cursor: "pointer",
              }}
            >
              GO TO LOG IN
            </button>
          </div>
        )}

        {/* ── Step: Profile setup (email signup OR post-OAuth) ── */}
        {(step === "profile" || isProfileSetup) && (
          <form onSubmit={handleProfileSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
              <Input label="First name" name="first_name" placeholder="First name" required autoFocus />
              <Input label="Last name"  name="last_name"  placeholder="Last name"  required />
            </div>

            <div>
              <label style={{ fontSize: 14, fontWeight: 500, color: "#334155", display: "block", marginBottom: 8 }}>
                Date of birth
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <Select options={MONTHS} placeholder="Month" value={dobMonth} onChange={(e) => setDobMonth(e.target.value)} />
                <Select options={DAYS}   placeholder="Day"   value={dobDay}   onChange={(e) => setDobDay(e.target.value)}   />
                <Select options={YEARS}  placeholder="Year"  value={dobYear}  onChange={(e) => setDobYear(e.target.value)}  />
              </div>
            </div>

            <Select label="Gender" name="gender" options={GENDERS} placeholder="Select gender" />

            {error && <ErrorMsg>{error}</ErrorMsg>}

            <SubmitBtn isPending={isPending} dark={false}>
              CREATE PROFILE
            </SubmitBtn>
          </form>
        )}

      </div>
    </>
  )
}

// ── Shared sub-components ────────────────────────────────────
function ErrorMsg({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: 12, color: "#EF4444",
      background: "#FEE2E2", borderRadius: 8,
      padding: "10px 14px", margin: 0, textAlign: "center",
    }}>
      {children}
    </p>
  )
}

function SubmitBtn({ isPending, dark, children }: { isPending: boolean; dark: boolean; children: React.ReactNode }) {
  return (
    <button type="submit" disabled={isPending} style={{
      width: "100%", padding: "15px", borderRadius: 10, border: "none",
      background: dark ? "#0F172A" : "#38A3C7",
      color: "white", fontWeight: 700, fontSize: 13,
      letterSpacing: "0.07em",
      cursor: isPending ? "not-allowed" : "pointer",
      opacity: isPending ? 0.7 : 1,
    }}>
      {isPending ? "Please wait…" : children}
    </button>
  )
}

const iconBtn: React.CSSProperties = {
  width: 36, height: 36, borderRadius: "50%",
  background: "#F1F5F9", border: "none",
  cursor: "pointer", fontSize: 16, color: "#334155",
  display: "flex", alignItems: "center", justifyContent: "center",
}

const linkBtn: React.CSSProperties = {
  background: "none", border: "none",
  color: "#38A3C7", fontWeight: 600,
  cursor: "pointer", fontSize: "inherit", padding: 0,
}
