"use client"

import { useAuthModal } from "@/context/AuthModalContext"

export default function Hero() {
  const { openSignup } = useAuthModal()

  return (
    <section className="wi-hero">

      {/* Background circles */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: -120, right: -120, width: 500, height: 500, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <div style={{ position: "absolute", bottom: -80, left: -80, width: 360, height: 360, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
      </div>

      <div className="wi-hero-inner">

        {/* ── Left: copy ── */}
        <div className="wi-hero-copy">
          <span style={{
            display: "inline-block", marginBottom: 20,
            fontSize: 11, fontWeight: 700, letterSpacing: "0.14em",
            textTransform: "uppercase", opacity: 0.8,
            background: "rgba(255,255,255,0.15)", borderRadius: 20,
            padding: "6px 14px",
          }}>
            GET STARTED WITH WISH IT
          </span>

          <h1 style={{
            fontSize: "clamp(36px, 5vw, 58px)", fontWeight: 800,
            lineHeight: 1.1, marginBottom: 24, letterSpacing: "-0.02em",
          }}>
            All your wishes<br />in one place
          </h1>

          <p style={{
            fontSize: 18, opacity: 0.88, lineHeight: 1.7,
            maxWidth: 440, marginBottom: 40,
            marginLeft: "auto", marginRight: "auto",
          }}
            className="wi-hero-desc"
          >
            Wish It makes it easy for you to save and share all your wishes with friends and family — no more guessing, no more duplicate gifts.
          </p>

          <div className="wi-hero-cta-row">
            <button
              onClick={openSignup}
              style={{
                background: "#0F172A", color: "white",
                padding: "16px 32px", borderRadius: 12,
                fontWeight: 700, fontSize: 14,
                letterSpacing: "0.06em", border: "none", cursor: "pointer",
                boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.3)" }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.25)" }}
            >
              CREATE YOUR ACCOUNT
            </button>
            <span style={{ fontSize: 13, opacity: 0.75 }}>Free — no credit card needed</span>
          </div>

          {/* Trust stats */}
          <div className="wi-hero-stats">
            {[
              { value: "10K+", label: "Wishlists created" },
              { value: "50K+", label: "Wishes saved" },
              { value: "100%", label: "Free to use" },
            ].map(({ value, label }) => (
              <div key={label}>
                <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em" }}>{value}</div>
                <div style={{ fontSize: 13, opacity: 0.75, marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: floating wishlist preview — hidden on mobile via CSS ── */}
        <div className="wi-hero-visual">

          {/* Main card */}
          <div style={{
            background: "white", borderRadius: 20,
            boxShadow: "0 32px 80px rgba(0,0,0,0.22)",
            width: 300, padding: "20px",
            position: "absolute", left: "50%", top: "50%",
            transform: "translate(-50%, -50%) rotate(-2deg)",
            zIndex: 2,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#38A3C7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🎂</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>Birthday 2025</div>
                <div style={{ fontSize: 11, color: "#94A3B8" }}>8 wishes</div>
              </div>
            </div>
            {[
              { name: "AirPods Pro", price: "$249", color: "#F1F5F9" },
              { name: "Nike Sneakers", price: "$129", color: "#FEF3C7" },
              { name: "Book Bundle", price: "$45",  color: "#DCFCE7" },
            ].map((item) => (
              <div key={item.name} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 0", borderBottom: "1px solid #F1F5F9",
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: item.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#0F172A" }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: "#64748B" }}>{item.price}</div>
                </div>
                <div style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid #E2E8F0" }} />
              </div>
            ))}
          </div>

          {/* Back card — peeking */}
          <div style={{
            background: "white", borderRadius: 20,
            boxShadow: "0 16px 48px rgba(0,0,0,0.14)",
            width: 280, padding: "18px",
            position: "absolute", left: "50%", top: "50%",
            transform: "translate(-30%, -58%) rotate(5deg)",
            zIndex: 1,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "#FEF3C7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🎄</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>Christmas List</div>
                <div style={{ fontSize: 11, color: "#94A3B8" }}>12 wishes</div>
              </div>
            </div>
            {[
              { color: "#E0F4FA" }, { color: "#FEE2E2" }, { color: "#F3E8FF" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #F8FAFC" }}>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: item.color, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: 8, background: "#F1F5F9", borderRadius: 4, width: "70%" }} />
                  <div style={{ height: 6, background: "#F8FAFC", borderRadius: 4, width: "40%", marginTop: 5 }} />
                </div>
              </div>
            ))}
          </div>

          {/* Reserved badge floating */}
          <div style={{
            position: "absolute", right: "5%", bottom: "18%",
            background: "white", borderRadius: 12, padding: "10px 14px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.14)",
            display: "flex", alignItems: "center", gap: 8, zIndex: 3,
          }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "#DCFCE7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✓</div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#16A34A" }}>Reserved!</div>
              <div style={{ fontSize: 10, color: "#94A3B8" }}>AirPods Pro</div>
            </div>
          </div>

          {/* Share badge floating */}
          <div style={{
            position: "absolute", left: "2%", bottom: "22%",
            background: "white", borderRadius: 12, padding: "10px 14px",
            boxShadow: "0 8px 24px rgba(0,0,0,0.14)",
            display: "flex", alignItems: "center", gap: 8, zIndex: 3,
          }}>
            <div style={{ display: "flex" }}>
              {["#38A3C7","#F59E0B","#22C55E"].map((c, i) => (
                <div key={c} style={{ width: 22, height: 22, borderRadius: "50%", background: c, border: "2px solid white", marginLeft: i > 0 ? -6 : 0 }} />
              ))}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#0F172A" }}>3 friends following</div>
          </div>

        </div>
      </div>
    </section>
  )
}
