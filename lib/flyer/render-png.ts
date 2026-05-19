import "server-only"

import sharp from "sharp"
import { getBranding } from "@/lib/branding"
import { fileToDataUri } from "@/lib/flyer/load-image"
import { buildFlyerSvg } from "@/lib/flyer/render-svg"
import type { FlyerPayload } from "@/lib/flyer/types"

export async function renderFlyerPng(payload: FlyerPayload): Promise<Buffer> {
  const branding = await getBranding()
  const logoDataUri = branding.logoUrl ? await fileToDataUri(branding.logoUrl) : null

  const svg = buildFlyerSvg(payload, logoDataUri)
  try {
    return await sharp(Buffer.from(svg)).png().toBuffer()
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al renderizar"
    throw new Error(`No se pudo generar el PNG: ${msg}`)
  }
}
