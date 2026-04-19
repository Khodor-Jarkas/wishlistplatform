"use client"

import { useEffect, useRef } from "react"

interface Props {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  width?: number
}

export default function Drawer({ open, onClose, children, title, width = 380 }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  // Escape key
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  return (
    <>
      {/* Backdrop — opacity-only, no blur */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 300,
          background: "rgba(15,23,42,0.45)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 0.22s ease",
          // Force own compositor layer so it doesn't repaint with the panel
          willChange: "opacity",
          transform: "translateZ(0)",
        }}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0,
          width: `min(${width}px, 100vw)`,
          zIndex: 301,
          background: "white",
          boxShadow: open ? "-4px 0 32px rgba(0,0,0,0.12)" : "none",
          display: "flex", flexDirection: "column",
          // translateX drives the slide — GPU composited, no layout cost
          transform: open ? "translate3d(0,0,0)" : "translate3d(100%,0,0)",
          transition: open
            ? "transform 0.28s cubic-bezier(0.25, 1, 0.5, 1)"
            : "transform 0.22s cubic-bezier(0.4, 0, 1, 1)",
          willChange: "transform",
        }}
      >
        {/* Header */}
        {title && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "18px 20px",
            borderBottom: "1px solid #F1F5F9",
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>{title}</span>
            <button
              onClick={onClose}
              style={{
                width: 30, height: 30, borderRadius: 8,
                background: "#F1F5F9", border: "none",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                color: "#64748B", fontSize: 18, lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {children}
        </div>
      </div>
    </>
  )
}
