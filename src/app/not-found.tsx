import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: { index: false },
}

export default function NotFound() {
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
        <p style={{
          fontSize: 72,
          fontWeight: 800,
          color: "#E2E8F0",
          margin: "0 0 8px",
          lineHeight: 1,
        }}>
          404
        </p>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", margin: "0 0 10px" }}>
          Page not found
        </h1>
        <p style={{ fontSize: 14, color: "#64748B", margin: "0 0 28px", lineHeight: 1.6 }}>
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
        </p>
        <Link
          href="/"
          style={{
            display: "inline-block",
            padding: "12px 28px",
            background: "#38A3C7",
            color: "white",
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 13,
            textDecoration: "none",
            letterSpacing: "0.04em",
          }}
        >
          Go home
        </Link>
      </div>
    </main>
  )
}
