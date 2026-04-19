import Container from "@/components/ui/Container"

function Skeleton({ w, h, r = 8 }: { w: string | number; h: number; r?: number }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r, flexShrink: 0,
      background: "linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s infinite",
    }} />
  )
}

function CardGroup({ rows }: { rows: number }) {
  return (
    <div style={{ background: "white", borderRadius: 16, border: "1px solid #F1F5F9", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: 14,
          padding: "16px 20px",
          borderBottom: i < rows - 1 ? "1px solid #F8FAFC" : "none",
        }}>
          <Skeleton w={44} h={44} r={22} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <Skeleton w="60%" h={14} />
            <Skeleton w="30%" h={11} />
          </div>
          <Skeleton w={44} h={20} r={20} />
        </div>
      ))}
    </div>
  )
}

export default function ActivityLoading() {
  return (
    <main style={{ minHeight: "100vh", background: "#F8FAFC", paddingBottom: 80 }}>
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }`}</style>
      <Container>
        <div style={{ maxWidth: 620, margin: "0 auto", paddingTop: 48 }}>
          {/* Header */}
          <div style={{ marginBottom: 36 }}>
            <Skeleton w={120} h={28} r={6} />
            <div style={{ marginTop: 8 }}><Skeleton w={220} h={14} r={4} /></div>
          </div>

          {/* Groups */}
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <section>
              <div style={{ marginBottom: 12 }}><Skeleton w={50} h={11} r={4} /></div>
              <CardGroup rows={3} />
            </section>
            <section>
              <div style={{ marginBottom: 12 }}><Skeleton w={80} h={11} r={4} /></div>
              <CardGroup rows={4} />
            </section>
          </div>
        </div>
      </Container>
    </main>
  )
}
