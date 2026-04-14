"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface AddWishModalContextType {
  isOpen: boolean
  defaultWishlistId: string | null
  open: (wishlistId?: string) => void
  close: () => void
}

const AddWishModalContext = createContext<AddWishModalContextType>({
  isOpen: false,
  defaultWishlistId: null,
  open: () => {},
  close: () => {},
})

export function AddWishModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [defaultWishlistId, setDefaultWishlistId] = useState<string | null>(null)

  function open(wishlistId?: string) {
    setDefaultWishlistId(wishlistId ?? null)
    setIsOpen(true)
  }

  return (
    <AddWishModalContext.Provider value={{ isOpen, defaultWishlistId, open, close: () => setIsOpen(false) }}>
      {children}
    </AddWishModalContext.Provider>
  )
}

export function useAddWishModal() {
  return useContext(AddWishModalContext)
}
