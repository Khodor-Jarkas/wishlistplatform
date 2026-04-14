"use client"

import { useAuthModal } from "@/context/AuthModalContext"
import Container from "../ui/Container"

export default function Hero() {
  const { openSignup } = useAuthModal()

  return (
    <section style={{ background: "#38A3C7", color: "white", padding: "120px 0" }}>
      <Container>

        <p style={{ marginBottom: 10, fontSize: 13, letterSpacing: "0.08em", opacity: 0.9 }}>
          GET STARTED WITH WISH IT
        </p>

        <h1 style={{ fontSize: 48, maxWidth: 500, marginBottom: 20, lineHeight: 1.15 }}>
          All your wishes in one place
        </h1>

        <p style={{ maxWidth: 420, marginBottom: 30, opacity: 0.9, lineHeight: 1.6 }}>
          Wish It makes it easy for you to save and share
          all your wishes with your friends and family :)
        </p>

        <button
          onClick={openSignup}
          style={{
            background: "black", color: "white",
            padding: "16px 28px", borderRadius: 10,
            fontWeight: 600, fontSize: 14,
            letterSpacing: "0.06em", border: "none", cursor: "pointer",
          }}
        >
          CREATE YOUR ACCOUNT
        </button>

        <p style={{ marginTop: 32, fontSize: 13, opacity: 0.8 }}>Get the app:</p>

      </Container>
    </section>
  )
}
