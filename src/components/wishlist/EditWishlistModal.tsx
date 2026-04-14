"use client"

import { useState, useTransition } from "react"
import { createClient } from "@/lib/supabase/client"
import { updateWishlist } from "@/lib/actions/wishlists"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import type { Wishlist } from "@/types"

const OCCASIONS = [
  { label: "Birthday", value: "birthday" },
  { label: "Christmas", value: "christmas" },
  { label: "Wedding", value: "wedding" },
  { label: "Baby Shower", value: "baby_shower" },
  { label: "Graduation", value: "graduation" },
  { label: "Anniversary", value: "anniversary" },
  { label: "Other", value: "other" },
]

const TYPES = [
  { value: "personal", label: "Personal", icon: "👤" },
  { value: "together", label: "Together", icon: "👫" },
  { value: "on_behalf", label: "On Behalf", icon: "🎁" },
]

const VISIBILITIES = [
  { value: "public", label: "Public", icon: "🌍" },
  { value: "hidden", label: "Hidden", icon: "🔗" },
  { value: "private", label: "Private", icon: "🔒" },
]

interface Props {
  wishlist: Wishlist
  onClose: () => void
}

export default function EditWishlistModal({ wishlist, onClose }: Props) {
  const [selectedType, setSelectedType] = useState(wishlist.type)
  const [selectedVisibility, setSelectedVisibility] = useState(wishlist.visibility)
  const [coverUrl, setCoverUrl] = useState(wishlist.cover_image_url ?? "")
  const [coverPreview, setCoverPreview] = useState(wishlist.cover_image_url ?? "")
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [isPending, start] = useTransition()

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) { setUploading(false); return }

    const ext = file.name.split(".").pop()
    const path = `${user.id}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from("wishlist-covers")
      .upload(path, file, { upsert: true })

    if (uploadError) { setError("Upload failed: " + uploadError.message); setUploading(false); return }

    const { data: { publicUrl } } = supabase.storage.from("wishlist-covers").getPublicUrl(path)
    setCoverUrl(publicUrl)
    setCoverPreview(URL.createObjectURL(file))
    setUploading(false)
  }

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    const fd = new FormData(e.currentTarget)
    fd.set("id", wishlist.id)
    fd.set("type", selectedType)
    fd.set("visibility", selectedVisibility)
    if (coverUrl) fd.set("cover_image_url", coverUrl)

    start(async () => {
      const res = await updateWishlist(fd)
      if (res?.error) setError(res.error)
    })
  }

  const selectorBtn = (active: boolean): React.CSSProperties => ({
    padding: "10px 8px",
    borderRadius: 10,
    textAlign: "center",
    border: active ? "2px solid #38A3C7" : "2px solid #E2E8F0",
    background: active ? "#E0F4FA" : "white",
    cursor: "pointer",
    transition: "all 0.15s",
  })

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

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          zIndex: 301,
          background: "white",
          borderRadius: 20,
          padding: "28px 28px 24px",
          width: "calc(100% - 32px)",
          maxWidth: 560,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", margin: 0 }}>Edit Wishlist</h2>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8,
              border: "1px solid #E2E8F0", background: "white",
              cursor: "pointer", fontSize: 16, color: "#64748B",
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Cover image */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: "#334155", display: "block", marginBottom: 8 }}>
              Cover Image
            </label>
            <label
              htmlFor="edit-cover-upload"
              style={{
                display: "block",
                cursor: uploading ? "wait" : "pointer",
                borderRadius: 10,
                overflow: "hidden",
                border: "2px dashed #CBD5E1",
                height: 120,
                background: coverPreview ? "transparent" : "#F1F5F9",
                position: "relative",
              }}
            >
              {coverPreview ? (
                <img src={coverPreview} alt="Cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div
                  style={{
                    position: "absolute", inset: 0,
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    gap: 6, color: "#94A3B8",
                  }}
                >
                  <span style={{ fontSize: 22 }}>🖼</span>
                  <span style={{ fontSize: 12 }}>{uploading ? "Uploading…" : "Click to change cover"}</span>
                </div>
              )}
            </label>
            <input
              id="edit-cover-upload"
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleCoverChange}
            />
          </div>

          {/* Title */}
          <div style={{ marginBottom: 18 }}>
            <Input
              label="Wishlist Name"
              name="title"
              defaultValue={wishlist.title}
              placeholder="e.g. My Birthday 2025"
              required
            />
          </div>

          {/* Type */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: "#334155", display: "block", marginBottom: 8 }}>
              Type
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {TYPES.map((t) => (
                <button key={t.value} type="button" onClick={() => setSelectedType(t.value as typeof selectedType)} style={selectorBtn(selectedType === t.value)}>
                  <div style={{ fontSize: 18, marginBottom: 3 }}>{t.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#0F172A" }}>{t.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Visibility */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: "#334155", display: "block", marginBottom: 8 }}>
              Visibility
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {VISIBILITIES.map((v) => (
                <button key={v.value} type="button" onClick={() => setSelectedVisibility(v.value as typeof selectedVisibility)} style={selectorBtn(selectedVisibility === v.value)}>
                  <div style={{ fontSize: 18, marginBottom: 3 }}>{v.icon}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#0F172A" }}>{v.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, fontWeight: 500, color: "#334155", display: "block", marginBottom: 6 }}>
              Description
            </label>
            <textarea
              name="description"
              defaultValue={wishlist.description ?? ""}
              placeholder="Tell people what this wishlist is about…"
              rows={2}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 8,
                border: "1px solid #E2E8F0", fontSize: 13, color: "#0F172A",
                resize: "vertical", outline: "none", fontFamily: "inherit",
                boxSizing: "border-box",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#38A3C7")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#E2E8F0")}
            />
          </div>

          {/* Occasion + Event Date */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 24 }}>
            <Select
              label="Occasion"
              name="occasion"
              options={OCCASIONS}
              placeholder="Select occasion"
              defaultValue={wishlist.occasion ?? ""}
            />
            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: "#334155", display: "block", marginBottom: 6 }}>
                Event Date
              </label>
              <input
                type="date"
                name="event_date"
                defaultValue={wishlist.event_date ?? ""}
                style={{
                  width: "100%", padding: "10px 12px", borderRadius: 8,
                  border: "1px solid #E2E8F0", fontSize: 13, color: "#0F172A",
                  outline: "none", boxSizing: "border-box", background: "white",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#38A3C7")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#E2E8F0")}
              />
            </div>
          </div>

          {error && (
            <div
              style={{
                background: "#FEE2E2", color: "#EF4444",
                borderRadius: 8, padding: "10px 14px",
                fontSize: 13, marginBottom: 16, textAlign: "center",
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1, padding: "12px", borderRadius: 10,
                border: "1px solid #E2E8F0", background: "white",
                fontWeight: 600, fontSize: 13, cursor: "pointer", color: "#334155",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || uploading}
              style={{
                flex: 2, padding: "12px", borderRadius: 10,
                border: "none", background: "#38A3C7", color: "white",
                fontWeight: 700, fontSize: 13, letterSpacing: "0.04em",
                cursor: isPending || uploading ? "not-allowed" : "pointer",
                opacity: isPending || uploading ? 0.7 : 1,
              }}
            >
              {isPending ? "Saving…" : "SAVE CHANGES"}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
