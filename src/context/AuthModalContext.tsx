"use client"

import { createContext, useContext, useState } from "react"

type ModalMode = "login" | "signup" | "profileSetup" | null

interface AuthModalCtx {
  modal: ModalMode
  openLogin:        () => void
  openSignup:       () => void
  /** Opens the modal directly at the profile-setup step (used after OAuth for new users). */
  openProfileSetup: () => void
  close:            () => void
}

const AuthModalContext = createContext<AuthModalCtx>({
  modal: null,
  openLogin:        () => {},
  openSignup:       () => {},
  openProfileSetup: () => {},
  close:            () => {},
})

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [modal, setModal] = useState<ModalMode>(null)

  return (
    <AuthModalContext.Provider value={{
      modal,
      openLogin:        () => setModal("login"),
      openSignup:       () => setModal("signup"),
      openProfileSetup: () => setModal("profileSetup"),
      close:            () => setModal(null),
    }}>
      {children}
    </AuthModalContext.Provider>
  )
}

export const useAuthModal = () => useContext(AuthModalContext)
