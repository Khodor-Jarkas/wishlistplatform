"use client"

import { useEffect, useState, useTransition } from "react"
import { createClient } from "@/lib/supabase/client"
import { updateWish } from "@/lib/actions/wishes"
import { useIsMobile } from "@/lib/hooks/useMediaQuery"
import { compressImage, withUploadTimeout } from "@/lib/utils/image"
import { CURRENCIES } from "@/lib/currencies"
import type { Wish } from "@/types"

interface Props {
  wish: Wish
  wishlistId: string
  onClose: () => void
}

export default function EditWishModal({ wish, wishlistId, onClose }: Props) {
  const isMobile = useIsMobile()
  const [isMostWanted, setIsMostWanted] = useState(wish.priority === 2)
  const [currency, setCurrency]         = useState(wish.currency || "USD")
  const [quantity, setQuantity]         = useState(wish.quantity ?? 1)
  const [imageUrl, setImageUrl]         = useState(wish.image_url ?? "")
  const [imagePreview, setImagePreview] = useState(wish.image_url ?? "")
  const [uploading, setUploading]       = useState(false)
  const [error, setError]               = useState("")
  const [isPending, start]              = useTransition()

  useEffect(() => {
    return () => { if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview) }
  }, [imagePreview])

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError("")
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError("Please log in again."); return }
      const { blob, contentType, ext } = await compressImage(file)
      const path = `${user.id}/wish-${Date.now()}.${ext}`
      const { error: uploadError } = await withUploadTimeout(
        supabase.storage.from("wishlist-covers").upload(path, blob, { upsert: true, contentType })
      )
      if (uploadError) { setError("Upload failed: " + uploadError.message); return }
      const { data: { publicUrl } } = supabase.storage.from("wishlist-covers").getPublicUrl(path)
      setImageUrl(publicUrl)
      setImagePreview(URL.createObjectURL(blob))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.")
      console.error("[EditWishModal] image upload failed", err)
    } finally {
      setUploading(false)
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    const fd = new FormData(e.currentTarget)

    // Skip the round-trip if nothing actually changed (mistapped Save).
    const formTitle       = ((fd.get("title")       as string) ?? "").trim()
    const formDescription = ((fd.get("description") as string) ?? "").trim()
    const formPrice       = ((fd.get("price")       as string) ?? "").trim()
    const formUrl         = ((fd.get("url")         as string) ?? "").trim()

    const unchanged =
      formTitle       === (wish.title       ?? "") &&
      formDescription === (wish.description ?? "") &&
      formPrice       === (wish.price != null ? String(wish.price) : "") &&
      formUrl         === (wish.url         ?? "") &&
      currency        === (wish.currency || "USD") &&
      quantity        === (wish.quantity    ?? 1) &&
      imageUrl        === (wish.image_url   ?? "") &&
      isMostWanted    === (wish.priority === 2)

    if (unchanged) { onClose(); return }

    fd.set("wish_id", wish.id)
    fd.set("wishlist_id", wishlistId)
    fd.set("is_most_wanted", String(isMostWanted))
    fd.set("currency", currency)
    fd.set("quantity", String(quantity))
    if (imageUrl) fd.set("image_url", imageUrl)
    start(async () => {
      const res = await updateWish(fd)
      if (res?.error) { setError(res.error); return }
      onClose()
    })
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="wi-anim-fade"
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
          zIndex: 500, backdropFilter: "blur(2px)",
        }}
      />

      {/* Modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="wi-anim-modal-centered"
        style={{
          position: "fixed", top: "50%", left: "50%",
          zIndex: 501, background: "white", borderRadius: 16,
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          width: "min(860px, 95vw)",
          maxHeight: "90vh", overflowY: "auto",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px 0",
        }}>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#64748B" }}
          >
            ‹
          </button>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#0F172A" }}>Edit Wish</h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#64748B" }}
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: isMobile ? "20px 20px 24px" : "20px 24px 28px" }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 18 : 28 }}>

            {/* Left column */}
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

              {/* Name wish */}
              <div>
                <label style={labelStyle}>Name wish</label>
                <input
                  name="title"
                  required
                  defaultValue={wish.title}
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#38A3C7")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#E2E8F0")}
                />
              </div>

              {/* Most Wanted */}
              <div style={{
                background: "#F8FAFC", borderRadius: 10, padding: "14px 16px",
                display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12,
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", marginBottom: 4 }}>
                    Most Wanted <span style={{ color: "#38A3C7" }}>★</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.5 }}>
                    Most wanted gifts are marked <span style={{ color: "#F59E0B" }}>to let your friends</span> know which gifts you love the most
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMostWanted((v) => !v)}
                  style={{
                    flexShrink: 0, width: 44, height: 24, borderRadius: 12,
                    background: isMostWanted ? "#38A3C7" : "#CBD5E1",
                    border: "none", cursor: "pointer", position: "relative",
                    transition: "background 0.2s",
                  }}
                >
                  <span style={{
                    position: "absolute", top: 2,
                    left: isMostWanted ? 22 : 2,
                    width: 20, height: 20, borderRadius: "50%",
                    background: "white", transition: "left 0.2s",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  }} />
                </button>
              </div>

              {/* Description */}
              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  name="description"
                  defaultValue={wish.description ?? ""}
                  placeholder="Enter a description"
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#38A3C7")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#E2E8F0")}
                />
              </div>

              {/* Price + Quantity */}
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Price</label>
                  <div style={{ display: "flex", border: "1px solid #E2E8F0", borderRadius: 8, overflow: "hidden" }}>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      style={{ border: "none", background: "#F8FAFC", fontSize: 13, padding: "10px 8px", outline: "none", color: "#334155" }}
                    >
                      {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      defaultValue={wish.price ?? ""}
                      placeholder="0"
                      style={{ flex: 1, border: "none", outline: "none", padding: "10px 8px", fontSize: 14, color: "#0F172A", width: 0 }}
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Quantity</label>
                  <div style={{ display: "flex", alignItems: "center", border: "1px solid #E2E8F0", borderRadius: 8, overflow: "hidden" }}>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      style={{ border: "none", background: "#F8FAFC", padding: "10px 12px", cursor: "pointer", fontSize: 16, color: "#334155" }}
                    >
                      −
                    </button>
                    <span style={{ padding: "0 12px", fontSize: 14, color: "#0F172A", minWidth: 24, textAlign: "center" }}>
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      style={{ border: "none", background: "#F8FAFC", padding: "10px 12px", cursor: "pointer", fontSize: 16, color: "#334155" }}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

              {/* Image upload */}
              <label
                htmlFor="edit-wish-image"
                style={{
                  flex: 1, minHeight: 220,
                  border: "2px dashed #CBD5E1", borderRadius: 12,
                  background: imagePreview ? "transparent" : "#F8FAFC",
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  gap: 10, cursor: uploading ? "wait" : "pointer", overflow: "hidden",
                }}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Product" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <>
                    <svg width="28" height="28" fill="none" stroke="#38A3C7" strokeWidth="1.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 18h16.5M3 9.75h.008v.008H3V9.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM11.25 9.75h.008v.008h-.008V9.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                    </svg>
                    <span style={{ fontSize: 13, color: "#38A3C7" }}>
                      {uploading ? "Uploading…" : "Upload product image"}
                    </span>
                  </>
                )}
              </label>
              <input id="edit-wish-image" type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />

              {/* Link to product */}
              <div>
                <label style={labelStyle}>Link to product</label>
                <div style={{ display: "flex", alignItems: "center", border: "1px solid #E2E8F0", borderRadius: 8, background: "#F8FAFC", overflow: "hidden" }}>
                  <svg width="16" height="16" fill="none" stroke="#94A3B8" strokeWidth="1.5" viewBox="0 0 24 24" style={{ flexShrink: 0, margin: "0 10px" }}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                  </svg>
                  <input
                    name="url"
                    defaultValue={wish.url ?? ""}
                    placeholder="Insert product link"
                    style={{ flex: 1, border: "none", background: "transparent", outline: "none", padding: "11px 8px 11px 0", fontSize: 13, color: "#0F172A" }}
                  />
                </div>
              </div>

              {error && <p style={{ color: "#EF4444", fontSize: 13, margin: 0 }}>{error}</p>}

              {/* Submit */}
              <button
                type="submit"
                disabled={isPending || uploading}
                style={{
                  width: "100%", padding: "15px", borderRadius: 10, border: "none",
                  background: "linear-gradient(135deg, #38A3C7, #2980b9)",
                  color: "white", fontWeight: 700, fontSize: 14, letterSpacing: "0.06em",
                  cursor: isPending || uploading ? "not-allowed" : "pointer",
                  opacity: isPending || uploading ? 0.7 : 1,
                }}
              >
                {isPending ? "Saving…" : "SAVE CHANGES"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  )
}

const labelStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 500, color: "#334155", display: "block", marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "11px 13px", borderRadius: 8,
  border: "1px solid #E2E8F0", fontSize: 14, color: "#0F172A",
  outline: "none", boxSizing: "border-box", background: "white",
}
