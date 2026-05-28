"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <main style={{
      minHeight: "100vh",
      background: "#F8FAFC",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 20px",
    }}>
      <div style={{ textAlign: "center", maxWidth: 400 }}>
        <p style={{ fontSize: 52, margin: "0 0 16px", lineHeight: 1 }}>⚠️</p>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", margin: "0 0 10px" }}>
          Something went wrong
        </h1>
        <p style={{ fontSize: 14, color: "#64748B", margin: "0 0 28px", lineHeight: 1.6 }}>
          An unexpected error occurred. Try refreshing — if the problem persists, come back later.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={reset}
            style={{
              padding: "12px 24px",
              background: "#38A3C7",
              color: "white",
              border: "none",
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              letterSpacing: "0.04em",
            }}
          >
            Try again
          </button>
          <a
            href="/"
            style={{
              padding: "12px 24px",
              background: "transparent",
              color: "#38A3C7",
              border: "1.5px solid #38A3C7",
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 13,
              textDecoration: "none",
              letterSpacing: "0.04em",
            }}
          >
            Go home
          </a>
        </div>
      </div>
    </main>
  )
}
