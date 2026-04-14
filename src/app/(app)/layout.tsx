import type { ReactNode } from "react"
import AppHeader from "@/components/layout/AppHeader"
import Footer from "@/components/layout/Footer"
import { AddWishModalProvider } from "@/context/AddWishModalContext"
import AddWishModal from "@/components/wishlist/AddWishModal"

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AddWishModalProvider>
      <AppHeader />
      {children}
      <Footer />
      <AddWishModal />
    </AddWishModalProvider>
  )
}
