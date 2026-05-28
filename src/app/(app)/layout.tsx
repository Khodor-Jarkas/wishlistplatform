import { type ReactNode, Suspense } from "react"
import dynamic from "next/dynamic"
import AppHeader from "@/components/layout/AppHeader"
import Footer from "@/components/layout/Footer"
import MobileBottomNav from "@/components/layout/MobileBottomNav"
import { AddWishModalProvider } from "@/context/AddWishModalContext"

const AddWishModal = dynamic(() => import("@/components/wishlist/AddWishModal"))

// Shown while AppHeader's async profile fetch resolves. Matches the header
// height so the layout doesn't shift when the real header streams in.
function AppHeaderFallback() {
  return (
    <div style={{
      height: "clamp(64px, 8vw, 72px)",
      background: "white",
      borderBottom: "1px solid #E2E8F0",
      position: "relative",
      zIndex: 100,
    }} />
  )
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AddWishModalProvider>
      <Suspense fallback={<AppHeaderFallback />}>
        <AppHeader />
      </Suspense>
      {children}
      <Footer />
      <MobileBottomNav />
      <Suspense fallback={null}>
        <AddWishModal />
      </Suspense>
    </AddWishModalProvider>
  )
}
