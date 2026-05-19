"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/auth"
import {
  deleteOpenAiSettings,
  saveOpenAiSettings,
  testOpenAiConnection,
  updateOpenAiModel,
} from "@/lib/openai-integration"

function revalidate() {
  revalidatePath("/configuracion")
}

export async function saveOpenAiAction(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  try {
    await requireAdmin()
    const apiKey = (formData.get("apiKey") as string)?.trim()
    const defaultModel = (formData.get("defaultModel") as string)?.trim() || "gpt-image-1"

    if (apiKey) {
      await saveOpenAiSettings(apiKey, defaultModel)
    } else {
      await updateOpenAiModel(defaultModel)
    }

    revalidate()
    return { ok: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al guardar" }
  }
}

export async function testOpenAiAction(): Promise<{ success: boolean; message: string }> {
  await requireAdmin()
  return testOpenAiConnection()
}

export async function deleteOpenAiAction() {
  await requireAdmin()
  await deleteOpenAiSettings()
  revalidate()
}
