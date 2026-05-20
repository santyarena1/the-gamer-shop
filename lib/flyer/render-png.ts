import "server-only"

import sharp from "sharp"
import { buildFlyerSvg } from "@/lib/flyer/render-svg"
import { resolveFlyerLogoDataUri } from "@/lib/flyer/resolve-logo"
import type { FlyerPayload } from "@/lib/flyer/types"

export async function renderFlyerPng(payload: FlyerPayload): Promise<Buffer> {
  const logoDataUri = await resolveFlyerLogoDataUri(payload)
  const svg = await buildFlyerSvg(payload, logoDataUri)

  try {
    return await sharp(Buffer.from(svg)).png().toBuffer()
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error al renderizar"
    throw new Error(`No se pudo generar el PNG: ${msg}`)
  }
}
