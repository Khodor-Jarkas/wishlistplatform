"use client"

import { useState, useTransition } from "react"
import { createClient } from "@/lib/supabase/client"
import { createWishlist } from "@/lib/actions/wishlists"
import Select from "@/components/ui/Select"
import { WISHLIST_COLOR_PRESETS } from "./WishlistCard"

const OCCASIONS = [
  { label: "Birthday",    value: "birthday" },
  { label: "Christmas",   value: "christmas" },
  { label: "Wedding",     value: "wedding" },
  { label: "Baby Shower", value: "baby_shower" },
  { label: "Graduation",  value: "graduation" },
  { label: "Anniversary", value: "anniversary" },
  { label: "Other",       value: "other" },
]

const VISIBILITIES = [
  { label: "Public — visible to everyone",    value: "public" },
  { label: "Hidden — accessible via link",    value: "hidden" },
  { label: "Private — only you can see it",   value: "private" },
]

const PersonIcon = () => (
  <svg width="22" height="22" fill="none" stroke="#38A3C7" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
  </svg>
)

const GroupIcon = () => (
  <svg width="22" height="22" fill="none" stroke="#38A3C7" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
  </svg>
)

const HeartIcon = () => (
  <svg width="22" height="22" fill="none" stroke="#38A3C7" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
  </svg>
)

const TYPES = [
  { value: "personal",  label: "FOR ME",     sub: "PERSONAL",      Icon: PersonIcon },
  { value: "together",  label: "TOGETHER",   sub: "WITH OTHERS",   Icon: GroupIcon },
  { value: "on_behalf", label: "ON BEHALF",  sub: "OF LOVED ONES", Icon: HeartIcon },
]

interface Props {
  onClose: () => void
}

