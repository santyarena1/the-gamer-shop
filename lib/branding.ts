import "server-only"

import { db } from "@/lib/db"
import {
  DEFAULT_BRANDING,
  type BrandingSettings,
} from "@/lib/branding-constants"

export type { BrandingSettings } from "@/lib/branding-constants"
export { DEFAULT_BRANDING } from "@/lib/branding-constants"

const HEX_RE = /^#([0-9A-Fa-f]{6})$/

export function normalizeAccentColor(value: string): string | null {
  const trimmed = value.trim()
  if (!HEX_RE.test(trimmed)) return null
  return trimmed.toLowerCase()
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace("#", "")
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

export function lightenHex(hex: string, percent: number): string {
  const { r, g, b } = hexToRgb(hex)
  const mix = (c: number) => Math.min(255, Math.round(c + (255 - c) * (percent / 100)))
  const toHex = (n: number) => n.toString(16).padStart(2, "0")
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`
}

export function brandingCssVars(branding: BrandingSettings): string {
  const accent = normalizeAccentColor(branding.accentColor) ?? DEFAULT_BRANDING.accentColor
  const hover = lightenHex(accent, 18)
  const { r, g, b } = hexToRgb(accent)
  return [
    `--brand-accent:${accent}`,
    `--brand-accent-hover:${hover}`,
    `--brand-accent-rgb:${r} ${g} ${b}`,
  ].join(";")
}

export async function getBranding(): Promise<BrandingSettings> {
  const row = await db.appSettings.findUnique({ where: { id: "default" } })
  if (!row) {
    await db.appSettings.create({
      data: { id: "default", ...DEFAULT_BRANDING },
    })
    return DEFAULT_BRANDING
  }

  return {
    shopName: row.shopName,
    tagline: row.tagline,
    accentColor: row.accentColor,
    logoUrl: row.logoUrl,
  }
}

export function brandingLogoMark(branding: BrandingSettings): string {
  return branding.shopName.trim().charAt(0).toUpperCase() || "G"
}
