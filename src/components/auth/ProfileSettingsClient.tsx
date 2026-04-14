"use client"

import { useState, useTransition } from "react"
import { updateProfile, changePassword, deleteAccount } from "@/lib/actions/auth"
import type { Profile } from "@/types"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import Toggle from "@/components/ui/Toggle"
import Modal from "@/components/ui/Modal"
import Button from "@/components/ui/Button"

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"]
  .map((m, i) => ({ label: m, value: String(i + 1).padStart(2, "0") }))
const DAYS  = Array.from({ length: 31 }, (_, i) => ({ label: String(i + 1), value: String(i + 1).padStart(2, "0") }))
const YEARS = Array.from({ length: 100 }, (_, i) => { const y = new Date().getFullYear() - i; return { label: String(y), value: String(y) } })
const GENDERS = [
  { label: "Male", value: "male" }, { label: "Female", value: "female" },
  { label: "Non-binary", value: "non_binary" }, { label: "Prefer not to say", value: "prefer_not_to_say" },
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
}

export default function ProfileSettingsClient({ profile, email }: Props) {
  const dob = profile.date_of_birth?.split("-") ?? []
  const [isPrivate, setIsPrivate] = useState(profile.is_private ?? false)
  const [dobMonth, setDobMonth] = useState(dob[1] ?? "")
  const [dobDay,   setDobDay]   = useState(dob[2] ?? "")
  const [dobYear,  setDobYear]  = useState(dob[0] ?? "")

  const [profileMsg,  setProfileMsg]  = useState("")
  const [passwordMsg, setPasswordMsg] = useState("")
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleProfileSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    if (dobMonth && dobDay && dobYear) fd.set("date_of_birth", `${dobYear}-${dobMonth}-${dobDay}`)
    fd.set("is_private", String(isPrivate))
    startTransition(async () => {
      const result = await updateProfile(fd)
      setProfileMsg(result?.error ? `Error: ${result.error}` : "Profile saved.")
      setTimeout(() => setProfileMsg(""), 3000)
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
    <main style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px 80px" }}>

      {/* Avatar + name */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%", background: "#38A3C7",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white", fontWeight: 700, fontSize: 22,
        }}>
          {(profile.first_name?.[0] ?? profile.username?.[0] ?? "?").toUpperCase()}
          {(profile.last_name?.[0] ?? "").toUpperCase()}
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, margin: 0 }}>
          {profile.full_name ?? profile.username}
        </h1>
      </div>

      <form onSubmit={handleProfileSubmit} style={{ display: "flex", flexDirection: "column", gap: 0 }}>

        {/* Personal */}
        {section("Personal")}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
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

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
          <Select label="Gender" name="gender" options={GENDERS} placeholder="Select gender" defaultValue={profile.gender ?? ""} />
          <Input  label="Email"  name="email"  type="email" value={email} readOnly style={{ background: "#F8FAFC", color: "#64748B" }} />
        </div>

        {/* Phone */}
        <div style={{ marginTop: 16 }}>
          <Input label="Phone number" name="phone" type="tel" defaultValue={profile.phone ?? ""} placeholder="71 111 222" />
        </div>

        {/* Location */}
        {section("Location")}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <Input label="Zip Code"        name="zip_code" defaultValue={profile.zip_code ?? ""} placeholder="Zip Code" />
          <Input label="Country / Region" name="country"  defaultValue={profile.country  ?? ""} placeholder="Country"  />
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
