import "server-only"

import sharp from "sharp"
import { getOpenAiApiKey } from "@/lib/openai-integration"
import { db } from "@/lib/db"

const OPENAI_ID = "openai"
const EDITS_URL = "https://api.openai.com/v1/images/edits"

const BG_REMOVE_PROMPT =
  "Remove the entire background. Keep only the PC case or computer product exactly as shown. " +
  "Output with a fully transparent background. Do not change the product shape, colors, logos, or proportions. " +
  "Do not add text, shadows on the floor, or a new background."

async function getImageEditModel(): Promise<string> {
  const row = await db.integrationSettings.findUnique({ where: { id: OPENAI_ID } })
  const model = row?.defaultModel?.trim()
  if (model?.startsWith("gpt-image")) return model
  return "gpt-image-1"
}

async function prepareForOpenAi(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
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

  const model = await getImageEditModel()
  const form = new FormData()
  form.append("model", model)
  form.append("prompt", BG_REMOVE_PROMPT)
  form.append("background", "transparent")
  form.append("output_format", "png")
  form.append("size", "auto")
  form.append(
    "image",
    new Blob([new Uint8Array(prepared)], { type: "image/png" }),
    "product.png",
  )

  const res = await fetch(EDITS_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body: form,
    signal: AbortSignal.timeout(120_000),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => "")
    if (res.status === 401) throw new Error("API Key de OpenAI inválida")
    throw new Error(
      `OpenAI error ${res.status}${errText ? `: ${errText.slice(0, 120)}` : ""}`,
    )
  }

  const json = (await res.json()) as {
    data?: Array<{ b64_json?: string; url?: string }>
  }

  const item = json.data?.[0]
  if (!item) throw new Error("OpenAI no devolvió imagen")

  if (item.b64_json) {
    return Buffer.from(item.b64_json, "base64")
  }

  if (item.url) {
    const imgRes = await fetch(item.url, { signal: AbortSignal.timeout(30_000) })
    if (!imgRes.ok) throw new Error("No se pudo descargar la imagen de OpenAI")
    return Buffer.from(await imgRes.arrayBuffer())
  }

  throw new Error("Respuesta de OpenAI sin imagen")
}
