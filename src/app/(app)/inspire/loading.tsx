import Container from "@/components/ui/Container"

function Skeleton({ w, h, r = 8 }: { w: string | number; h: number; r?: number }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: "linear-gradient(90deg, #1E3A5F 25%, #1E4A6F 50%, #1E3A5F 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s infinite",
    }} />
  )
}

function SkeletonLight({ w, h, r = 8 }: { w: string | number; h: number; r?: number }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: "linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)",
      backgroundSize: "200% 100%",
      animation: "shimmer 1.4s infinite",
    }} />
  )
}

export default function InspireLoading() {
  return (
    <>
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }`}</style>

      {/* Hero — static, no skeleton needed */}
      <div style={{
        background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 60%, #38A3C7 100%)",
        padding: "72px 0 64px", textAlign: "center",
      }}>
        <Container>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <Skeleton w={120} h={14} r={20} />
            <Skeleton w={340} h={44} />
            <Skeleton w={480} h={16} />
            <Skeleton w={480} h={16} />
            <Skeleton w={160} h={44} r={8} />
          </div>
        </Container>
      </div>

      <main style={{ minHeight: "60vh", background: "#F8FAFC", paddingBottom: 80 }}>
        <Container>
          <section style={{ paddingTop: 56 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
              <SkeletonLight w={180} h={24} />
              <SkeletonLight w={100} h={16} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i}>
                  <SkeletonLight w="100%" h={180} r={12} />
                  <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
                    <SkeletonLight w="70%" h={15} />
                    <SkeletonLight w="45%" h={12} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </Container>
      </main>
    </>
  )
}
