export type BrandingSettings = {
  shopName: string
  tagline: string
  accentColor: string
  logoUrl: string | null
}

export const DEFAULT_BRANDING: BrandingSettings = {
  shopName: "The Gamer Shop",
  tagline: "Panel de Gestión",
  accentColor: "#22c55e",
  logoUrl: null,
}
