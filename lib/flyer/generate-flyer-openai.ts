import "server-only"

import { buildOpenAiFlyerPrompt } from "@/lib/flyer/build-openai-flyer-prompt"
import {
  bufferFromOpenAiImageResponse,
  finalizeFlyerPng,
  getOpenAiImageModel,
  openAiImageErrorMessage,
  OPENAI_IMAGES_EDITS_URL,
  OPENAI_IMAGES_GENERATIONS_URL,
  prepareProductImageForOpenAi,
  prepareStyleReferenceForOpenAi,
  type OpenAiImageResponse,
} from "@/lib/flyer/openai-image-utils"
import { getOpenAiFlyerDiagnostics } from "@/lib/openai-integration"
import type { FlyerPayload } from "@/lib/flyer/types"

export type GenerateFlyerOpenAiInput = {
  payload: FlyerPayload
  shopName: string
  productBuffer?: Buffer | null
  styleReferenceBuffer?: Buffer | null
}

function bufferToDataUrl(buffer: Buffer, mime = "image/png"): string {
  return `data:${mime};base64,${buffer.toString("base64")}`
}

async function callOpenAiGenerations(
  key: string,
  model: string,
  prompt: string,
): Promise<Buffer> {
  const res = await fetch(OPENAI_IMAGES_GENERATIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      size: "1024x1024",
      output_format: "png",
      quality: "high",
      n: 1,
    }),
    signal: AbortSignal.timeout(180_000),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => "")
    throw new Error(openAiImageErrorMessage(res.status, errText))
  }

  const json = (await res.json()) as OpenAiImageResponse
  return bufferFromOpenAiImageResponse(json)
}

async function callOpenAiEdits(
  key: string,
  model: string,
  prompt: string,
  imageBuffers: Buffer[],
): Promise<Buffer> {
  for (const buf of imageBuffers) {
    if (buf.length > 4 * 1024 * 1024) {
      throw new Error("Una imagen supera 4 MB para OpenAI. Usá archivos más chicos.")
    }
  }

  const images = imageBuffers.map((buffer) => ({
    image_url: bufferToDataUrl(buffer),
  }))

  const res = await fetch(OPENAI_IMAGES_EDITS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      images,
      size: "1024x1024",
      output_format: "png",
      quality: "high",
      input_fidelity: "high",
    }),
    signal: AbortSignal.timeout(180_000),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => "")
    throw new Error(openAiImageErrorMessage(res.status, errText))
  }

  const json = (await res.json()) as OpenAiImageResponse
  return bufferFromOpenAiImageResponse(json)
}

export async function generateFlyerWithOpenAi(
  input: GenerateFlyerOpenAiInput,
): Promise<Buffer> {
  const diag = await getOpenAiFlyerDiagnostics()
  if (!diag.ready || !diag.key) {
    throw new Error(diag.message)
  }

  const key = diag.key
  const prompt = buildOpenAiFlyerPrompt(input.payload, input.shopName)
  const model = await getOpenAiImageModel()

  let raw: Buffer

  if (input.productBuffer) {
    const buffers: Buffer[] = [await prepareProductImageForOpenAi(input.productBuffer)]
    if (input.styleReferenceBuffer) {
      buffers.push(await prepareStyleReferenceForOpenAi(input.styleReferenceBuffer))
    }
    raw = await callOpenAiEdits(key, model, prompt, buffers)
  } else if (input.styleReferenceBuffer) {
    raw = await callOpenAiEdits(key, model, prompt, [
      await prepareStyleReferenceForOpenAi(input.styleReferenceBuffer),
    ])
  } else {
    raw = await callOpenAiGenerations(key, model, prompt)
  }

  return finalizeFlyerPng(raw)
}
