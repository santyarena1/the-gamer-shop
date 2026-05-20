import "server-only"

import sharp from "sharp"
import { db } from "@/lib/db"

const OPENAI_ID = "openai"

export const OPENAI_IMAGES_GENERATIONS_URL =
  "https://api.openai.com/v1/images/generations"
export const OPENAI_IMAGES_EDITS_URL = "https://api.openai.com/v1/images/edits"

export async function getOpenAiImageModel(): Promise<string> {
  const row = await db.integrationSettings.findUnique({ where: { id: OPENAI_ID } })
  const model = row?.defaultModel?.trim()
  if (model?.startsWith("gpt-image")) return model
  return "gpt-image-1"
}

export type OpenAiImageResponse = {
  data?: Array<{ b64_json?: string; url?: string }>
}

export async function bufferFromOpenAiImageResponse(
  json: OpenAiImageResponse,
): Promise<Buffer> {
  const item = json.data?.[0]
  if (!item) throw new Error("OpenAI no devolvió imagen")

  if (item.b64_json) {
    return Buffer.from(item.b64_json, "base64")
  }
  if (item.url) {
    const imgRes = await fetch(item.url, { signal: AbortSignal.timeout(60_000) })
    if (!imgRes.ok) throw new Error("No se pudo descargar la imagen de OpenAI")
    return Buffer.from(await imgRes.arrayBuffer())
  }
  throw new Error("Respuesta de OpenAI sin imagen")
}

export function openAiImageErrorMessage(status: number, errText: string): string {
  if (status === 401) return "API Key de OpenAI inválida"
  const snippet = errText ? `: ${errText.slice(0, 200)}` : ""
  return `OpenAI error ${status}${snippet}`
}

/** Imagen de producto para edición: mantiene transparencia, cabe en 1024px. */
export async function prepareProductImageForOpenAi(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
    .ensureAlpha()
    .png()
    .toBuffer()
}

/** Referencia de estilo (flyer ejemplo) para guiar composición. */
export async function prepareStyleReferenceForOpenAi(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .resize(1024, 1024, { fit: "cover" })
    .png()
    .toBuffer()
}

export async function finalizeFlyerPng(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(1080, 1080, { fit: "cover" })
    .png()
    .toBuffer()
}
