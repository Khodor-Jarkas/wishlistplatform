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

export default function ProfileLoading() {
  return (
    <main style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px 80px" }}>
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }`}</style>

      {/* Avatar + name */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
        <Skeleton w={72} h={72} r={36} />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Skeleton w={180} h={26} r={6} />
          <Skeleton w={100} h={14} r={4} />
        </div>
      </div>

      {/* Section: Personal */}
      <Skeleton w={100} h={22} r={4} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 20 }}>
        <Skeleton w="100%" h={44} />
        <Skeleton w="100%" h={44} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 16 }}>
        <Skeleton w="100%" h={44} />
        <Skeleton w="100%" h={44} />
        <Skeleton w="100%" h={44} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        <Skeleton w="100%" h={44} />
        <Skeleton w="100%" h={44} />
      </div>
      <div style={{ marginTop: 16 }}>
        <Skeleton w="100%" h={44} />
      </div>
      <div style={{ marginTop: 16 }}>
        <Skeleton w="100%" h={80} />
      </div>

      {/* Section: Location */}
      <div style={{ marginTop: 40 }}><Skeleton w={90} h={22} r={4} /></div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 20 }}>
        <Skeleton w="100%" h={44} />
        <Skeleton w="100%" h={44} />
      </div>

      {/* Privacy toggle placeholder */}
      <div style={{ marginTop: 24, padding: "16px 0", borderTop: "1px solid #E2E8F0", borderBottom: "1px solid #E2E8F0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Skeleton w={220} h={16} />
          <Skeleton w={44} h={24} r={12} />
        </div>
      </div>

      {/* Save button */}
      <div style={{ marginTop: 40 }}>
        <Skeleton w={160} h={44} r={8} />
      </div>
    </main>
  )
}
