import Link from "next/link"

type Props = {
  children: React.ReactNode
  variant?: "primary" | "secondary"
  onClick?: () => void
  href?: string
  type?: "button" | "submit" | "reset"
  disabled?: boolean
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
  className = "",
  style,
}: Props) {
  const base =
    "inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold text-sm transition-colors cursor-pointer"

  const variants = {
    primary:
      "bg-brand text-white hover:bg-brand-dark",
    secondary:
      "border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-100",
  }

  const cls = `${base} ${variants[variant]} ${className}`

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
      disabled={disabled}
      className={cls}
      style={style}
    >
      {children}
    </button>
  )
}
