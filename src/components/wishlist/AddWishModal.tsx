"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { createClient } from "@/lib/supabase/client"
import { createWish, scrapeProductUrl } from "@/lib/actions/wishes"
import { useAddWishModal } from "@/context/AddWishModalContext"

const CURRENCIES = ["USD", "EUR", "GBP", "LBP", "AED", "SAR"]

interface Wishlist { id: string; title: string }

export default function AddWishModal() {
  const { isOpen, close, defaultWishlistId } = useAddWishModal()

  const [step, setStep]                 = useState<"link" | "manual">("link")
  const [wishlists, setWishlists]       = useState<Wishlist[]>([])
  const [wishlistId, setWishlistId]     = useState("")
  const [isMostWanted, setIsMostWanted] = useState(false)
  const [currency, setCurrency]         = useState("USD")
  const [quantity, setQuantity]         = useState(1)
  const [imageUrl, setImageUrl]         = useState("")
  const [imagePreview, setImagePreview] = useState("")
  const [uploading, setUploading]       = useState(false)
  const [linkValue, setLinkValue]       = useState("")
  const [productUrl, setProductUrl]     = useState("")
  // Controlled pre-fillable fields
  const [title, setTitle]               = useState("")
  const [description, setDescription]   = useState("")
  const [priceValue, setPriceValue]     = useState("")
  // Scraping state
  const [scraping, setScraping]         = useState(false)
  const [scrapeError, setScrapeError]   = useState("")
  const [error, setError]               = useState("")
  const [isPending, start]              = useTransition()
  const pasteRef = useRef<HTMLInputElement>(null)

  // Reset when modal opens
  useEffect(() => {
    if (!isOpen) return
    setStep("link")
    setIsMostWanted(false)
    setCurrency("USD")
    setQuantity(1)
    setImageUrl("")
    setImagePreview("")
    setLinkValue("")
    setProductUrl("")
    setTitle("")
    setDescription("")
    setPriceValue("")
    setScraping(false)
    setScrapeError("")
    setError("")

    // Fetch user's wishlists
    ;(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from("wishlists")
        .select("id, title")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
      if (data) {
        setWishlists(data)
        // Pre-select the wishlist the user opened the modal from, or default to first
        const preferred = defaultWishlistId && data.find((w) => w.id === defaultWishlistId)
        setWishlistId(preferred ? preferred.id : (data[0]?.id ?? ""))
      }
    })()
  }, [isOpen, defaultWishlistId])

  async function handleContinueFromLink() {
    const url = linkValue.trim()
    if (!url) {
      setStep("manual")
      return
    }

    setScraping(true)
    setScrapeError("")
    setProductUrl(url)

    const result = await scrapeProductUrl(url)
    setScraping(false)

    if (result.error) {
      setScrapeError(result.error)
      // Still proceed to manual so the user can fill in fields
      setStep("manual")
      return
    }

    if (result.title)       setTitle(result.title)
    if (result.description) setDescription(result.description)
    if (result.price != null) setPriceValue(String(result.price))
    if (result.currency)    setCurrency(result.currency)
    if (result.image) {
      setImageUrl(result.image)
      setImagePreview(result.image)
    }

    setStep("manual")
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setUploading(false); return }
    const ext  = file.name.split(".").pop()
    const path = `${user.id}/wish-${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from("wishlist-covers").upload(path, file, { upsert: true })
    if (uploadError) { setError("Upload failed: " + uploadError.message); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from("wishlist-covers").getPublicUrl(path)
    setImageUrl(publicUrl)
    setImagePreview(URL.createObjectURL(file))
    setUploading(false)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    const fd = new FormData(e.currentTarget)
    fd.set("wishlist_id", wishlistId)
    fd.set("is_most_wanted", String(isMostWanted))
    fd.set("currency", currency)
    fd.set("quantity", String(quantity))
    fd.set("url", productUrl)
    if (imageUrl) fd.set("image_url", imageUrl)
    start(async () => {
      const res = await createWish(fd)
      if (res?.error) { setError(res.error); return }
      close()
    })
  }

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText()
      setLinkValue(text)
    } catch {
      pasteRef.current?.focus()
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={close}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
          zIndex: 500, backdropFilter: "blur(2px)",
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 501,
          background: "white",
          borderRadius: 16,
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          width: step === "link" ? "min(480px, 95vw)" : "min(860px, 95vw)",
          maxHeight: "90vh",
          overflowY: "auto",
          transition: "width 0.25s ease",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px 0",
        }}>
          {step === "manual" ? (
            <button
              onClick={() => setStep("link")}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#64748B", lineHeight: 1 }}
            >
              ‹
            </button>
          ) : (
            <div style={{ width: 28 }} />
          )}
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#0F172A" }}>Add wish</h2>
          <button
            onClick={close}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#64748B", lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {/* ── Step 1: Link ── */}
        {step === "link" && (
          <div style={{ padding: "24px 24px 28px" }}>
            {/* URL input */}
            <div style={{
              display: "flex", alignItems: "center",
              border: "1.5px solid #38A3C7", borderRadius: 10,
              background: "#F0F9FF", overflow: "hidden", marginBottom: 16,
            }}>
              <svg width="18" height="18" fill="none" stroke="#94A3B8" strokeWidth="1.5" viewBox="0 0 24 24"
                style={{ flexShrink: 0, margin: "0 12px" }}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
              </svg>
              <input
                ref={pasteRef}
                value={linkValue}
                onChange={(e) => setLinkValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleContinueFromLink() } }}
                placeholder="Insert product link"
                style={{
                  flex: 1, border: "none", background: "transparent",
                  fontSize: 14, color: "#0F172A", outline: "none", padding: "14px 0",
                }}
              />
              <button
                onClick={handlePaste}
                style={{
                  background: "#38A3C7", border: "none", color: "white",
                  fontWeight: 700, fontSize: 12, letterSpacing: "0.06em",
                  padding: "14px 18px", cursor: "pointer", flexShrink: 0,
                }}
              >
                PASTE
              </button>
            </div>

            {scrapeError && (
              <p style={{ color: "#F59E0B", fontSize: 12, margin: "0 0 12px" }}>
                ⚠ {scrapeError}
              </p>
            )}

            {/* Primary: Continue button */}
            <button
              onClick={handleContinueFromLink}
              disabled={scraping}
              style={{
                width: "100%", padding: "14px", borderRadius: 10, border: "none",
                background: scraping ? "#94A3B8" : "linear-gradient(135deg, #38A3C7, #2980b9)",
                color: "white", fontWeight: 700, fontSize: 14, letterSpacing: "0.06em",
                cursor: scraping ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {scraping ? (
                <>
                  <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span>
                  Fetching details…
                </>
              ) : "Continue →"}
            </button>

            {/* Secondary: skip to manual */}
            <div style={{ textAlign: "center", marginTop: 14 }}>
              <button
                onClick={() => { setProductUrl(linkValue); setStep("manual") }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B", fontSize: 13 }}
              >
                or fill in manually
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Manual form ── */}
        {step === "manual" && (
          <form onSubmit={handleSubmit} style={{ padding: "20px 24px 28px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>

              {/* Left column */}
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

                {/* Choose wishlist */}
                <div>
                  <label style={labelStyle}>Choose wishlist</label>
                  <div style={{ position: "relative" }}>
                    <select
                      value={wishlistId}
                      onChange={(e) => setWishlistId(e.target.value)}
                      style={selectStyle}
                      required
                    >
                      {wishlists.map((w) => (
                        <option key={w.id} value={w.id}>{w.title}</option>
                      ))}
                    </select>
                    <svg width="16" height="16" fill="none" stroke="#64748B" strokeWidth="1.5" viewBox="0 0 24 24"
                      style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </div>

                {/* Name wish */}
                <div>
                  <label style={labelStyle}>Name wish</label>
                  <input
                    name="title"
                    required
                    placeholder="Enter wish name"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
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
                      Most Wanted{" "}
                      <span style={{ color: "#38A3C7" }}>★</span>
                    </div>
                    <div style={{ fontSize: 12, color: "#64748B", lineHeight: 1.5 }}>
                      Most wanted gifts are marked{" "}
                      <span style={{ color: "#F59E0B" }}>to let your friends</span>
                      {" "}know which gifts you love the most
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
                    placeholder="Enter a description"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
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
                        placeholder="0"
                        value={priceValue}
                        onChange={(e) => setPriceValue(e.target.value)}
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

                {/* Image upload / preview */}
                <label
                  htmlFor="wish-image-upload"
                  style={{
                    flex: 1, minHeight: 220,
                    border: "2px dashed #CBD5E1", borderRadius: 12,
                    background: imagePreview ? "transparent" : "#F8FAFC",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    gap: 10, cursor: uploading ? "wait" : "pointer", overflow: "hidden", position: "relative",
                  }}
                >
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Product" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setImageUrl(""); setImagePreview("") }}
                        style={{
                          position: "absolute", top: 6, right: 6,
                          width: 24, height: 24, borderRadius: "50%",
                          background: "rgba(0,0,0,0.55)", border: "none",
                          color: "white", fontSize: 13, cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}
                      >
                        ×
                      </button>
                    </>
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
                <input id="wish-image-upload" type="file" accept="image/*" style={{ display: "none" }} onChange={handleImageUpload} />

                {/* Link to product */}
                <div>
                  <label style={labelStyle}>Link to product</label>
                  <div style={{ display: "flex", alignItems: "center", border: "1px solid #E2E8F0", borderRadius: 8, background: "#F8FAFC", overflow: "hidden" }}>
                    <svg width="16" height="16" fill="none" stroke="#94A3B8" strokeWidth="1.5" viewBox="0 0 24 24" style={{ flexShrink: 0, margin: "0 10px" }}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                    </svg>
                    <input
                      value={productUrl}
                      onChange={(e) => setProductUrl(e.target.value)}
                      placeholder="Insert product link"
                      style={{ flex: 1, border: "none", background: "transparent", outline: "none", padding: "11px 8px 11px 0", fontSize: 13, color: "#0F172A" }}
                    />
                  </div>
                </div>

                {error && (
                  <p style={{ color: "#EF4444", fontSize: 13, margin: 0 }}>{error}</p>
                )}

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
                  {isPending ? "Adding…" : "ADD WISH"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
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

const selectStyle: React.CSSProperties = {
  width: "100%", padding: "11px 36px 11px 13px", borderRadius: 8,
  border: "1px solid #E2E8F0", fontSize: 14, color: "#0F172A",
  outline: "none", background: "white", appearance: "none", cursor: "pointer",
}
