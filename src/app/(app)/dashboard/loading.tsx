import Container from "@/components/ui/Container"

function Skeleton({ w, h, r = 8 }: { w: string | number; h: number; r?: number }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: "linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s infinite",
    }} />
  )
}

export default function DashboardLoading() {
  return (
    <main style={{ minHeight: "100vh", background: "#F8FAFC", paddingBottom: 80 }}>
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }`}</style>

      {/* Banner */}
      <div style={{ background: "linear-gradient(135deg, #1E8FAD, #38A3C7)", height: 120 }} />

      <Container>
        <div style={{ position: "relative", marginTop: -48 }}>

          {/* Profile card */}
          <div style={{ background: "white", borderRadius: 20, padding: "24px 28px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", marginBottom: 32, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <Skeleton w={72} h={72} r={36} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <Skeleton w={140} h={18} />
                <Skeleton w={90} h={13} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {[1, 2, 3].map(i => <Skeleton key={i} w={90} h={64} r={14} />)}
            </div>
          </div>

          {/* Section header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <Skeleton w={140} h={20} />
              <Skeleton w={100} h={13} />
            </div>
            <Skeleton w={110} h={38} r={10} />
          </div>

          {/* Wishlist grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 20 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}>
                <Skeleton w="100%" h={160} r={12} />
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                  <Skeleton w="75%" h={14} />
                  <Skeleton w="45%" h={12} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </main>
  )
}
