"use client"

import { useRef, useState, useTransition } from "react"
import Link from "next/link"
import { updateProfile, changePassword, deleteAccount } from "@/lib/actions/auth"
import { toggleCreatorStatus, type CreatorEligibility } from "@/lib/actions/creators"
import { createClient } from "@/lib/supabase/client"
import type { Profile } from "@/types"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import Toggle from "@/components/ui/Toggle"
import Modal from "@/components/ui/Modal"
import Button from "@/components/ui/Button"
import { COUNTRIES } from "@/lib/countries"
import { useIsMobile } from "@/lib/hooks/useMediaQuery"

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"]
  .map((m, i) => ({ label: m, value: String(i + 1).padStart(2, "0") }))
const DAYS  = Array.from({ length: 31 }, (_, i) => ({ label: String(i + 1), value: String(i + 1).padStart(2, "0") }))
const YEARS = Array.from({ length: 100 }, (_, i) => { const y = new Date().getFullYear() - i; return { label: String(y), value: String(y) } })
const GENDERS = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
  { label: "Prefer not to say", value: "prefer_not_to_say" },
]
const LANGUAGES = [
  { label: "English", value: "en" }, { label: "Norwegian", value: "no" },
  { label: "Arabic", value: "ar" }, { label: "French", value: "fr" },
]

interface Props {
  profile: Profile & {
    first_name?: string; last_name?: string; date_of_birth?: string
    gender?: string; phone?: string; zip_code?: string; country?: string
    is_private?: boolean; language?: string
  }
  email: string
  creatorEligibility: CreatorEligibility | null
}

