"use client"

import { useEffect } from "react"

interface Props {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  maxWidth?: number
}

export default function Modal({ open, onClose, title, children, maxWidth = 480 }: Props) {
  // Close on Escape key
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: 16,
          width: "100%",
          maxWidth,
          padding: 32,
          position: "relative",
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 20,
            color: "#64748B",
            lineHeight: 1,
          }}
        >
          ✕
        </button>

        {title && (
          <h2 style={{ margin: "0 0 24px", fontSize: 20, fontWeight: 600, textAlign: "center" }}>
            {title}
          </h2>
        )}

        {children}
      </div>
    </div>
  )
}
