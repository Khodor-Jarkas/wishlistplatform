"use client"

import { useTransition } from "react"
import { deleteWishlist } from "@/lib/actions/wishlists"

interface Props {
  wishlistId: string
  title: string
  onClose: () => void
}

export default function DeleteConfirmModal({ wishlistId, title, onClose }: Props) {
  const [isPending, start] = useTransition()

  function handleDelete() {
    const fd = new FormData()
    fd.set("id", wishlistId)
    start(async () => {
      await deleteWishlist(fd)
    })
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 300,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(3px)",
        }}
      />
      {/* Dialog */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          zIndex: 301,
          background: "white",
          borderRadius: 16,
          padding: "28px 28px 24px",
          width: "calc(100% - 32px)",
          maxWidth: 400,
          boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 12, textAlign: "center" }}>🗑</div>
        <h3
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "#0F172A",
            marginBottom: 10,
            textAlign: "center",
          }}
        >
          Delete wishlist?
        </h3>
        <p style={{ fontSize: 14, color: "#64748B", marginBottom: 24, textAlign: "center", lineHeight: 1.5 }}>
          <strong style={{ color: "#0F172A" }}>&ldquo;{title}&rdquo;</strong> and all its wishes will
          be permanently deleted. This cannot be undone.
        </p>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            disabled={isPending}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: 10,
              border: "1px solid #E2E8F0",
              background: "white",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              color: "#334155",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isPending}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: 10,
              border: "none",
              background: "#EF4444",
              color: "white",
              fontWeight: 700,
              fontSize: 13,
              cursor: isPending ? "not-allowed" : "pointer",
              opacity: isPending ? 0.7 : 1,
            }}
          >
            {isPending ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </>
  )
}
