"use client"

import { useEffect, useState, useTransition, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { createWishlist } from "@/lib/actions/wishlists"
import { searchUsers, fetchSuggestedUsers } from "@/lib/actions/friends"
import Select from "@/components/ui/Select"
import { WISHLIST_COLOR_PRESETS } from "./WishlistCard"
import { compressImage, withUploadTimeout } from "@/lib/utils/image"
import { getDisplayName, getInitials, staticAvatarUrl } from "@/lib/utils"
import type { Profile } from "@/types"

type Step = "basic" | "collaborators" | "sub_account" | "details"

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

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"]
  .map((m, i) => ({ label: m, value: String(i + 1).padStart(2, "0") }))
const DAYS  = Array.from({ length: 31 }, (_, i) => ({ label: String(i + 1), value: String(i + 1).padStart(2, "0") }))
const YEARS = Array.from({ length: 100 }, (_, i) => { const y = new Date().getFullYear() - i; return { label: String(y), value: String(y) } })

const PersonIcon = () => (
  <svg width="24" height="24" fill="none" stroke="#38A3C7" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
  </svg>
)

const GroupIcon = () => (
  <svg width="24" height="24" fill="none" stroke="#38A3C7" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
  </svg>
)

const HeartIcon = () => (
  <svg width="24" height="24" fill="none" stroke="#38A3C7" strokeWidth="1.8" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
  </svg>
)

const TYPES = [
  { value: "personal",  label: "FOR ME",    sub: "PERSONAL",      Icon: PersonIcon },
  { value: "together",  label: "TOGETHER",  sub: "WITH OTHERS",   Icon: GroupIcon },
  { value: "on_behalf", label: "ON BEHALF", sub: "OF LOVED ONES", Icon: HeartIcon },
]

// ── Mini avatar used in collaborator rows ─────────────────────────────────────
function UserAvatar({ profile, size = 40 }: { profile: Partial<Profile>; size?: number }) {
  const initials = getInitials(profile)
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: "#38A3C7", color: "white",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.35, fontWeight: 700, flexShrink: 0,
      position: "relative", overflow: "hidden",
    }}>
      {initials}
      {profile.avatar_url && (
        <img
          src={staticAvatarUrl(profile.avatar_url) ?? ""}
          alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          onError={(e) => { e.currentTarget.style.display = "none" }}
        />
      )}
    </div>
  )
}

interface Props {
  onClose: () => void
}

