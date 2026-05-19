import "server-only"

import sharp from "sharp"

/** Recorte simple de fondos blancos/claros (fallback sin IA). */
export async function removeWhiteBackgroundSharp(
  input: Buffer,
  threshold = 238,
): Promise<Buffer> {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const pixels = data
  const featherStart = threshold - 45

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i]!
    const g = pixels[i + 1]!
    const b = pixels[i + 2]!
    const avg = (r + g + b) / 3

    if (avg >= threshold) {
      pixels[i + 3] = 0
    } else if (avg >= featherStart) {
      const t = (avg - featherStart) / (threshold - featherStart)
      pixels[i + 3] = Math.round(pixels[i + 3]! * (1 - t))
    }
  }

  return sharp(pixels, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toBuffer()
}
