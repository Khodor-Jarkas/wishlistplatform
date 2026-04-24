import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { AuthModalProvider } from "@/context/AuthModalContext"
import OAuthPopupHandler from "@/components/auth/OAuthPopupHandler"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: "Wish It — All your wishes in one place",
    template: "%s | Wish It",
  },
  description:
    "Wish It makes it easy to save and share your wishlists with friends and family.",
  keywords: ["wishlist", "gift ideas", "wish", "birthday", "christmas"],
  authors: [{ name: "Wish It" }],
  openGraph: {
    title: "Wish It",
    description: "All your wishes in one place.",
    type: "website",
    locale: "en_US",
  },
}

export const viewport: Viewport = {
  themeColor: "#38A3C7",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthModalProvider>
          <OAuthPopupHandler />
          {children}
        </AuthModalProvider>
      </body>
    </html>
  )
}
