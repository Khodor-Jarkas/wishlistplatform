"use client"

import Link from "next/link"
import type { ReactNode } from "react"

interface Props {
  icon?: ReactNode
  title: string
  description?: ReactNode
  action?: {
    label: string
    onClick?: () => void
    href?: string
  }
  secondaryAction?: {
    label: string
    href: string
  }
  variant?: "card" | "dashed" | "bare"
  compact?: boolean
}

export default function EmptyState({
  icon = "🎁",
  title,
  description,
  action,
  secondaryAction,
  variant = "card",
  compact = false,
}: Props) {
  const padding = compact ? "40px 24px" : "64px 28px"

  const containerStyle: React.CSSProperties =
    variant === "dashed"
      ? {
          background: "white",
          borderRadius: 20,
          border: "2px dashed #E2E8F0",
          padding,
          textAlign: "center",
        }
      : variant === "card"
      ? {
          background: "white",
          borderRadius: 20,
          border: "1px solid #F1F5F9",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
          padding,
          textAlign: "center",
        }
      : {
          padding,
          textAlign: "center",
        }

  return (
    <div style={containerStyle}>
      <div style={{ fontSize: compact ? 40 : 52, marginBottom: compact ? 12 : 16, lineHeight: 1 }}>
        {icon}
      </div>
      <h3 style={{
        margin: "0 0 8px",
        fontSize: compact ? 15 : 17,
        fontWeight: 700,
        color: "#0F172A",
      }}>
        {title}
      </h3>
      {description && (
        <p style={{
          margin: "0 auto",
          maxWidth: 360,
          fontSize: compact ? 13 : 14,
          color: "#94A3B8",
          lineHeight: 1.6,
        }}>
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div style={{
          marginTop: compact ? 18 : 24,
          display: "flex",
          justifyContent: "center",
          gap: 10,
          flexWrap: "wrap",
        }}>
          {action && <ActionButton {...action} primary />}
          {secondaryAction && (
            <Link
              href={secondaryAction.href}
              style={{
                padding: "11px 22px", borderRadius: 10,
                background: "transparent",
                color: "#38A3C7", fontSize: 13, fontWeight: 700,
                border: "1.5px solid #38A3C7",
                textDecoration: "none",
                letterSpacing: "0.04em",
              }}
            >
              {secondaryAction.label}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

function ActionButton({
  label, onClick, href, primary,
}: { label: string; onClick?: () => void; href?: string; primary?: boolean }) {
  const style: React.CSSProperties = {
    padding: "12px 24px", borderRadius: 10,
    background: primary ? "#38A3C7" : "transparent",
    color: primary ? "white" : "#38A3C7",
    border: primary ? "none" : "1.5px solid #38A3C7",
    fontSize: 13, fontWeight: 700,
    letterSpacing: "0.04em",
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-block",
  }
  if (href) {
    return <Link href={href} style={style}>{label}</Link>
  }
  return <button type="button" onClick={onClick} style={style}>{label}</button>
}
