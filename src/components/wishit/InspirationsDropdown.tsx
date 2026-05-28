import Link from "next/link"

interface Props {
  onMouseEnter: () => void
  onMouseLeave: () => void
}

const ITEMS = [
  { label: "Trending Wishlists", href: "/inspire",          desc: "See what's popular" },
  { label: "AI Gift Finder",     href: "/inspire#ai-finder", desc: "Get personalised ideas" },
]

export default function InspirationsDropdown({ onMouseEnter, onMouseLeave }: Props) {
  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="wi-anim-dropdown"
      style={{
        position: "absolute",
        top: "calc(100% + 4px)",
        left: 0,
        background: "white",
        border: "1px solid #E2E8F0",
        borderRadius: 10,
        boxShadow: "0 4px 20px rgba(0,0,0,0.10)",
        minWidth: 210,
        padding: "6px 0",
        zIndex: 50,
      }}
    >
      {ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          style={{ display: "block", textDecoration: "none", padding: "10px 16px" }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "#F0F9FD")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
        >
          <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#0F172A" }}>
            {item.label}
          </span>
          <span style={{ display: "block", fontSize: 12, color: "#94A3B8", marginTop: 1 }}>
            {item.desc}
          </span>
        </Link>
      ))}
    </div>
  )
}
