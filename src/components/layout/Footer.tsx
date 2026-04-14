const socials = [
  { label: "Instagram", color: "#E1306C" },
  { label: "Facebook",  color: "#1877F2" },
  { label: "TikTok",    color: "#010101" },
  { label: "X",         color: "#1DA1F2" },
]

export default function Footer() {
  return (
    <footer style={{ background: "#38A3C7", color: "white", padding: "60px 0 40px" }}>
      <div className="container">

        {/* Main columns */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 40, flexWrap: "wrap" }}>

          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src="/surprise.png" width={48} height={48} alt="Wish It" />
            <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: "0.06em" }}>
              WISH IT
            </span>
          </div>

          {/* Customer Service */}
          <div>
            <h4 style={{ fontWeight: 700, marginBottom: 12, fontSize: 15 }}>
              Customer Service
            </h4>
            <p style={{ opacity: 0.85, fontSize: 14, marginBottom: 8 }}>wishit@gmail.com</p>
            <h4 style={{ fontWeight: 700, marginTop: 16, marginBottom: 8, fontSize: 15 }}>
              Advertisers
            </h4>
            <p style={{ opacity: 0.85, fontSize: 14 }}>Partnerships</p>
          </div>

          {/* Inspirations */}
          <div>
            <h4 style={{ fontWeight: 700, marginBottom: 12, fontSize: 15 }}>
              Inspirations
            </h4>
            {["Brands", "Events", "Gift Cards"].map((item) => (
              <p
                key={item}
                style={{ opacity: 0.85, fontSize: 14, marginBottom: 6, cursor: "pointer" }}
              >
                {item}
              </p>
            ))}
          </div>

          {/* Socials */}
          <div>
            <h4 style={{ fontWeight: 700, marginBottom: 12, fontSize: 15 }}>Socials</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {socials.map((s) => (
                <div
                  key={s.label}
                  title={s.label}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.25)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 0,
                  }}
                >
                  {s.label[0]}
                </div>
              ))}
            </div>
          </div>

          {/* App store placeholder */}
          <div
            style={{
              width: 160,
              height: 80,
              background: "rgba(255,255,255,0.15)",
              borderRadius: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              opacity: 0.7,
              border: "1px dashed rgba(255,255,255,0.4)",
            }}
          >
            App stores
          </div>

        </div>

        {/* Bottom bar */}
        <div
          style={{
            marginTop: 48,
            paddingTop: 24,
            borderTop: "1px solid rgba(255,255,255,0.2)",
            fontSize: 12,
            opacity: 0.7,
            textAlign: "center",
          }}
        >
          © {new Date().getFullYear()} Wish It. All rights reserved.
        </div>

      </div>
    </footer>
  )
}
