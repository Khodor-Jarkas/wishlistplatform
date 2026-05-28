"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { createWishlist } from "@/lib/actions/wishlists"
import Container from "@/components/ui/Container"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import { useIsMobile } from "@/lib/hooks/useMediaQuery"
import { compressImage, withUploadTimeout } from "@/lib/utils/image"

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
  { value: "personal", label: "Personal", desc: "Your own wishlist", icon: "👤" },
  { value: "together", label: "Together", desc: "Shared with someone", icon: "👫" },
  { value: "on_behalf", label: "On Behalf", desc: "For someone else", icon: "🎁" },
]

const VISIBILITIES = [
  { value: "public", label: "Public", desc: "Visible to everyone", icon: "🌍" },
  { value: "hidden", label: "Hidden", desc: "Accessible via link", icon: "🔗" },
  { value: "private", label: "Private", desc: "Only you can see it", icon: "🔒" },
]

export default function NewWishlistPage() {
  const isMobile = useIsMobile()
  const [selectedType, setSelectedType] = useState("personal")
  const [selectedVisibility, setSelectedVisibility] = useState("public")
  const [coverUrl, setCoverUrl] = useState("")
  const [coverPreview, setCoverPreview] = useState("")
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [isPending, start] = useTransition()

  useEffect(() => {
    return () => { if (coverPreview.startsWith("blob:")) URL.revokeObjectURL(coverPreview) }
  }, [coverPreview])

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError("")
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError("Please log in again."); return }
      const { blob, contentType, ext } = await compressImage(file)
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await withUploadTimeout(
        supabase.storage.from("wishlist-covers").upload(path, blob, { upsert: true, contentType })
      )
      if (uploadError) { setError("Cover upload failed: " + uploadError.message); return }
      const { data: { publicUrl } } = supabase.storage.from("wishlist-covers").getPublicUrl(path)
      setCoverUrl(publicUrl)
      setCoverPreview(URL.createObjectURL(blob))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cover upload failed.")
      console.error("[NewWishlist] cover upload failed", err)
    } finally {
      setUploading(false)
    }
  }

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    const fd = new FormData(e.currentTarget)
    fd.set("type", selectedType)
    fd.set("visibility", selectedVisibility)
    if (coverUrl) fd.set("cover_image_url", coverUrl)

    start(async () => {
      const res = await createWishlist(fd)
      if (res?.error) setError(res.error)
    })
  }

  const selectorBtn = (active: boolean): React.CSSProperties => ({
    padding: isMobile ? "12px 6px" : "14px 10px",
    borderRadius: 10,
    textAlign: "center",
    border: active ? "2px solid #38A3C7" : "2px solid #E2E8F0",
    background: active ? "#E0F4FA" : "white",
    cursor: "pointer",
    transition: "all 0.15s",
  })

  return (
    <main style={{ minHeight: "100vh", background: "#F8FAFC", paddingBottom: 60 }}>
      <Container>
        <div style={{ paddingTop: 32, maxWidth: 640, margin: "0 auto" }}>
          {/* Back link */}
          <Link
            href="/dashboard"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              color: "#64748B",
              textDecoration: "none",
              marginBottom: 28,
            }}
          >
            ← Back to Wishlists
          </Link>

          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0F172A", margin: "0 0 6px" }}>
            Create Wishlist
          </h1>
          <p style={{ fontSize: 14, color: "#94A3B8", margin: "0 0 32px" }}>
            Organise your wishes into a list and share it with people you love.
          </p>

          <form onSubmit={handleSubmit}>
            {/* Cover image upload */}
            <div style={{ marginBottom: 28 }}>
              <label
                style={{ fontSize: 14, fontWeight: 500, color: "#334155", display: "block", marginBottom: 10 }}
              >
                Cover Image
              </label>
              <label
                htmlFor="cover-upload"
                style={{
                  display: "block",
                  cursor: uploading ? "wait" : "pointer",
                  borderRadius: 12,
                  overflow: "hidden",
                  border: "2px dashed #CBD5E1",
                  height: 180,
                  background: coverPreview ? "transparent" : "#F1F5F9",
                  position: "relative",
                  transition: "border-color 0.15s",
                }}
              >
                {coverPreview ? (
                  <img
                    src={coverPreview}
                    alt="Cover preview"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      color: "#94A3B8",
                    }}
                  >
                    <span style={{ fontSize: 32 }}>🖼</span>
                    <span style={{ fontSize: 13 }}>
                      {uploading ? "Uploading…" : "Click to upload a cover image"}
                    </span>
                    <span style={{ fontSize: 11 }}>JPG, PNG or WebP</span>
                  </div>
                )}
              </label>
              <input
                id="cover-upload"
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleCoverChange}
              />
            </div>

            {/* Title */}
            <div style={{ marginBottom: 24 }}>
              <Input
                label="Wishlist Name"
                name="title"
                placeholder="e.g. My Birthday 2025"
                required
                autoFocus
              />
            </div>

            {/* Type selector */}
            <div style={{ marginBottom: 24 }}>
              <label
                style={{ fontSize: 14, fontWeight: 500, color: "#334155", display: "block", marginBottom: 10 }}
              >
                Type
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setSelectedType(t.value)}
                    style={selectorBtn(selectedType === t.value)}
                  >
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{t.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{t.label}</div>
                    {!isMobile && <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{t.desc}</div>}
                  </button>
                ))}
              </div>
            </div>

            {/* Visibility selector */}
            <div style={{ marginBottom: 28 }}>
              <label
                style={{ fontSize: 14, fontWeight: 500, color: "#334155", display: "block", marginBottom: 10 }}
              >
                Visibility
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {VISIBILITIES.map((v) => (
                  <button
                    key={v.value}
                    type="button"
                    onClick={() => setSelectedVisibility(v.value)}
                    style={selectorBtn(selectedVisibility === v.value)}
                  >
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{v.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{v.label}</div>
                    {!isMobile && <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{v.desc}</div>}
                  </button>
                ))}
              </div>
            </div>

            {/* Details section */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
              <span style={{ fontSize: 12, color: "#94A3B8", fontWeight: 500 }}>Details (optional)</span>
              <div style={{ flex: 1, height: 1, background: "#E2E8F0" }} />
            </div>

            {/* Description */}
            <div style={{ marginBottom: 20 }}>
              <label
                style={{ fontSize: 14, fontWeight: 500, color: "#334155", display: "block", marginBottom: 6 }}
              >
                Description
              </label>
              <textarea
                name="description"
                placeholder="Tell people what this wishlist is about…"
                rows={3}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 8,
                  border: "1px solid #E2E8F0",
                  fontSize: 14,
                  color: "#0F172A",
                  resize: "vertical",
                  outline: "none",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#38A3C7")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#E2E8F0")}
              />
            </div>

            {/* Occasion + Event Date */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 36 }}>
              <Select
                label="Occasion"
                name="occasion"
                options={OCCASIONS}
                placeholder="Select occasion"
              />
              <div>
                <label
                  style={{ fontSize: 14, fontWeight: 500, color: "#334155", display: "block", marginBottom: 6 }}
                >
                  Event Date
                </label>
                <input
                  type="date"
                  name="event_date"
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    borderRadius: 8,
                    border: "1px solid #E2E8F0",
                    fontSize: 14,
                    color: "#0F172A",
                    outline: "none",
                    boxSizing: "border-box",
                    background: "white",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#38A3C7")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#E2E8F0")}
                />
              </div>
            </div>

            {error && (
              <div
                style={{
                  background: "#FEE2E2",
                  color: "#EF4444",
                  borderRadius: 8,
                  padding: "10px 14px",
                  fontSize: 13,
                  marginBottom: 20,
                  textAlign: "center",
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isPending || uploading}
              style={{
                width: "100%",
                padding: "16px",
                borderRadius: 10,
                border: "none",
                background: "#38A3C7",
                color: "white",
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: "0.05em",
                cursor: isPending || uploading ? "not-allowed" : "pointer",
                opacity: isPending || uploading ? 0.7 : 1,
              }}
            >
              {isPending ? "Creating…" : "CREATE WISHLIST"}
            </button>
          </form>
        </div>
      </Container>
    </main>
  )
}
