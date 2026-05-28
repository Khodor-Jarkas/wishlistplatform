"use client"

import { useState, useTransition } from "react"
import { getAIGiftRecommendations } from "@/lib/actions/inspire"
import type { GiftFinderForm, GiftRecommendation } from "@/lib/actions/inspire"
import GiftWishCard from "@/components/inspire/GiftWishCard"
import { COUNTRIES } from "@/lib/countries"

const OCCASIONS = [
  "Birthday", "Christmas", "Wedding", "Baby Shower",
  "Graduation", "Anniversary", "Valentine's Day",
  "Mother's Day", "Father's Day", "Other",
]

export default function AIGiftFinder() {
  const [open, setOpen]       = useState(false)
  const [results, setResults] = useState<GiftRecommendation[] | null>(null)
  const [error, setError]     = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const [form, setForm] = useState<GiftFinderForm>({
    recipientAge:    "",
    recipientGender: "",
    country:         "",
    city:            "",
    occasion:        "",
    budgetMin:       "",
    budgetMax:       "",
    interests:       "",
  })

  function set(field: keyof GiftFinderForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setResults(null)
    startTransition(async () => {
      const { recommendations, error: err } = await getAIGiftRecommendations(form)
      if (err)                               setError(err)
      else if (recommendations.length === 0) setError("No recommendations returned. Please try again.")
      else                                   setResults(recommendations)
    })
  }

  return (
    <section id="ai-finder" style={{
      background: "white", borderRadius: 16, padding: "40px 32px",
      boxShadow: "0 2px 16px rgba(0,0,0,0.06)", border: "1px solid #E2E8F0",
    }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: open || results ? 28 : 0 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0F172A" }}>
            AI Gift Finder
          </h2>
          <p style={{ margin: "6px 0 0", fontSize: 14, color: "#64748B", maxWidth: 480 }}>
            Tell us about the person you&apos;re buying for and we&apos;ll suggest the perfect gifts — powered by what people are actually wishing for.
          </p>
        </div>
        {!open && !results && (
          <button
            onClick={() => setOpen(true)}
            style={{
              background: "#0F172A", color: "white", border: "none", borderRadius: 8,
              padding: "10px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer",
              letterSpacing: "0.03em", whiteSpace: "nowrap",
            }}
          >
            Find Gifts
          </button>
        )}
      </div>

      {/* Form */}
      {(open || results) && (
        <>
          <form onSubmit={handleSubmit}>

            {/* Row 1: Recipient info */}
            <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              About the recipient
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>

              <Field label="Age">
                <input
                  type="number" min={1} max={120} placeholder="e.g. 28"
                  value={form.recipientAge}
                  onChange={(e) => set("recipientAge", e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#38A3C7")}
                  onBlur={(e)  => (e.currentTarget.style.borderColor = "#E2E8F0")}
                />
              </Field>

              <Field label="Gender">
                <select
                  value={form.recipientGender}
                  onChange={(e) => set("recipientGender", e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#38A3C7")}
                  onBlur={(e)  => (e.currentTarget.style.borderColor = "#E2E8F0")}
                >
                  <option value="">Not specified</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </Field>

              <Field label="Occasion">
                <select
                  value={form.occasion}
                  onChange={(e) => set("occasion", e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#38A3C7")}
                  onBlur={(e)  => (e.currentTarget.style.borderColor = "#E2E8F0")}
                >
                  <option value="">General gift</option>
                  {OCCASIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </Field>

            </div>

            {/* Row 2: Location */}
            <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Location
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>

              <Field label="Country">
                <select
                  value={form.country}
                  onChange={(e) => set("country", e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#38A3C7")}
                  onBlur={(e)  => (e.currentTarget.style.borderColor = "#E2E8F0")}
                >
                  <option value="">Select country…</option>
                  {COUNTRIES.map((c) => (
                    <option key={c.value} value={c.label}>{c.label}</option>
                  ))}
                </select>
              </Field>

              <Field label="City">
                <input
                  type="text" placeholder="e.g. Beirut"
                  value={form.city}
                  onChange={(e) => set("city", e.target.value)}
                  style={inputStyle}
                  onFocus={(e) => (e.currentTarget.style.borderColor = "#38A3C7")}
                  onBlur={(e)  => (e.currentTarget.style.borderColor = "#E2E8F0")}
                />
              </Field>

            </div>

            {/* Row 3: Budget */}
            <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Budget (USD)
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 20 }}>

              <Field label="Min">
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94A3B8", fontSize: 14, pointerEvents: "none" }}>$</span>
                  <input
                    type="number" min={0} placeholder="0"
                    value={form.budgetMin}
                    onChange={(e) => set("budgetMin", e.target.value)}
                    style={{ ...inputStyle, paddingLeft: 26 }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#38A3C7")}
                    onBlur={(e)  => (e.currentTarget.style.borderColor = "#E2E8F0")}
                  />
                </div>
              </Field>

              <Field label="Max">
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94A3B8", fontSize: 14, pointerEvents: "none" }}>$</span>
                  <input
                    type="number" min={0} placeholder="200"
                    value={form.budgetMax}
                    onChange={(e) => set("budgetMax", e.target.value)}
                    style={{ ...inputStyle, paddingLeft: 26 }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "#38A3C7")}
                    onBlur={(e)  => (e.currentTarget.style.borderColor = "#E2E8F0")}
                  />
                </div>
              </Field>

            </div>

            {/* Row 4: Interests */}
            <p style={{ margin: "0 0 10px", fontSize: 11, fontWeight: 700, color: "#94A3B8", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Interests &amp; hobbies
            </p>
            <input
              type="text"
              placeholder="e.g. hiking, cooking, photography, gaming…"
              value={form.interests}
              onChange={(e) => set("interests", e.target.value)}
              style={{ ...inputStyle, width: "100%", boxSizing: "border-box", marginBottom: 24 }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#38A3C7")}
              onBlur={(e)  => (e.currentTarget.style.borderColor = "#E2E8F0")}
            />

            {/* Actions */}
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <button
                type="submit"
                disabled={isPending}
                style={{
                  background: isPending ? "#94A3B8" : "#38A3C7",
                  color: "white", border: "none", borderRadius: 8,
                  padding: "11px 28px", fontSize: 14, fontWeight: 600,
                  cursor: isPending ? "not-allowed" : "pointer",
                  letterSpacing: "0.03em",
                  transition: "background 0.15s",
                }}
              >
                {isPending ? "Finding gifts…" : results ? "Search again" : "Find gifts"}
              </button>
              <button
                type="button"
                onClick={() => { setOpen(false); setResults(null); setError(null) }}
                style={{
                  background: "transparent", border: "1px solid #E2E8F0", color: "#64748B",
                  borderRadius: 8, padding: "11px 20px", fontSize: 14, cursor: "pointer",
                  transition: "border-color 0.15s, color 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#CBD5E1"; e.currentTarget.style.color = "#475569" }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.color = "#64748B" }}
              >
                Cancel
              </button>
            </div>
          </form>

          {/* Error */}
          {error && (
            <p style={{ marginTop: 20, color: "#EF4444", fontSize: 14, background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: 8, padding: "10px 16px" }}>
              {error}
            </p>
          )}

          {/* Results */}
          {results && results.length > 0 && (
            <div style={{ marginTop: 40 }}>
              <h3 style={{ margin: "0 0 20px", fontSize: 17, fontWeight: 700, color: "#0F172A" }}>
                Gift recommendations for you
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 20 }}>
                {results.map((rec, i) => (
                  <GiftWishCard key={i} rec={rec} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{
        display: "block", fontSize: 12, fontWeight: 600, color: "#475569",
        marginBottom: 6, letterSpacing: "0.05em", textTransform: "uppercase",
      }}>
        {label}
      </label>
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  border: "1px solid #E2E8F0", borderRadius: 8,
  padding: "9px 12px", fontSize: 14, color: "#0F172A",
  background: "white", outline: "none",
  appearance: "auto",
  transition: "border-color 0.15s",
}
