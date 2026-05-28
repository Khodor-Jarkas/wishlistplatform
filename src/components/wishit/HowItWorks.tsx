"use client"

import { useAuthModal } from "@/context/AuthModalContext"

const steps = [
  {
    number: "01",
    title: "Create wishes & wishlists",
    description: "Add anything you want — paste a link and we'll fill in the details automatically. Organise wishes into lists for any occasion: birthday, wedding, Christmas, and more.",
    flip: false,
    accent: "#38A3C7",
    preview: <CreatePreview />,
  },
  {
    number: "02",
    title: "Share with friends & family",
    description: "Send your wishlist link to anyone. They can browse your wishes, see what's already been reserved, and pick the perfect gift — no account required to view.",
    flip: true,
    accent: "#8B5CF6",
    preview: <SharePreview />,
  },
  {
    number: "03",
    title: "No more duplicate gifts",
    description: "Friends can secretly reserve wishes before buying. You'll never know who's getting what — just that someone has it covered. No more three people buying the same thing.",
    flip: false,
    accent: "#22C55E",
    preview: <ReservePreview />,
  },
]

export default function HowItWorks() {
  const { openSignup } = useAuthModal()

  return (
    <>
      {/* ── How it works — responsive via CSS classes ── */}
      <section className="wi-hiw-section">
        <div className="wi-hiw-inner">

          <div className="wi-hiw-header">
            <span style={{
              display: "inline-block", marginBottom: 16,
              fontSize: 11, fontWeight: 700, letterSpacing: "0.14em",
              textTransform: "uppercase", color: "#38A3C7",
              background: "#E0F4FA", borderRadius: 20, padding: "6px 14px",
            }}>
              HOW IT WORKS
            </span>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 800, color: "#0F172A", letterSpacing: "-0.02em", margin: 0 }}>
              Simple. Thoughtful. Delightful.
            </h2>
          </div>

          <div className="wi-hiw-steps">
            {steps.map((step) => (
              <div
                key={step.title}
                className={`wi-hiw-step${step.flip ? " wi-hiw-step-reverse" : ""}`}
              >
                {/* Illustration */}
                <div style={{
                  direction: "ltr",
                  background: "linear-gradient(135deg, #F8FAFC, #F1F5F9)",
                  borderRadius: 24,
                  height: 340,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "1px solid #E2E8F0",
                  overflow: "hidden",
                  position: "relative",
                }}>
                  {step.preview}
                </div>

                {/* Text */}
                <div style={{ direction: "ltr" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: step.accent, letterSpacing: "0.06em" }}>
                    STEP {step.number}
                  </span>
                  <h3 style={{ fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 800, color: "#0F172A", margin: "12px 0 16px", letterSpacing: "-0.02em", lineHeight: 1.2 }}>
                    {step.title}
                  </h3>
                  <p style={{ color: "#475569", lineHeight: 1.75, fontSize: "clamp(15px, 2vw, 16px)", margin: 0 }}>
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section style={{
        background: "linear-gradient(135deg, #1E8FAD, #38A3C7)",
        padding: "clamp(56px, 8vw, 80px) clamp(20px, 4vw, 32px)",
        textAlign: "center", color: "white",
      }}>
        <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, marginBottom: 16, letterSpacing: "-0.02em" }}>
          Ready to make gifting easy?
        </h2>
        <p style={{ fontSize: 17, opacity: 0.88, marginBottom: 36, maxWidth: 480, margin: "0 auto 36px" }}>
          Create your first wishlist in seconds — it&apos;s completely free.
        </p>
        <button
          onClick={openSignup}
          style={{
            background: "white", color: "#0F172A",
            padding: "16px 36px", borderRadius: 12,
            fontWeight: 700, fontSize: 15,
            letterSpacing: "0.04em", border: "none", cursor: "pointer",
            boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            transition: "transform 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
          onMouseLeave={e => e.currentTarget.style.transform = ""}
        >
          GET STARTED FOR FREE
        </button>
      </section>
    </>
  )
}

// ── Step previews ────────────────────────────────────────────────────────────

function CreatePreview() {
  return (
    <div style={{ padding: 28, width: "100%" }}>
      <div style={{ background: "white", borderRadius: 16, padding: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", marginBottom: 14 }}>New Wish</div>
        <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "10px 12px", marginBottom: 10, display: "flex", alignItems: "center", gap: 8, border: "1px solid #E2E8F0" }}>
          <div style={{ width: 14, height: 14, borderRadius: 3, background: "#CBD5E1" }} />
          <div style={{ height: 8, background: "#E2E8F0", borderRadius: 4, flex: 1 }} />
        </div>
        {[
          { label: "Title", width: "80%", color: "#0F172A", bg: "#F8FAFC" },
          { label: "Price", width: "40%", color: "#38A3C7", bg: "#E0F4FA" },
        ].map((f) => (
          <div key={f.label} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: "#94A3B8", marginBottom: 4 }}>{f.label}</div>
            <div style={{ height: 36, background: f.bg, borderRadius: 8, border: "1px solid #E2E8F0", display: "flex", alignItems: "center", padding: "0 12px" }}>
              <div style={{ height: 8, background: f.color === "#0F172A" ? "#CBD5E1" : f.color, borderRadius: 4, width: f.width, opacity: 0.6 }} />
            </div>
          </div>
        ))}
        <div style={{ marginTop: 14, background: "#0F172A", color: "white", borderRadius: 8, padding: "10px", textAlign: "center", fontSize: 12, fontWeight: 700 }}>
          ADD WISH
        </div>
      </div>
    </div>
  )
}

