import Container from "@/components/ui/Container"
import { getTrendingWishlists } from "@/lib/actions/inspire"
import { getCreators } from "@/lib/actions/creators"
import AIGiftFinder from "@/components/inspire/AIGiftFinder"
import InspireTabs from "@/components/inspire/InspireTabs"

export const metadata = { title: "Inspiration" }

export default async function InspirePage() {
  const [wishlists, creators] = await Promise.all([
    getTrendingWishlists(),
    getCreators(),
  ])

  return (
    <>
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

          <InspireTabs wishlists={wishlists} creators={creators} />

          {/* AI Gift Finder */}
          <section style={{ paddingTop: 64 }}>
            <AIGiftFinder />
          </section>

        </Container>
      </main>
    </>
  )
}
