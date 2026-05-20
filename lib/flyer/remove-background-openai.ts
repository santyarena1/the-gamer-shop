import "server-only"

import sharp from "sharp"
import { getOpenAiApiKey } from "@/lib/openai-integration"
import {
  bufferFromOpenAiImageResponse,
  getOpenAiImageModel,
  openAiImageErrorMessage,
  OPENAI_IMAGES_EDITS_URL,
  type OpenAiImageResponse,
} from "@/lib/flyer/openai-image-utils"

const BG_REMOVE_PROMPT =
  "Remove only the outer studio background. Preserve every detail of the PC case: glass, RGB, cables, reflections, logos, vents and metal. " +
  "Do not crop, simplify, repaint or erase any part of the hardware. Transparent PNG background only."

async function prepareForOpenAi(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .png()
    .toBuffer()
}

export async function removeBackgroundWithOpenAi(input: Buffer): Promise<Buffer> {
  const key = await getOpenAiApiKey()
  if (!key) {
    throw new Error("OpenAI no configurado")
  }

  const prepared = await prepareForOpenAi(input)
  if (prepared.length > 4 * 1024 * 1024) {
    throw new Error("La imagen es demasiado grande para OpenAI (máx. 4 MB)")
  }

  const model = await getOpenAiImageModel()
  const form = new FormData()
  form.append("model", model)
  form.append("prompt", BG_REMOVE_PROMPT)
  form.append("background", "transparent")
  form.append("output_format", "png")
  form.append("size", "auto")
  form.append(
    "image[]",
    new Blob([new Uint8Array(prepared)], { type: "image/png" }),
    "product.png",
  )

  const res = await fetch(OPENAI_IMAGES_EDITS_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
    signal: AbortSignal.timeout(120_000),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => "")
    throw new Error(openAiImageErrorMessage(res.status, errText))
  }

  const json = (await res.json()) as OpenAiImageResponse
  const out = await bufferFromOpenAiImageResponse(json)
  return sharp(out).png().toBuffer()
}
