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

export default function WishlistLoading() {
  return (
    <main style={{ minHeight: "100vh", background: "#F8FAFC", paddingBottom: 60 }}>
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }`}</style>

      {/* Cover banner */}
      <div style={{ height: 240, background: "#CBD5E1" }} />

      <Container>
        <div style={{ maxWidth: 960, margin: "0 auto", paddingTop: 28 }}>
          <Skeleton w={80} h={13} />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "20px 0 14px" }}>
            <Skeleton w={220} h={28} />
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Skeleton w={36} h={36} r={18} />
              <Skeleton w={100} h={16} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Skeleton w={90} h={36} r={8} />
              <Skeleton w={90} h={36} r={8} />
            </div>
          </div>

          <div style={{ height: 1, background: "#E2E8F0", marginBottom: 24 }} />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 20 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i}>
                <Skeleton w="100%" h={200} r={12} />
                <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                  <Skeleton w="80%" h={13} />
                  <Skeleton w="50%" h={12} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </main>
  )
}