export default function ProfileSettingsClient({ profile, email, creatorEligibility }: Props) {
  const isMobile = useIsMobile()
  const dob = profile.date_of_birth?.split("-") ?? []
  const [isPrivate, setIsPrivate] = useState(profile.is_private ?? false)
  const [isCreator, setIsCreator] = useState(creatorEligibility?.is_creator ?? false)
  const [creatorMsg, setCreatorMsg] = useState("")
  const [dobMonth, setDobMonth] = useState(dob[1] ?? "")
  const [dobDay,   setDobDay]   = useState(dob[2] ?? "")
  const [dobYear,  setDobYear]  = useState(dob[0] ?? "")
  const [avatarUrl, setAvatarUrl]         = useState(profile.avatar_url ?? "")
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar_url ?? "")
  const [cropFile, setCropFile]           = useState<File | null>(null)
  const [uploading, setUploading]         = useState(false)

  const [profileMsg,  setProfileMsg]  = useState("")
  const [passwordMsg, setPasswordMsg] = useState("")
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [isPending, startTransition] = useTransition()

  const initials = (
    (profile.first_name?.[0] ?? profile.username?.[0] ?? "?").toUpperCase() +
    (profile.last_name?.[0] ?? "").toUpperCase()
  )

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    // Reset input so re-selecting same file triggers onChange
    e.target.value = ""
    setCropFile(file)
  }

  async function handleCropApply(blob: Blob) {
    setCropFile(null)
    setUploading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const path = `${user.id}/avatar.jpg`
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, blob, { upsert: true, contentType: "image/jpeg" })
      if (uploadError) { setProfileMsg("Error: " + uploadError.message); return }
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path)
      // Bust browser cache by appending timestamp
      setAvatarUrl(publicUrl + "?t=" + Date.now())
      setAvatarPreview(URL.createObjectURL(blob))
    } finally {
      setUploading(false)
    }
  }

  function handleProfileSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    if (dobMonth && dobDay && dobYear) fd.set("date_of_birth", `${dobYear}-${dobMonth}-${dobDay}`)
    fd.set("is_private", String(isPrivate))
    fd.set("avatar_url", avatarUrl)
    startTransition(async () => {
      const result = await updateProfile(fd)
      setProfileMsg(result?.error ? `Error: ${result.error}` : "Profile saved.")
      setTimeout(() => setProfileMsg(""), 3000)
    })
  }

  function handleCreatorToggle(next: boolean) {
    setCreatorMsg("")
    const prev = isCreator
    setIsCreator(next)
    startTransition(async () => {
      const result = await toggleCreatorStatus(next)
      if (result?.error) {
        setIsCreator(prev)
        setCreatorMsg(result.error)
      } else {
        setCreatorMsg(next ? "You're now a Creator." : "Creator mode off.")
        setTimeout(() => setCreatorMsg(""), 3000)
      }
    })
  }

  function handlePasswordSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await changePassword(fd)
      setPasswordMsg(result?.error ?? "Password updated.")
      setTimeout(() => { setPasswordMsg(""); setShowPasswordModal(false) }, 2000)
    })
  }

  const section = (title: string) => (
    <h2 style={{ fontSize: 20, fontWeight: 600, margin: "32px 0 16px", color: "#0F172A" }}>{title}</h2>
  )

  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: isMobile ? "24px 16px 60px" : "40px 24px 80px" }}>

      {/* Avatar + name */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
        <label
          htmlFor="avatar-upload"
          title={uploading ? "Uploading…" : "Click to change photo"}
          style={{ cursor: uploading ? "wait" : "pointer", flexShrink: 0, position: "relative" }}
        >
          <div style={{
            width: 72, height: 72, borderRadius: "50%", background: "#38A3C7",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white", fontWeight: 700, fontSize: 24, overflow: "hidden",
            border: "3px solid white", boxShadow: "0 0 0 2px #38A3C7",
          }}>
            {avatarPreview
              ? <img src={avatarPreview} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : initials}
          </div>
          <div style={{
            position: "absolute", bottom: 0, right: 0,
            width: 22, height: 22, borderRadius: "50%",
            background: "#0F172A", border: "2px solid white",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, color: "white",
          }}>
            {uploading ? "…" : "✎"}
          </div>
        </label>
        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleAvatarChange}
        />
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 2px" }}>
            {profile.full_name ?? profile.username}
          </h1>
          <span style={{ fontSize: 13, color: "#94A3B8" }}>@{profile.username}</span>
        </div>
      </div>

      <form onSubmit={handleProfileSubmit} style={{ display: "flex", flexDirection: "column", gap: 0 }}>

        {/* Personal */}
        {section("Personal")}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
          <Input label="First name" name="first_name" defaultValue={profile.first_name ?? ""} placeholder="First name" />
          <Input label="Last name"  name="last_name"  defaultValue={profile.last_name  ?? ""} placeholder="Last name"  />
        </div>

        <div style={{ marginTop: 16 }}>
          <label style={{ fontSize: 14, fontWeight: 500, color: "#334155", display: "block", marginBottom: 8 }}>Date of birth</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <Select options={MONTHS} placeholder="Month" value={dobMonth} onChange={(e) => setDobMonth(e.target.value)} />
            <Select options={DAYS}   placeholder="Day"   value={dobDay}   onChange={(e) => setDobDay(e.target.value)}   />
            <Select options={YEARS}  placeholder="Year"  value={dobYear}  onChange={(e) => setDobYear(e.target.value)}  />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginTop: 16 }}>
          <Select label="Gender" name="gender" options={GENDERS} placeholder="Select gender" defaultValue={profile.gender ?? ""} />
          <Input  label="Email"  name="email"  type="email" value={email} readOnly style={{ background: "#F8FAFC", color: "#64748B" }} />
        </div>

        {/* Phone */}
        <div style={{ marginTop: 16 }}>
          <Input label="Phone number" name="phone" type="tel" defaultValue={profile.phone ?? ""} placeholder="71 111 222" />
        </div>

        {/* Bio */}
        <div style={{ marginTop: 16 }}>
          <label style={{ fontSize: 14, fontWeight: 500, color: "#334155", display: "block", marginBottom: 8 }}>Bio</label>
          <textarea
            name="bio"
            defaultValue={profile.bio ?? ""}
            placeholder="Tell people a little about yourself…"
            rows={3}
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

        {/* Location */}
        {section("Location")}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
          <Input  label="Zip Code"        name="zip_code" defaultValue={profile.zip_code ?? ""} placeholder="Zip Code" />
          <Select label="Country / Region" name="country"  options={COUNTRIES} defaultValue={profile.country ?? ""} placeholder="Select country" />
        </div>

        {/* Privacy */}
        <div style={{ marginTop: 24, padding: "16px 0", borderTop: "1px solid #E2E8F0", borderBottom: "1px solid #E2E8F0" }}>
          <Toggle
            checked={isPrivate}
            onChange={setIsPrivate}
            label="Make this account private"
            description="If you make this account private, only friends will be able to see it."
          />
        </div>

        {/* Creator */}
        {section("Creator profile")}
        <CreatorSection
          eligibility={creatorEligibility}
          checked={isCreator}
          onToggle={handleCreatorToggle}
          message={creatorMsg}
        />

        {/* Language */}
        {section("Language")}
        <div style={{ maxWidth: 280 }}>
          <Select name="language" options={LANGUAGES} defaultValue={profile.language ?? "en"} />
        </div>

        {profileMsg && (
          <p style={{ color: profileMsg.startsWith("Error") ? "#EF4444" : "#22C55E", fontSize: 13, marginTop: 12 }}>
            {profileMsg}
          </p>
        )}

        <Button type="submit" disabled={isPending} className="mt-6" style={{ maxWidth: 200, marginTop: 24 }}>
          {isPending ? "Saving…" : "SAVE CHANGES"}
        </Button>
      </form>

      {/* Security */}
      <h2 style={{ fontSize: 20, fontWeight: 600, margin: "40px 0 16px" }}>Security</h2>
      <Button variant="secondary" onClick={() => setShowPasswordModal(true)}>
        CHANGE PASSWORD
      </Button>

      {/* Administration */}
      <h2 style={{ fontSize: 20, fontWeight: 600, margin: "40px 0 16px" }}>Administration</h2>
      <button
        onClick={() => setShowDeleteModal(true)}
        style={{
          padding: "12px 24px", background: "#EF4444", color: "white",
          border: "none", borderRadius: 8, fontWeight: 600, fontSize: 13,
          letterSpacing: "0.05em", cursor: "pointer",
        }}
      >
        DELETE MY PROFILE
      </button>

      {/* Avatar crop modal */}
      {cropFile && (
        <AvatarCropModal
          file={cropFile}
          onApply={handleCropApply}
          onCancel={() => setCropFile(null)}
        />
      )}

      {/* Change password modal */}
      <Modal open={showPasswordModal} onClose={() => setShowPasswordModal(false)} title="Change Password">
        <form onSubmit={handlePasswordSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Input label="New password"     name="password" type="password" placeholder="Min. 8 characters" required />
          <Input label="Confirm password" name="confirm"  type="password" placeholder="Repeat password"   required />
          {passwordMsg && <p style={{ fontSize: 13, color: passwordMsg.includes("Error") ? "#EF4444" : "#22C55E" }}>{passwordMsg}</p>}
          <Button type="submit" disabled={isPending}>{isPending ? "Updating…" : "UPDATE PASSWORD"}</Button>
        </form>
      </Modal>

      {/* Delete account modal */}
      <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Account">
        <p style={{ color: "#475569", fontSize: 14, textAlign: "center", marginBottom: 24 }}>
          This action is permanent and cannot be undone. All your wishlists and wishes will be deleted.
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} className="flex-1">
            Cancel
          </Button>
          <button
            onClick={() => startTransition(() => deleteAccount())}
            style={{
              flex: 1, padding: "12px", background: "#EF4444", color: "white",
              border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer",
            }}
          >
            {isPending ? "Deleting…" : "DELETE"}
          </button>
        </div>
      </Modal>

    </main>
  )
}

