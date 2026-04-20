import Container from "@/components/ui/Container"
import HelpClient from "@/components/help/HelpClient"

export const metadata = { title: "Help & Support" }

export default function HelpPage() {
  return (
    <main style={{ minHeight: "100vh", background: "#F8FAFC", paddingBottom: 80 }}>

      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 60%, #38A3C7 100%)",
        padding: "56px 0 48px",
        textAlign: "center",
      }}>
        <Container>
          <p style={{
            margin: "0 0 10px", fontSize: 13, fontWeight: 700,
            letterSpacing: "0.12em", textTransform: "uppercase", color: "#7DD3FC",
          }}>
            Help Center
          </p>
          <h1 style={{
            margin: "0 0 14px", fontSize: "clamp(26px, 4.5vw, 38px)",
            fontWeight: 800, color: "white", lineHeight: 1.15,
          }}>
            How can we help?
          </h1>
          <p style={{
            margin: "0 auto", maxWidth: 480, fontSize: 15,
            color: "#CBD5E1", lineHeight: 1.6,
          }}>
            Browse common questions or reach out — we&apos;ll get back to you within a day.
          </p>
        </Container>
      </div>

      <Container>
        <HelpClient />
      </Container>
    </main>
  )
}
