import "server-only"

import sharp from "sharp"
import { getOpenAiApiKey } from "@/lib/openai-integration"
import { removeBackgroundWithOpenAi } from "@/lib/flyer/remove-background-openai"
import { removeWhiteBackgroundSharp } from "@/lib/flyer/remove-background-sharp"

export type BackgroundRemovalMethod = "openai" | "sharp" | "none"

export type ProcessCaseImageResult = {
  buffer: Buffer
  mime: "image/png"
  method: BackgroundRemovalMethod
}

export async function processCaseImageBuffer(
  input: Buffer,
  opts?: { removeBackground?: boolean },
): Promise<ProcessCaseImageResult> {
  if (!opts?.removeBackground) {
    const buffer = await sharp(input).png().toBuffer()
    return { buffer, mime: "image/png", method: "none" }
  }

  const hasOpenAi = !!(await getOpenAiApiKey())

  if (hasOpenAi) {
    try {
      const buffer = await removeBackgroundWithOpenAi(input)
      return { buffer, mime: "image/png", method: "openai" }
    } catch (e) {
      console.warn("[flyer] OpenAI background removal failed, using Sharp:", e)
    }
  }

  const buffer = await removeWhiteBackgroundSharp(input)
  return { buffer, mime: "image/png", method: "sharp" }
}
