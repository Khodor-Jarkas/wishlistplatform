import Link from "next/link"

type Props = {
  children: React.ReactNode
  variant?: "primary" | "secondary" | "ghost" | "danger"
  onClick?: () => void
  href?: string
  type?: "button" | "submit" | "reset"
  disabled?: boolean
  loading?: boolean
  className?: string
  style?: React.CSSProperties
}

export default function Button({
  children,
  variant = "primary",
  onClick,
  href,
  type = "button",
  disabled,
  loading,
  className = "",
  style,
}: Props) {
  const base =
    "inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold text-sm transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"

  const variants = {
    primary:   "bg-brand text-white hover:bg-brand-dark",
    secondary: "border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-100",
    ghost:     "bg-transparent text-neutral-700 hover:bg-neutral-100",
    danger:    "bg-danger text-white hover:bg-red-600",
  }

  const cls = `${base} ${variants[variant]} ${className}`
  const isDisabled = disabled || loading

  if (href) {
    return (
      <Link href={href} className={cls} style={style}>
        {children}
      </Link>
    )
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={cls}
      style={style}
    >
      {loading ? (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ animation: "spin 0.7s linear infinite" }}>
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
            <path d="M7 1.5a5.5 5.5 0 015.5 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {children}
        </span>
      ) : children}
    </button>
  )
}
