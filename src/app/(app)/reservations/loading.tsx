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

export default function ReservationsLoading() {
  return (
    <main style={{ minHeight: "100vh", background: "#F8FAFC", paddingBottom: 80 }}>
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }`}</style>
      <Container>
        <div style={{ paddingTop: 48, maxWidth: 900, margin: "0 auto" }}>
          <Skeleton w={200} h={28} r={6} />
          <div style={{ marginTop: 8 }}>
            <Skeleton w={340} h={16} r={4} />
          </div>

          {/* Group 1 */}
          <div style={{ marginTop: 44 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 20 }}>
              <Skeleton w={150} h={18} r={4} />
              <Skeleton w={80} h={14} r={4} />
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: 16,
            }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ background: "white", borderRadius: 16, overflow: "hidden", border: "1px solid #F1F5F9" }}>
                  <Skeleton w="100%" h={160} r={0} />
                  <div style={{ padding: "12px 12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Skeleton w={22} h={22} r={11} />
                      <Skeleton w="60%" h={12} r={4} />
                    </div>
                    <Skeleton w="90%" h={14} r={4} />
                    <Skeleton w="35%" h={12} r={4} />
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
                      <Skeleton w="100%" h={30} r={8} />
                      <Skeleton w="100%" h={30} r={8} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </main>
  )
}
