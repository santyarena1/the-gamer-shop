import "server-only"

import sharp from "sharp"
import { getOpenAiApiKey } from "@/lib/openai-integration"
import { removeBackgroundWithOpenAi } from "@/lib/flyer/remove-background-openai"
import { removeWhiteBackgroundSharp } from "@/lib/flyer/remove-background-sharp"

export type BackgroundRemovalMethod = "openai" | "sharp" | "none"

export type ProcessCaseImageOptions = {
  removeBackground?: boolean
  /** OpenAI puede alterar el producto; solo si el usuario lo pide explícitamente. */
  useOpenAi?: boolean
}

export type ProcessCaseImageResult = {
  buffer: Buffer
  mime: "image/png"
  method: BackgroundRemovalMethod
}

export async function processCaseImageBuffer(
  input: Buffer,
  opts?: ProcessCaseImageOptions,
): Promise<ProcessCaseImageResult> {
  if (!opts?.removeBackground) {
    const buffer = await sharp(input).png().toBuffer()
    return { buffer, mime: "image/png", method: "none" }
  }

  if (opts.useOpenAi && (await getOpenAiApiKey())) {
    try {
      const buffer = await removeBackgroundWithOpenAi(input)
      return { buffer, mime: "image/png", method: "openai" }
    } catch (e) {
      console.warn("[flyer] OpenAI background removal failed, using Sharp:", e)
    }
  }

  const buffer = await removeWhiteBackgroundSharp(input, {
    tolerance: 32,
    feather: 16,
  })
  return { buffer, mime: "image/png", method: "sharp" }
}
