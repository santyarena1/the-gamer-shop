import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import BrandingStyles from "@/components/BrandingStyles"
import { getCachedBranding } from "@/lib/server-cache"

const inter = Inter({ subsets: ["latin"] })

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getCachedBranding()
  return {
    title: `${branding.shopName} — Gestión`,
    description: `Sistema de gestión interna de ${branding.shopName}`,
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const branding = await getCachedBranding()

  return (
    <html lang="es" className="h-full">
      <body className={`${inter.className} h-full bg-[#0f0f0f] text-white`}>
        <BrandingStyles branding={branding} />
        {children}
      </body>
    </html>
  )
}
