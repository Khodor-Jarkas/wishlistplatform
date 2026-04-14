import Link from "next/link"

interface Props {
  children: React.ReactNode
  title: string
  backHref?: string
}

export default function AuthPageLayout({ children, title, backHref }: Props) {
  return (
    <div style={{ minHeight: "100vh", background: "white", display: "flex", flexDirection: "column" }}>

      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px" }}>
        {backHref ? (
          <Link href={backHref} style={{ color: "#334155", textDecoration: "none", fontSize: 20, lineHeight: 1 }}>
            ‹
          </Link>
        ) : <div />}

        <Link href="/" style={{ display: "flex", flexDirection: "column", alignItems: "center", textDecoration: "none" }}>
          <img src="/surprise.png" width={52} height={52} alt="Wish It" />
        </Link>

        <button
          style={{ background: "none", border: "1px solid #E2E8F0", borderRadius: 8, padding: "6px 12px", fontSize: 13, cursor: "pointer", color: "#334155" }}
        >
          🌐 ENG
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 24px 48px" }}>
        <h1 style={{ fontSize: 26, fontWeight: 600, marginBottom: 32, color: "#0F172A", textAlign: "center" }}>
          {title}
        </h1>
        <div style={{ width: "100%", maxWidth: 460 }}>
          {children}
        </div>
      </div>

    </div>
  )
}