function SharePreview() {
  return (
    <div style={{ padding: 28, width: "100%" }}>
      <div style={{ background: "white", borderRadius: 16, padding: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#E0F4FA", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🎂</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>Birthday 2025</div>
            <div style={{ fontSize: 11, color: "#94A3B8" }}>8 wishes</div>
          </div>
          <div style={{ marginLeft: "auto", background: "#F1F5F9", borderRadius: 8, padding: "6px 12px", fontSize: 11, fontWeight: 600, color: "#334155" }}>🔗 Share</div>
        </div>
        <div style={{ background: "#F8FAFC", borderRadius: 10, padding: "12px", marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 6 }}>Share link copied!</div>
          <div style={{ background: "#E0F4FA", borderRadius: 6, padding: "8px 10px", fontSize: 10, color: "#1E6B88", fontFamily: "monospace" }}>
            wish-it.vercel.app/wishlists/...
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
          <div style={{ display: "flex" }}>
            {["#38A3C7", "#F59E0B", "#22C55E", "#8B5CF6"].map((c, i) => (
              <div key={c} style={{ width: 26, height: 26, borderRadius: "50%", background: c, border: "2px solid white", marginLeft: i > 0 ? -8 : 0 }} />
            ))}
          </div>
          <div style={{ fontSize: 12, color: "#64748B" }}>4 friends following</div>
        </div>
      </div>
    </div>
  )
}

function ReservePreview() {
  return (
    <div style={{ padding: 28, width: "100%" }}>
      <div style={{ background: "white", borderRadius: 16, padding: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#0F172A", marginBottom: 14 }}>Birthday 2025</div>
        {[
          { name: "AirPods Pro",   price: "$249", reserved: true,  color: "#E0F4FA" },
          { name: "Nike Sneakers", price: "$129", reserved: false, color: "#FEF3C7" },
          { name: "Book Bundle",   price: "$45",  reserved: true,  color: "#DCFCE7" },
        ].map((item) => (
          <div key={item.name} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 0", borderBottom: "1px solid #F8FAFC",
            opacity: item.reserved ? 0.55 : 1,
          }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: item.color, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{item.name}</div>
              <div style={{ fontSize: 11, color: "#64748B" }}>{item.price}</div>
            </div>
            {item.reserved ? (
              <div style={{ fontSize: 10, fontWeight: 700, color: "#16A34A", background: "#DCFCE7", borderRadius: 6, padding: "3px 8px" }}>Reserved</div>
            ) : (
              <div style={{ fontSize: 10, fontWeight: 700, color: "#38A3C7", background: "#E0F4FA", borderRadius: 6, padding: "3px 8px", cursor: "pointer" }}>Reserve</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
