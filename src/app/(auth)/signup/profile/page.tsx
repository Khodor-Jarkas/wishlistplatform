"use client"

import { useState, useTransition } from "react"
import { setupProfile } from "@/lib/actions/auth"
import AuthPageLayout from "@/components/auth/AuthPageLayout"
import Input from "@/components/ui/Input"
import Select from "@/components/ui/Select"
import Button from "@/components/ui/Button"

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
].map((m, i) => ({ label: m, value: String(i + 1).padStart(2, "0") }))

const DAYS  = Array.from({ length: 31 }, (_, i) => ({ label: String(i + 1), value: String(i + 1).padStart(2, "0") }))
const YEARS = Array.from({ length: 100 }, (_, i) => { const y = new Date().getFullYear() - i; return { label: String(y), value: String(y) } })

const GENDERS = [
  { label: "Male",                value: "male"              },
  { label: "Female",              value: "female"            },
  { label: "Non-binary",          value: "non_binary"        },
  { label: "Prefer not to say",   value: "prefer_not_to_say" },
]

export default function ProfileSetupPage() {
  const [month, setMonth] = useState("")
  const [day,   setDay]   = useState("")
  const [year,  setYear]  = useState("")
  const [error, setError] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    const form = e.currentTarget
    const fd = new FormData(form)

    if (month && day && year) {
      fd.set("date_of_birth", `${year}-${month}-${day}`)
    }

    startTransition(async () => {
      const result = await setupProfile(fd)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <AuthPageLayout title="Create Account">
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Input label="First Name" name="first_name" placeholder="First Name" required />
          <Input label="Last Name"  name="last_name"  placeholder="Last Name"  required />
        </div>

        {/* Date of birth */}
        <div>
          <label style={{ fontSize: 14, fontWeight: 500, color: "#334155", display: "block", marginBottom: 8 }}>
            Date of birth
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <Select options={MONTHS} placeholder="Month" value={month} onChange={(e) => setMonth(e.target.value)} />
            <Select options={DAYS}   placeholder="Day"   value={day}   onChange={(e) => setDay(e.target.value)}   />
            <Select options={YEARS}  placeholder="Year"  value={year}  onChange={(e) => setYear(e.target.value)}  />
          </div>
        </div>

        <Select label="Gender" name="gender" options={GENDERS} placeholder="Select gender" />

        {error && <p style={{ color: "#EF4444", fontSize: 13, textAlign: "center" }}>{error}</p>}

        <Button type="submit" disabled={isPending} className="w-full" style={{ marginTop: 8, padding: "18px" }}>
          {isPending ? "Creating profile…" : "CREATE PROFILE"}
        </Button>

      </form>
    </AuthPageLayout>
  )
}
