import "server-only"

import sharp from "sharp"

type Rgb = { r: number; g: number; b: number }

export type RemoveBackgroundSharpOptions = {
  /** Distancia máxima al color de fondo (solo píxeles conectados al borde). */
  tolerance?: number
  /** Ancho de transición suave en el contorno (px en la imagen de trabajo). */
  feather?: number
  /** Lado máximo para calcular la máscara (más rápido y estable). */
  maxSide?: number
}

function colorDistance(a: Rgb, b: Rgb): number {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2)
}

function sampleCornerBg(
  data: Buffer,
  width: number,
  height: number,
  channels: number,
  patch = 10,
): Rgb {
  const samples: Rgb[] = []
  const corners: Array<[number, number]> = [
    [0, 0],
    [Math.max(0, width - patch), 0],
    [0, Math.max(0, height - patch)],
    [Math.max(0, width - patch), Math.max(0, height - patch)],
  ]

  for (const [cx, cy] of corners) {
    for (let y = cy; y < cy + patch && y < height; y++) {
      for (let x = cx; x < cx + patch && x < width; x++) {
        const i = (y * width + x) * channels
        samples.push({ r: data[i]!, g: data[i + 1]!, b: data[i + 2]! })
      }
    }
  }

  const r = Math.round(samples.reduce((s, p) => s + p.r, 0) / samples.length)
  const g = Math.round(samples.reduce((s, p) => s + p.g, 0) / samples.length)
  const b = Math.round(samples.reduce((s, p) => s + p.b, 0) / samples.length)
  return { r, g, b }
}

function readRgb(data: Buffer, width: number, channels: number, x: number, y: number): Rgb {
  const i = (y * width + x) * channels
  return { r: data[i]!, g: data[i + 1]!, b: data[i + 2]! }
}

/**
 * Máscara de fondo: solo píxeles claros **conectados al borde** de la imagen.
 * No toca blancos/grises que pertenecen al producto en el interior.
 */
function buildEdgeConnectedBackgroundMask(
  data: Buffer,
  width: number,
  height: number,
  channels: number,
  bg: Rgb,
  tolerance: number,
): Uint8Array {
  const bgMask = new Uint8Array(width * height)
  const visited = new Uint8Array(width * height)
  const queue: number[] = []

  const tryEnqueue = (x: number, y: number) => {
    const idx = y * width + x
    if (visited[idx]) return
    const dist = colorDistance(readRgb(data, width, channels, x, y), bg)
    if (dist > tolerance) return
    visited[idx] = 1
    queue.push(idx)
  }

  for (let x = 0; x < width; x++) {
    tryEnqueue(x, 0)
    tryEnqueue(x, height - 1)
  }
  for (let y = 0; y < height; y++) {
    tryEnqueue(0, y)
    tryEnqueue(width - 1, y)
  }

  while (queue.length > 0) {
    const idx = queue.pop()!
    bgMask[idx] = 1
    const x = idx % width
    const y = (idx / width) | 0
    if (x > 0) tryEnqueue(x - 1, y)
    if (x < width - 1) tryEnqueue(x + 1, y)
    if (y > 0) tryEnqueue(x, y - 1)
    if (y < height - 1) tryEnqueue(x, y + 1)
  }

  return bgMask
}

function applyMaskWithFeather(
  rgba: Buffer,
  width: number,
  height: number,
  channels: number,
  bgMask: Uint8Array,
  bg: Rgb,
  tolerance: number,
  feather: number,
): void {
  const hard = tolerance
  const soft = tolerance + Math.max(4, feather)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      const i = idx * channels
      const px = readRgb(rgba, width, channels, x, y)
      const dist = colorDistance(px, bg)

      if (bgMask[idx]) {
        rgba[i + 3] = 0
        continue
      }

      // Suavizado solo junto al borde del recorte (no en zonas claras internas)
      let nearBg = false
      for (let dy = -1; dy <= 1 && !nearBg; dy++) {
        for (let dx = -1; dx <= 1 && !nearBg; dx++) {
          const nx = x + dx
          const ny = y + dy
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
          if (bgMask[ny * width + nx]) nearBg = true
        }
      }

      if (nearBg && dist < soft) {
        const t = Math.max(0, Math.min(1, (dist - hard) / (soft - hard)))
        rgba[i + 3] = Math.round((rgba[i + 3] ?? 255) * t)
      }
    }
  }
}

/**
 * Quita fondo claro (blanco/gris de estudio) sin borrar partes claras del producto.
 */
export async function removeWhiteBackgroundSharp(
  input: Buffer,
  options: number | RemoveBackgroundSharpOptions = {},
): Promise<Buffer> {
  const opts: RemoveBackgroundSharpOptions =
    typeof options === "number" ? { tolerance: options } : options
  const tolerance = opts.tolerance ?? 30
  const feather = opts.feather ?? 14
  const maxSide = opts.maxSide ?? 1200

  const meta = await sharp(input).metadata()
  const origW = meta.width ?? 0
  const origH = meta.height ?? 0
  if (!origW || !origH) throw new Error("Imagen inválida")

  const scale = Math.min(1, maxSide / Math.max(origW, origH))
  const workW = Math.max(1, Math.round(origW * scale))
  const workH = Math.max(1, Math.round(origH * scale))

  const workRgba = await sharp(input)
    .resize(workW, workH, { fit: "fill" })
    .ensureAlpha()
    .raw()
    .toBuffer()

  const channels = 4
  const bg = sampleCornerBg(workRgba, workW, workH, channels)
  const bgMask = buildEdgeConnectedBackgroundMask(
    workRgba,
    workW,
    workH,
    channels,
    bg,
    tolerance,
  )
  applyMaskWithFeather(workRgba, workW, workH, channels, bgMask, bg, tolerance, feather)

  const maskPng = await sharp(workRgba, { raw: { width: workW, height: workH, channels: 4 } })
    .extractChannel(3)
    .png()
    .toBuffer()

  const maskFull = await sharp(maskPng)
    .resize(origW, origH, { fit: "fill", kernel: sharp.kernel.lanczos3 })
    .toBuffer()

  return sharp(input)
    .ensureAlpha()
    .composite([{ input: maskFull, blend: "dest-in" }])
    .png()
    .toBuffer()
}