// ── Creator section ──────────────────────────────────────────────
function CreatorSection({
  eligibility, checked, onToggle, message,
}: {
  eligibility: CreatorEligibility | null
  checked: boolean
  onToggle: (next: boolean) => void
  message: string
}) {
  if (!eligibility) {
    return (
      <p style={{ fontSize: 13, color: "#94A3B8" }}>
        Couldn't load Creator status. Refresh the page to try again.
      </p>
    )
  }

  const { eligible, public_wishlist_count, has_avatar, required_public_wishlists } = eligibility
  const canToggleOn = eligible || checked

  return (
    <div style={{
      background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12,
      padding: 16,
    }}>
      <Toggle
        checked={checked}
        onChange={canToggleOn ? onToggle : () => {}}
        label="Show my profile in Creators"
        description="Your profile will appear on the Inspiration → Creators page so anyone can discover your public wishlists."
      />

      {!eligible && !checked && (
        <div style={{
          marginTop: 12, padding: "10px 12px",
          background: "#FEF3C7", borderRadius: 8,
          fontSize: 12, color: "#78350F", lineHeight: 1.5,
        }}>
          <strong style={{ display: "block", marginBottom: 4 }}>
            Not eligible yet — finish these to unlock:
          </strong>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {!has_avatar && <li>Upload a profile photo.</li>}
            {public_wishlist_count < required_public_wishlists && (
              <li>
                Create {required_public_wishlists - public_wishlist_count} more
                public wishlist{required_public_wishlists - public_wishlist_count === 1 ? "" : "s"}
                {" "}
                (you have {public_wishlist_count}).
                {" "}
                <Link href="/dashboard" style={{ color: "#0F172A", textDecoration: "underline" }}>
                  Manage wishlists
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}

      {message && (
        <p style={{
          marginTop: 10, fontSize: 12,
          color: message.startsWith("You're") || message.startsWith("Creator mode") ? "#059669" : "#DC2626",
        }}>
          {message}
        </p>
      )}
    </div>
  )
}

// ── Avatar crop modal ────────────────────────────────────────────
function AvatarCropModal({ file, onApply, onCancel }: {
  file: File
  onApply: (blob: Blob) => void
  onCancel: () => void
}) {
  const PREVIEW = 240
  const OUTPUT  = 512
  const imgRef  = useRef<HTMLImageElement>(null)
  const [src]   = useState(() => URL.createObjectURL(file))
  const [scale, setScale]   = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const dragging = useRef(false)
  const dragStart = useRef({ mx: 0, my: 0, ox: 0, oy: 0 })

  function onMouseDown(e: React.MouseEvent) {
    dragging.current = true
    dragStart.current = { mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y }
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!dragging.current) return
    setOffset({
      x: dragStart.current.ox + (e.clientX - dragStart.current.mx),
      y: dragStart.current.oy + (e.clientY - dragStart.current.my),
    })
  }
  function onMouseUp() { dragging.current = false }

  function handleApply() {
    const img = imgRef.current
    if (!img) return
    const canvas = document.createElement("canvas")
    canvas.width = OUTPUT
    canvas.height = OUTPUT
    const ctx = canvas.getContext("2d")!

    // Reproduce the CSS transform on canvas:
    // objectFit:cover baseline: scale image so shorter side = PREVIEW
    const baseScale = Math.max(PREVIEW / img.naturalWidth, PREVIEW / img.naturalHeight)
    const totalScale = baseScale * scale
    const drawW = img.naturalWidth  * totalScale * (OUTPUT / PREVIEW)
    const drawH = img.naturalHeight * totalScale * (OUTPUT / PREVIEW)
    const drawX = (OUTPUT - drawW) / 2 + offset.x * (OUTPUT / PREVIEW)
    const drawY = (OUTPUT - drawH) / 2 + offset.y * (OUTPUT / PREVIEW)

    ctx.save()
    ctx.arc(OUTPUT / 2, OUTPUT / 2, OUTPUT / 2, 0, Math.PI * 2)
    ctx.clip()
    ctx.drawImage(img, drawX, drawY, drawW, drawH)
    ctx.restore()

    canvas.toBlob((blob) => { if (blob) onApply(blob) }, "image/jpeg", 0.92)
  }

  return (
    <>
      <div onClick={onCancel} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 600, backdropFilter: "blur(4px)" }} />
      <div style={{
        position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        zIndex: 601, background: "white", borderRadius: 20, padding: "28px 28px 24px",
        width: "calc(100% - 32px)", maxWidth: 360,
        boxShadow: "0 24px 64px rgba(0,0,0,0.25)",
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", margin: "0 0 6px" }}>Adjust photo</h2>
        <p style={{ fontSize: 13, color: "#94A3B8", margin: "0 0 20px" }}>Drag to reposition · Scroll or slide to zoom</p>

        {/* Circle preview */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
          <div
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onWheel={(e) => setScale(s => Math.min(4, Math.max(0.5, s - e.deltaY * 0.001)))}
            style={{
              width: PREVIEW, height: PREVIEW, borderRadius: "50%",
              overflow: "hidden", cursor: "grab",
              border: "3px solid #38A3C7",
              boxShadow: "0 0 0 4px #E0F4FA",
              userSelect: "none", position: "relative",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={src}
              alt=""
              draggable={false}
              style={{
                position: "absolute",
                width: "100%", height: "100%",
                objectFit: "cover",
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                transformOrigin: "center",
                pointerEvents: "none",
              }}
            />
          </div>
        </div>

        {/* Zoom slider */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 12, color: "#64748B", display: "block", marginBottom: 6 }}>Zoom</label>
          <input
            type="range" min={0.5} max={4} step={0.02} value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            style={{ width: "100%", accentColor: "#38A3C7" }}
          />
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onCancel}
            style={{ flex: 1, padding: "12px", borderRadius: 10, border: "1px solid #E2E8F0", background: "white", fontWeight: 600, fontSize: 13, cursor: "pointer", color: "#334155" }}
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            style={{ flex: 2, padding: "12px", borderRadius: 10, border: "none", background: "#38A3C7", color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
          >
            Apply Photo
          </button>
        </div>
      </div>
    </>
  )
}
