import Container from "../ui/Container"

const steps = [
  {
    icon: "🎁",
    title: "Create wishes & wishlists",
    description:
      "In Wish It you can create wishes and wishlists with a few clicks. Save all your wishes in one place.",
    flip: false,
    bg: "#D6EFF7",
    accent: "#38A3C7",
  },
  {
    icon: "🤝",
    title: "Share with friends & family",
    description:
      "Wish It makes it possible to share your wishlists with your family and friends. That way they can easily find the perfect gift for you.",
    flip: true,
    bg: "#FEF3C7",
    accent: "#F59E0B",
  },
  {
    icon: "✅",
    title: "Avoid getting the same gift",
    description:
      "Your family and friends have the opportunity to reserve wishes on your wishlist. Thus you avoid receiving the same gift repeatedly.",
    flip: false,
    bg: "#DCFCE7",
    accent: "#22C55E",
  },
]

export default function HowItWorks() {
  return (
    <section style={{ padding: "80px 0", background: "white" }}>
      <Container>

        <h2 style={{ textAlign: "center", marginBottom: 70, fontSize: 32 }}>
          How Wish It works
        </h2>

        {steps.map((step, i) => (
          <div
            key={step.title}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 80,
              marginBottom: i < steps.length - 1 ? 80 : 0,
              flexDirection: step.flip ? "row-reverse" : "row",
            }}
          >
            {/* Illustration */}
            <div
              style={{
                flexShrink: 0,
                width: 280,
                height: 220,
                background: step.bg,
                borderRadius: 20,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 72,
                gap: 12,
              }}
            >
              {step.icon}
              {/* Swap this <div> for an <img src="..." /> when you have real assets */}
            </div>

            {/* Text */}
            <div style={{ maxWidth: 400 }}>
              <h3
                style={{
                  fontSize: 24,
                  marginBottom: 14,
                  color: "#0F172A",
                  fontWeight: 600,
                }}
              >
                {step.title}
              </h3>
              <p style={{ color: "#475569", lineHeight: 1.7, fontSize: 16 }}>
                {step.description}
              </p>
            </div>
          </div>
        ))}

      </Container>
    </section>
  )
}
