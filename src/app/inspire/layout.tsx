import type { ReactNode } from "react"
import { AddWishModalProvider } from "@/context/AddWishModalContext"
import AddWishModal from "@/components/wishlist/AddWishModal"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"

export default function InspireLayout({ children }: { children: ReactNode }) {
  return (
    <AddWishModalProvider>
      <Header />
      {children}
      <Footer />
      <AddWishModal />
    </AddWishModalProvider>
  )
}
