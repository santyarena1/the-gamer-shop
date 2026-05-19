"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/auth"
import {
  deleteSerperSettings,
  saveSerperSettings,
  testSerperConnection,
} from "@/lib/serper-integration"

function revalidate() {
  revalidatePath("/configuracion")
}

export async function saveSerperAction(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
): Promise<{ error?: string; ok?: boolean }> {
  try {
    await requireAdmin()
    const apiKey = (formData.get("apiKey") as string)?.trim()
    if (!apiKey) {
      return { error: "Ingresá la API Key de Serper" }
    }
    await saveSerperSettings(apiKey)
    revalidate()
    return { ok: true }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al guardar" }
  }
}

export async function testSerperAction(): Promise<{ success: boolean; message: string }> {
  await requireAdmin()
  return testSerperConnection()
}

export async function deleteSerperAction() {
  await requireAdmin()
  await deleteSerperSettings()
  revalidate()
}