export default function CreateWishlistModal({ onClose }: Props) {
  const [step, setStep]                 = useState<Step>("basic")
  const [selectedType, setSelectedType] = useState("personal")
  const [title, setTitle]               = useState("My wishlist")
  const [selectedVisibility, setSelectedVisibility] = useState("public")
  const [coverUrl, setCoverUrl]         = useState("")
  const [coverPreview, setCoverPreview] = useState("")
  const [selectedColor, setSelectedColor] = useState("blue")
  const [uploading, setUploading]       = useState(false)
  const [error, setError]               = useState("")
  const [isPending, start]              = useTransition()

  // ── Collaborators state ───────────────────────────────────────────────────
  const [collaborators, setCollaborators]   = useState<Profile[]>([])
  const [collabQuery, setCollabQuery]       = useState("")
  const [collabResults, setCollabResults]   = useState<Profile[]>([])
  const [suggestions, setSuggestions]       = useState<Profile[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [searchPending, startSearch]        = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Sub-account state ─────────────────────────────────────────────────────
  const [subFirst,    setSubFirst]    = useState("")
  const [subLast,     setSubLast]     = useState("")
  const [subDobMonth, setSubDobMonth] = useState("")
  const [subDobDay,   setSubDobDay]   = useState("")
  const [subDobYear,  setSubDobYear]  = useState("")
  const [subGender,   setSubGender]   = useState("")
  const [subError,    setSubError]    = useState("")

  useEffect(() => {
    return () => { if (coverPreview.startsWith("blob:")) URL.revokeObjectURL(coverPreview) }
  }, [coverPreview])

  // ── Load suggestions when entering collaborators step ────────────────────
  useEffect(() => {
    if (step !== "collaborators") return
    setLoadingSuggestions(true)
    fetchSuggestedUsers().then(({ users }) => {
      setSuggestions(users.filter(u => !collaborators.some(c => c.id === u.id)))
    }).finally(() => setLoadingSuggestions(false))
  }, [step]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Debounced collaborator search ─────────────────────────────────────────
  const handleCollabSearch = useCallback((q: string) => {
    setCollabQuery(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (q.trim().length < 2) { setCollabResults([]); return }
    debounceRef.current = setTimeout(() => {
      startSearch(async () => {
        const { users } = await searchUsers(q.trim())
        setCollabResults(users.filter(u => !collaborators.some(c => c.id === u.id)))
      })
    }, 300)
  }, [collaborators]) // eslint-disable-line react-hooks/exhaustive-deps

  function addCollaborator(user: Profile) {
    if (collaborators.some(c => c.id === user.id)) return
    setCollaborators(prev => [...prev, user])
    setCollabResults(prev => prev.filter(u => u.id !== user.id))
    setSuggestions(prev => prev.filter(u => u.id !== user.id))
    setCollabQuery("")
  }

  function removeCollaborator(id: string) {
    setCollaborators(prev => prev.filter(u => u.id !== id))
  }

  // ── Cover upload ──────────────────────────────────────────────────────────
  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true); setError("")
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError("Please log in again."); return }
      const { blob, contentType, ext } = await compressImage(file)
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await withUploadTimeout(
        supabase.storage.from("wishlist-covers").upload(path, blob, { upsert: true, contentType })
      )
      if (uploadError) { setError("Upload failed: " + uploadError.message); return }
      const { data: { publicUrl } } = supabase.storage.from("wishlist-covers").getPublicUrl(path)
      setCoverUrl(publicUrl)
      setCoverPreview(URL.createObjectURL(blob))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.")
    } finally {
      setUploading(false)
    }
  }

  // ── Form submission ───────────────────────────────────────────────────────
  function submitWishlist(extra?: { beneficiary_name?: string; sub_account_dob?: string; sub_account_gender?: string }) {
    setError("")
    const fd = new FormData()
    fd.set("title", title)
    fd.set("type", selectedType)
    fd.set("visibility", selectedVisibility)
    if (coverUrl) fd.set("cover_image_url", coverUrl)
    fd.set("color", selectedColor)
    if (extra?.beneficiary_name) fd.set("beneficiary_name", extra.beneficiary_name)
    if (collaborators.length > 0) fd.set("collaborator_ids", JSON.stringify(collaborators.map(c => c.id)))
    start(async () => {
      const res = await createWishlist(fd)
      if (res?.error) setError(res.error)
    })
  }

  function handleBasicSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    submitWishlist()
  }

  function handleSubAccountSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubError("")
    if (!subFirst.trim() || !subLast.trim()) { setSubError("First and last name are required."); return }
    const beneficiary_name = `${subFirst.trim()} ${subLast.trim()}`
    const sub_account_dob = subDobYear && subDobMonth && subDobDay
      ? `${subDobYear}-${subDobMonth}-${subDobDay}` : undefined
    submitWishlist({ beneficiary_name, sub_account_dob, sub_account_gender: subGender || undefined })
  }

  // ── Button label for the basic step ──────────────────────────────────────
  const primaryLabel = selectedType === "together"  ? "ADD COLLABORATOR"
                     : selectedType === "on_behalf" ? "ADD SUB ACCOUNT"
                     : "CREATE WISHLIST"
  const primaryIsSubmit = selectedType === "personal"

  function handlePrimaryClick() {
    if (selectedType === "together")  { setStep("collaborators"); return }
    if (selectedType === "on_behalf") { setStep("sub_account");   return }
  }

  // ── Styles ────────────────────────────────────────────────────────────────
  const typeBtn = (active: boolean): React.CSSProperties => ({
    display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
    padding: "18px 10px", borderRadius: 12,
    border: `2px solid ${active ? "#38A3C7" : "#E2E8F0"}`,
    background: active ? "#F0F9FD" : "white",
    cursor: "pointer", transition: "border-color 0.15s, background 0.15s", flex: 1,
  })

  const primaryBtn = (disabled = false): React.CSSProperties => ({
    width: "100%", padding: "15px", borderRadius: 10, border: "none",
    background: disabled ? "#CBD5E1" : "#38A3C7",
    color: "white", fontWeight: 700, fontSize: 14,
    letterSpacing: "0.05em", cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.8 : 1, marginBottom: 12,
  })

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 14px", borderRadius: 8,
    border: "1px solid #E2E8F0", fontSize: 16, color: "#0F172A",
    outline: "none", boxSizing: "border-box", background: "white",
  }

  // ── Shared header ─────────────────────────────────────────────────────────
  const stepTitle =
    step === "collaborators" ? "Add collaborators"
    : step === "sub_account" ? "Create sub account"
    : step === "details"     ? "Additional details"
    : "Create wishlist"

  const showBack = step !== "basic"

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
        zIndex: 400, backdropFilter: "blur(2px)",
      }} />

      {/* Modal */}
      <div style={{
        position: "fixed", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "min(560px, 96vw)",
        maxHeight: "92vh",
        overflowY: "auto",
        background: "white",
        borderRadius: 20,
        zIndex: 401,
        padding: "28px 32px 32px",
        boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
      }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          {showBack ? (
            <button
              onClick={() => setStep("basic")}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#334155", lineHeight: 1, padding: 4 }}
            >
              ←
            </button>
          ) : <div style={{ width: 36 }} />}

          <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", margin: 0 }}>{stepTitle}</h2>

          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, color: "#94A3B8", lineHeight: 1, padding: 4 }}
          >
            ×
          </button>
        </div>

        {/* ── STEP: BASIC ────────────────────────────────────────────────── */}
        {step === "basic" && (
          <form onSubmit={handleBasicSubmit}>
            {/* Type selector */}
            <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
              {TYPES.map(({ value, label, sub, Icon }) => (
                <button key={value} type="button" onClick={() => setSelectedType(value)} style={typeBtn(selectedType === value)}>
                  <div style={{
                    width: 48, height: 48, borderRadius: "50%",
                    background: selectedType === value ? "#38A3C7" : "#E0F4FA",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", letterSpacing: "0.04em" }}>{label}</span>
                  <span style={{ fontSize: 10, color: "#94A3B8", letterSpacing: "0.06em" }}>{sub}</span>
                </button>
              ))}
            </div>

            {/* Name */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: "#334155", display: "block", marginBottom: 8 }}>
                Name your wishlist
              </label>
              <input
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#38A3C7")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#E2E8F0")}
              />
            </div>

            {/* Color picker — hidden when cover image set */}
            {!coverPreview && (
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#334155", display: "block", marginBottom: 10 }}>
                  Card Color
                </label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {Object.entries(WISHLIST_COLOR_PRESETS).map(([key, gradient]) => (
                    <button
                      key={key} type="button" onClick={() => setSelectedColor(key)}
                      style={{
                        width: 32, height: 32, borderRadius: "50%", background: gradient, padding: 0,
                        border: selectedColor === key ? "3px solid #0F172A" : "3px solid transparent",
                        outline: selectedColor === key ? "2px solid white" : "none",
                        outlineOffset: selectedColor === key ? "-5px" : "0",
                        cursor: "pointer", transition: "transform 0.1s",
                        transform: selectedColor === key ? "scale(1.15)" : "scale(1)",
                      }}
                      title={key.charAt(0).toUpperCase() + key.slice(1)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Currency selector — for on_behalf */}
            {selectedType === "on_behalf" && (
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "12px 14px", borderRadius: 8,
                border: "1px solid #E2E8F0", marginBottom: 20, cursor: "pointer",
              }}>
                <span style={{ fontSize: 18 }}>💰</span>
                <span style={{ fontSize: 14, color: "#64748B" }}>Currency</span>
                <span style={{ marginLeft: "auto", fontSize: 13, color: "#38A3C7", fontWeight: 600 }}>USD ›</span>
              </div>
            )}

            {error && <p style={{ color: "#EF4444", fontSize: 13, textAlign: "center", marginBottom: 16 }}>{error}</p>}

            {/* Primary action */}
            {primaryIsSubmit ? (
              <button type="submit" disabled={isPending} style={primaryBtn(isPending)}>
                {isPending ? "Creating…" : "CREATE WISHLIST"}
              </button>
            ) : (
              <button type="button" onClick={handlePrimaryClick} style={primaryBtn()}>
                {primaryLabel}
              </button>
            )}

            <button
              type="button" onClick={() => setStep("details")}
              style={{ width: "100%", background: "none", border: "none", color: "#38A3C7", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
            >
              Add additional Details &gt;
            </button>
          </form>
        )}

        {/* ── STEP: COLLABORATORS ─────────────────────────────────────────── */}
        {step === "collaborators" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {/* Search */}
            <div style={{ position: "relative", marginBottom: 20 }}>
              <svg style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}
                width="16" height="16" fill="none" stroke="#94A3B8" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="m21 21-4.35-4.35" />
              </svg>
              <input
                value={collabQuery}
                onChange={(e) => handleCollabSearch(e.target.value)}
                placeholder="Search for name"
                style={{ ...inputStyle, paddingLeft: 40 }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#38A3C7")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#E2E8F0")}
              />
            </div>

            {/* Selected collaborators */}
            {collaborators.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#64748B", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Added ({collaborators.length})
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {collaborators.map(u => (
                    <div key={u.id} style={{
                      display: "flex", alignItems: "center", gap: 8,
                      background: "#E0F4FA", borderRadius: 999, padding: "6px 12px 6px 6px",
                    }}>
                      <UserAvatar profile={u} size={28} />
                      <span style={{ fontSize: 13, fontWeight: 500, color: "#0F172A" }}>{getDisplayName(u)}</span>
                      <button
                        onClick={() => removeCollaborator(u.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B", fontSize: 16, lineHeight: 1, padding: 0, marginLeft: 2 }}
                      >×</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search results */}
            {collabQuery.length >= 2 && (
              <div style={{ marginBottom: 16 }}>
                {searchPending ? (
                  <p style={{ fontSize: 13, color: "#94A3B8", textAlign: "center", padding: "12px 0" }}>Searching…</p>
                ) : collabResults.length === 0 ? (
                  <p style={{ fontSize: 13, color: "#94A3B8", textAlign: "center", padding: "12px 0" }}>No users found</p>
                ) : (
                  collabResults.map(u => (
                    <UserRow key={u.id} user={u} onAdd={() => addCollaborator(u)} />
                  ))
                )}
              </div>
            )}

            {/* Suggestions */}
            {collabQuery.length < 2 && (
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#64748B", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Suggestions
                </p>
                {loadingSuggestions ? (
                  <p style={{ fontSize: 13, color: "#94A3B8", textAlign: "center", padding: "12px 0" }}>Loading…</p>
                ) : suggestions.length === 0 ? (
                  <p style={{ fontSize: 13, color: "#94A3B8", textAlign: "center", padding: "12px 0" }}>No suggestions available</p>
                ) : (
                  suggestions.map(u => (
                    <UserRow key={u.id} user={u} onAdd={() => addCollaborator(u)} />
                  ))
                )}
              </div>
            )}

            <div style={{ marginTop: 24 }}>
              {error && <p style={{ color: "#EF4444", fontSize: 13, textAlign: "center", marginBottom: 12 }}>{error}</p>}
              <button
                onClick={() => submitWishlist()}
                disabled={isPending}
                style={primaryBtn(isPending)}
              >
                {isPending ? "Creating…" : "CREATE WISHLIST"}
              </button>
              <button
                type="button" onClick={() => setStep("details")}
                style={{ width: "100%", background: "none", border: "none", color: "#38A3C7", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
              >
                Add additional Details &gt;
              </button>
            </div>
          </div>
        )}

        {/* ── STEP: SUB ACCOUNT ──────────────────────────────────────────── */}
        {step === "sub_account" && (
          <form onSubmit={handleSubAccountSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#334155", display: "block", marginBottom: 6 }}>First name</label>
                <input
                  value={subFirst} onChange={(e) => setSubFirst(e.target.value)}
                  placeholder="First name" required
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#38A3C7")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#E2E8F0")}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: "#334155", display: "block", marginBottom: 6 }}>Last name</label>
                <input
                  value={subLast} onChange={(e) => setSubLast(e.target.value)}
                  placeholder="Last name" required
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#38A3C7")}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "#E2E8F0")}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: "#334155", display: "block", marginBottom: 8 }}>Date of birth</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                <Select options={MONTHS} placeholder="Month" value={subDobMonth} onChange={(e) => setSubDobMonth(e.target.value)} />
                <Select options={DAYS}   placeholder="Day"   value={subDobDay}   onChange={(e) => setSubDobDay(e.target.value)}   />
                <Select options={YEARS}  placeholder="Year"  value={subDobYear}  onChange={(e) => setSubDobYear(e.target.value)}  />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 500, color: "#334155", display: "block", marginBottom: 10 }}>Gender</label>
              <div style={{ display: "flex", gap: 12 }}>
                {["Female", "Male", "Other"].map((g) => (
                  <label key={g} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 14, color: "#334155" }}>
                    <input
                      type="radio" name="sub_gender" value={g.toLowerCase()}
                      checked={subGender === g.toLowerCase()}
                      onChange={() => setSubGender(g.toLowerCase())}
                      style={{ accentColor: "#38A3C7", width: 16, height: 16 }}
                    />
                    {g}
                  </label>
                ))}
              </div>
            </div>

            {subError && <p style={{ color: "#EF4444", fontSize: 13, textAlign: "center", margin: 0 }}>{subError}</p>}
            {error    && <p style={{ color: "#EF4444", fontSize: 13, textAlign: "center", margin: 0 }}>{error}</p>}

            <button type="submit" disabled={isPending} style={{ ...primaryBtn(isPending), marginBottom: 0, marginTop: 8 }}>
              {isPending ? "Creating…" : "CREATE SUB ACCOUNT"}
            </button>
          </form>
        )}

        {/* ── STEP: DETAILS ──────────────────────────────────────────────── */}
        {step === "details" && (
          <form onSubmit={handleBasicSubmit}>
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
                  cursor: uploading ? "wait" : "pointer", overflow: "hidden", position: "relative",
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

            <div style={{ marginBottom: 16 }}>
              <Select label="Type of event" name="occasion" options={OCCASIONS} placeholder="Select occasion" />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: "#334155", display: "block", marginBottom: 6 }}>Description</label>
              <textarea
                name="description"
                placeholder="Briefly describe the wishlist for those you share it with."
                rows={3}
                style={{
                  width: "100%", padding: "11px 13px", borderRadius: 8,
                  border: "1px solid #E2E8F0", fontSize: 14, color: "#0F172A",
                  resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#38A3C7")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#E2E8F0")}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: "#334155", display: "block", marginBottom: 6 }}>Event Date</label>
              <input
                type="date" name="event_date"
                style={{ ...inputStyle, fontSize: 13, background: "white" }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#38A3C7")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#E2E8F0")}
              />
            </div>

            <div style={{ marginBottom: 28 }}>
              <Select
                label="Visibility" name="visibility_select" options={VISIBILITIES}
                placeholder="Select visibility" onChange={(e) => setSelectedVisibility(e.target.value)}
              />
            </div>

            {error && <p style={{ color: "#EF4444", fontSize: 13, textAlign: "center", marginBottom: 16 }}>{error}</p>}

            <button type="submit" disabled={isPending || uploading} style={primaryBtn(isPending || uploading)}>
              {isPending ? "Creating…" : "CREATE WISHLIST"}
            </button>
          </form>
        )}
      </div>
    </>
  )
}

// ── Reusable user row in collaborators list ───────────────────────────────────
function UserRow({ user, onAdd }: { user: Profile; onAdd: () => void }) {
  const name = getDisplayName(user)
  const username = user.username ? `@${user.username}` : ""
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "10px 0", borderBottom: "1px solid #F1F5F9",
    }}>
      <UserAvatar profile={user} size={42} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#0F172A", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</p>
        {username && <p style={{ margin: 0, fontSize: 12, color: "#94A3B8" }}>{username}</p>}
      </div>
      <button
        onClick={onAdd}
        style={{
          width: 36, height: 36, borderRadius: 10,
          border: "1.5px solid #E2E8F0", background: "white",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 20, color: "#38A3C7", fontWeight: 300, flexShrink: 0,
        }}
        aria-label={`Add ${name}`}
      >+</button>
    </div>
  )
}
