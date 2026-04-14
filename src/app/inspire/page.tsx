import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import Container from "@/components/ui/Container"
import { getTrendingWishlists } from "@/lib/actions/inspire"
import AIGiftFinder from "@/components/inspire/AIGiftFinder"
import TrendingCard from "@/components/inspire/TrendingCard"

export const metadata = { title: "Inspiration" }

export default async function InspirePage() {
  const wishlists = await getTrendingWishlists()

  return (
    <>
      <Header />

      <main style={{ minHeight: "100vh", background: "#F8FAFC", paddingBottom: 80 }}>

        {/* Hero */}
        <div style={{
          background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 60%, #38A3C7 100%)",
          padding: "72px 0 64px",
          textAlign: "center",
        }}>
          <Container>
            <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#7DD3FC" }}>
              Inspiration
            </p>
            <h1 style={{ margin: "0 0 16px", fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 800, color: "white", lineHeight: 1.15 }}>
              Discover &amp; Get Inspired
            </h1>
            <p style={{ margin: "0 auto 32px", maxWidth: 520, fontSize: 16, color: "#CBD5E1", lineHeight: 1.65 }}>
              Browse trending wishlists from the community, or let our AI help you find the perfect gift for anyone.
            </p>
            <a
              href="#ai-finder"
              style={{
                display: "inline-block", background: "#38A3C7", color: "white",
                borderRadius: 8, padding: "12px 28px", fontWeight: 700, fontSize: 14,
                textDecoration: "none", letterSpacing: "0.04em",
              }}
            >
              Find a gift with AI
            </a>
          </Container>
        </div>

        <Container>

          {/* Trending Wishlists */}
          <section style={{ paddingTop: 56 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 8 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#0F172A" }}>
                Trending Wishlists
              </h2>
              <span style={{ fontSize: 13, color: "#94A3B8" }}>
                {wishlists.length} public wishlists
              </span>
            </div>

            {wishlists.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#94A3B8" }}>
                <p style={{ margin: 0 }}>No public wishlists yet. Be the first to share yours!</p>
              </div>
            ) : (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                gap: 20,
              }}>
                {wishlists.map((wl) => (
                  <TrendingCard key={wl.id} wl={wl} />
                ))}
              </div>
            )}
          </section>

          {/* AI Gift Finder */}
          <section style={{ paddingTop: 64 }}>
            <AIGiftFinder />
          </section>

        </Container>
      </main>

      <Footer />
    </>
  )
}
