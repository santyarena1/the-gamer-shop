import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "The Gamer Shop — Gestión",
  description: "Sistema de gestión interna de The Gamer Shop",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className={`${inter.className} h-full bg-[#0f0f0f] text-white`}>
        {children}
      </body>
    </html>
  )
}