export default function CreateWishlistModal({ onClose }: Props) {
  const [step, setStep] = useState<"basic" | "details">("basic")
  const [selectedType, setSelectedType] = useState("personal")
  const [selectedVisibility, setSelectedVisibility] = useState("public")
  const [coverUrl, setCoverUrl] = useState("")
  const [coverPreview, setCoverPreview] = useState("")
  const [selectedColor, setSelectedColor] = useState("blue")
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [isPending, start] = useTransition()

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setUploading(false); return }
    const ext = file.name.split(".").pop()
    const path = `${user.id}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from("wishlist-covers").upload(path, file, { upsert: true })
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
    fd.set("type", selectedType)
    fd.set("visibility", selectedVisibility)
    if (coverUrl) fd.set("cover_image_url", coverUrl)
    fd.set("color", selectedColor)
    start(async () => {
      const res = await createWishlist(fd)
      if (res?.error) setError(res.error)
    })
  }

  const typeBtn = (active: boolean): React.CSSProperties => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    padding: "16px 8px",
    borderRadius: 8,
    border: active ? "2px solid #38A3C7" : "2px solid #E2E8F0",
    background: "white",
    cursor: "pointer",
    transition: "border-color 0.15s",
    flex: 1,
  })

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
          zIndex: 400, backdropFilter: "blur(2px)",
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(480px, 95vw)",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "white",
          borderRadius: 16,
          zIndex: 401,
          padding: "32px 32px 28px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#0F172A", margin: 0 }}>
            {step === "basic" ? "Create Wishlist" : "Additional Details"}
          </h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#94A3B8", lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {step === "basic" ? (
            <>
              {/* Type selector */}
              <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
                {TYPES.map(({ value, label, sub, Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSelectedType(value)}
                    style={typeBtn(selectedType === value)}
                  >
                    <Icon />
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", letterSpacing: "0.04em" }}>{label}</span>
                    <span style={{ fontSize: 10, color: "#94A3B8", letterSpacing: "0.06em" }}>{sub}</span>
                  </button>
                ))}
              </div>

              {/* Name */}
              <div style={{ marginBottom: selectedType === "on_behalf" ? 16 : 28 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#334155", display: "block", marginBottom: 8 }}>
                  Name your wishlist
                </label>
                <input
                  name="title"
                  defaultValue="My wishlist"
                  required
                  autoFocus
                  style={{
                    width: "100%", padding: "12px 14px", borderRadius: 8,
                    border: "1px solid #E2E8F0", fontSize: 14, color: "#0F172A",
                    outline: "none", boxSizing: "border-box",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#38A3C7")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#E2E8F0")}
                />
              </div>

              {/* Color picker — only when no cover image */}
              {!coverPreview && (
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "#334155", display: "block", marginBottom: 10 }}>
                    Card Color
                  </label>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {Object.entries(WISHLIST_COLOR_PRESETS).map(([key, gradient]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedColor(key)}
                        style={{
                          width: 32, height: 32, borderRadius: "50%",
                          background: gradient,
                          border: selectedColor === key ? "3px solid #0F172A" : "3px solid transparent",
                          outline: selectedColor === key ? "2px solid white" : "none",
                          outlineOffset: selectedColor === key ? "-5px" : "0",
                          cursor: "pointer",
                          padding: 0,
                          transition: "transform 0.1s",
                          transform: selectedColor === key ? "scale(1.15)" : "scale(1)",
                        }}
                        title={key.charAt(0).toUpperCase() + key.slice(1)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Beneficiary name — only for on_behalf */}
              {selectedType === "on_behalf" && (
                <div style={{ marginBottom: 28 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "#334155", display: "block", marginBottom: 8 }}>
                    Who is this for?
                  </label>
                  <input
                    name="beneficiary_name"
                    placeholder="e.g. Emma, my daughter"
                    style={{
                      width: "100%", padding: "12px 14px", borderRadius: 8,
                      border: "1px solid #E2E8F0", fontSize: 14, color: "#0F172A",
                      outline: "none", boxSizing: "border-box",
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#38A3C7")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "#E2E8F0")}
                  />
                </div>
              )}

              {error && (
                <p style={{ color: "#EF4444", fontSize: 13, textAlign: "center", marginBottom: 16 }}>{error}</p>
              )}

              {/* Actions */}
              <button
                type="submit"
                disabled={isPending}
                style={{
                  width: "100%", padding: "15px", borderRadius: 10, border: "none",
                  background: "#38A3C7", color: "white", fontWeight: 700, fontSize: 14,
                  letterSpacing: "0.05em", cursor: isPending ? "not-allowed" : "pointer",
                  opacity: isPending ? 0.7 : 1, marginBottom: 14,
                }}
              >
                {isPending ? "Creating…" : "CREATE WISHLIST"}
              </button>

              <button
                type="button"
                onClick={() => setStep("details")}
                style={{
                  width: "100%", background: "none", border: "none",
                  color: "#38A3C7", fontSize: 13, fontWeight: 500, cursor: "pointer",
                }}
              >
                Add additional Details &gt;
              </button>
            </>
          ) : (
            <>
              {/* Back */}
              <button
                type="button"
                onClick={() => setStep("basic")}
                style={{ background: "none", border: "none", color: "#64748B", fontSize: 13, cursor: "pointer", padding: 0, marginBottom: 20 }}
              >
                ← Back
              </button>

              {/* Cover image */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#334155", display: "block", marginBottom: 8 }}>
                  Add Cover Image
                </label>
                <label
                  htmlFor="modal-cover-upload"
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                    height: 100, borderRadius: 10, border: "2px dashed #CBD5E1",
                    background: coverPreview ? "transparent" : "#F0F9FF",
                    cursor: uploading ? "wait" : "pointer", overflow: "hidden",
                    position: "relative",
                  }}
                >
                  {coverPreview ? (
                    <img src={coverPreview} alt="Cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <>
                      <svg width="24" height="24" fill="none" stroke="#38A3C7" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 18h16.5M3 9.75h.008v.008H3V9.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM11.25 9.75h.008v.008h-.008V9.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM18.75 9.75h.008v.008h-.008V9.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                      </svg>
                      <span style={{ fontSize: 13, color: "#38A3C7" }}>{uploading ? "Uploading…" : "Add Cover Image"}</span>
                    </>
                  )}
                </label>
                <input id="modal-cover-upload" type="file" accept="image/*" style={{ display: "none" }} onChange={handleCoverChange} />
              </div>

              {/* Hidden name field to carry through */}
              <input name="title" defaultValue="My wishlist" required style={{ display: "none" }} />

              {/* Occasion */}
              <div style={{ marginBottom: 16 }}>
                <Select label="Type of event" name="occasion" options={OCCASIONS} placeholder="Select occasion" />
              </div>

              {/* Description */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#334155", display: "block", marginBottom: 6 }}>Description</label>
                <textarea
                  name="description"
                  placeholder="Here you can briefly describe the wish list for those you choose to share it with."
                  rows={3}
                  style={{
                    width: "100%", padding: "11px 13px", borderRadius: 8,
                    border: "1px solid #E2E8F0", fontSize: 13, color: "#0F172A",
                    resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#38A3C7")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#E2E8F0")}
                />
              </div>

              {/* Event Date */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#334155", display: "block", marginBottom: 6 }}>Event Date</label>
                <input
                  type="date"
                  name="event_date"
                  style={{
                    width: "100%", padding: "11px 13px", borderRadius: 8,
                    border: "1px solid #E2E8F0", fontSize: 13, color: "#0F172A",
                    outline: "none", boxSizing: "border-box", background: "white",
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#38A3C7")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#E2E8F0")}
                />
              </div>

              {/* Visibility */}
              <div style={{ marginBottom: 24 }}>
                <Select label="Visibility" name="visibility_select" options={VISIBILITIES} placeholder="Select visibility"
                  onChange={(e) => setSelectedVisibility(e.target.value)} />
              </div>

              {error && (
                <p style={{ color: "#EF4444", fontSize: 13, textAlign: "center", marginBottom: 16 }}>{error}</p>
              )}

              <button
                type="submit"
                disabled={isPending || uploading}
                style={{
                  width: "100%", padding: "15px", borderRadius: 10, border: "none",
                  background: "#38A3C7", color: "white", fontWeight: 700, fontSize: 14,
                  letterSpacing: "0.05em", cursor: isPending || uploading ? "not-allowed" : "pointer",
                  opacity: isPending || uploading ? 0.7 : 1,
                }}
              >
                {isPending ? "Creating…" : "CREATE WISHLIST"}
              </button>
            </>
          )}
        </form>
      </div>
    </>
  )
}
