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

export default function FriendsLoading() {
  return (
    <main style={{ minHeight: "100vh", background: "#F8FAFC", paddingBottom: 80 }}>
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }`}</style>
      <Container>
        <div style={{ paddingTop: 48, maxWidth: 700, margin: "0 auto" }}>
          <Skeleton w={100} h={28} r={6} />
          {/* Search bar */}
          <div style={{ margin: "28px 0 32px" }}>
            <Skeleton w="100%" h={48} r={12} />
          </div>
          {/* Friend rows */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ background: "white", borderRadius: 14, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14 }}>
                <Skeleton w={44} h={44} r={22} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                  <Skeleton w="40%" h={15} />
                  <Skeleton w="25%" h={12} />
                </div>
                <Skeleton w={80} h={34} r={8} />
              </div>
            ))}
          </div>
        </div>
      </Container>
    </main>
  )
}
