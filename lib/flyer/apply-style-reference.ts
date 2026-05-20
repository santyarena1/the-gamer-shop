import "server-only"

import sharp from "sharp"
import { resolveImageBuffer } from "@/lib/flyer/resolve-image"
import type { FlyerPayload } from "@/lib/flyer/types"

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)))
  return `#${[r, g, b].map((n) => clamp(n).toString(16).padStart(2, "0")).join("")}`
}

/** Extrae rojo, fondo y blanco dominantes de la referencia para acercar la plantilla al ejemplo. */
export async function extractBrandColorsFromStyleReference(
  ref: string,
): Promise<Partial<FlyerPayload["brand"]>> {
  const buf = await resolveImageBuffer(ref)
  if (!buf) return {}

  const { data, info } = await sharp(buf)
    .resize(160, 160, { fit: "cover" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const ch = info.channels
  let bestRed = { score: 0, r: 255, g: 0, b: 0 }
  let darkest = { lum: 999, r: 8, g: 8, b: 8 }
  let brightest = { lum: -1, r: 255, g: 255, b: 255 }

  for (let i = 0; i < data.length; i += ch) {
    const r = data[i]!
    const g = data[i + 1]!
    const b = data[i + 2]!
    const redScore = r - Math.max(g, b)
    if (r > 70 && redScore > bestRed.score) {
      bestRed = { score: redScore, r, g, b }
    }
    const lum = 0.299 * r + 0.587 * g + 0.114 * b
    if (lum < darkest.lum) darkest = { lum, r, g, b }
    if (lum > brightest.lum && lum > 160) brightest = { lum, r, g, b }
  }

  const primaryColor = rgbToHex(bestRed.r, Math.min(bestRed.g, 40), Math.min(bestRed.b, 40))
  const backgroundColor = rgbToHex(darkest.r, darkest.g, darkest.b)
  const secondaryColor = rgbToHex(brightest.r, brightest.g, brightest.b)
  const accentColor = rgbToHex(bestRed.r * 0.55, 0, 0)

  return { primaryColor, secondaryColor, backgroundColor, accentColor }
}

export async function applyStyleReferenceToPayload(
  payload: FlyerPayload,
): Promise<FlyerPayload> {
  const ref = payload.styleReference?.path?.trim()
  if (!ref) return payload

  const colors = await extractBrandColorsFromStyleReference(ref)
  if (!Object.keys(colors).length) return payload

  return {
    ...payload,
    brand: { ...payload.brand, ...colors },
  }
}
