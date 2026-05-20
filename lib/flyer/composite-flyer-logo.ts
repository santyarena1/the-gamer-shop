import "server-only"

import sharp from "sharp"
import { resolveImageBuffer } from "@/lib/flyer/resolve-image"
import { resolveFlyerLogoDataUri } from "@/lib/flyer/resolve-logo"
import type { FlyerPayload } from "@/lib/flyer/types"

/** Superpone el logo real de la tienda (Configuración) sobre el flyer generado por IA. */
export async function compositeBrandLogoOnFlyer(
  flyerPng: Buffer,
  payload: FlyerPayload,
): Promise<Buffer> {
  let logoUri: string
  try {
    logoUri = await resolveFlyerLogoDataUri(payload)
  } catch {
    return flyerPng
  }
  if (!logoUri.startsWith("data:")) return flyerPng

  const b64 = logoUri.split(",")[1]
  if (!b64) return flyerPng

  const logoBuf = Buffer.from(b64, "base64")
  const logoPng = await sharp(logoBuf)
    .resize(240, 100, { fit: "inside", withoutEnlargement: false })
    .png()
    .toBuffer()

  return sharp(flyerPng)
    .composite([{ input: logoPng, top: 28, left: 40 }])
    .png()
    .toBuffer()
}

export async function loadFlyerImageBuffers(payload: FlyerPayload): Promise<{
  product: Buffer | null
  styleReference: Buffer | null
}> {
  let product: Buffer | null = null
  if (payload.product.pcImageBase64?.startsWith("data:")) {
    const b64 = payload.product.pcImageBase64.split(",")[1]
    if (b64) product = Buffer.from(b64, "base64")
  }

  let styleReference: Buffer | null = null
  const stylePath = payload.styleReference?.path?.trim()
  if (stylePath) {
    styleReference = await resolveImageBuffer(stylePath)
  }

  return { product, styleReference }
}
