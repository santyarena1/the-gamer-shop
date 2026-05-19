import "server-only"

import { db } from "@/lib/db"
import { decryptSecret, encryptSecret, maskApiKey } from "@/lib/integration-crypto"
import type { SerperImageResult, SerperPublicSettings } from "@/lib/serper-integration-types"

const SERPER_ID = "serper"
const SERPER_IMAGES_URL = "https://google.serper.dev/images"

export type { SerperImageResult, SerperPublicSettings } from "@/lib/serper-integration-types"

export async function getSerperPublicSettings(): Promise<SerperPublicSettings> {
  const env = process.env.SERPER_API_KEY?.trim()
  if (env) {
    return { configured: true, maskedKey: maskApiKey(env) }
  }

  try {
    const row = await db.integrationSettings.findUnique({ where: { id: SERPER_ID } })
    if (!row?.encryptedApiKey) {
      return { configured: false, maskedKey: null }
    }
    try {
      const key = decryptSecret(row.encryptedApiKey)
      return { configured: true, maskedKey: maskApiKey(key) }
    } catch {
      return { configured: false, maskedKey: null }
    }
  } catch {
    return { configured: false, maskedKey: null }
  }
}

export async function getSerperApiKey(): Promise<string | null> {
  const env = process.env.SERPER_API_KEY?.trim()
  if (env) return env

  const row = await db.integrationSettings.findUnique({ where: { id: SERPER_ID } })
  if (!row?.encryptedApiKey) return null
  try {
    return decryptSecret(row.encryptedApiKey)
  } catch {
    return null
  }
}

export async function saveSerperSettings(apiKey: string) {
  await db.integrationSettings.upsert({
    where: { id: SERPER_ID },
    create: {
      id: SERPER_ID,
      encryptedApiKey: encryptSecret(apiKey.trim()),
      defaultModel: "ar",
    },
    update: {
      encryptedApiKey: encryptSecret(apiKey.trim()),
    },
  })
}

export async function deleteSerperSettings() {
  await db.integrationSettings.deleteMany({ where: { id: SERPER_ID } })
}

export async function testSerperConnection(): Promise<{ success: boolean; message: string }> {
  const key = await getSerperApiKey()
  if (!key) return { success: false, message: "Sin API Key configurada" }

  try {
    const res = await fetch(SERPER_IMAGES_URL, {
      method: "POST",
      headers: {
        "X-API-KEY": key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: "test", num: 1, gl: "ar", hl: "es" }),
      signal: AbortSignal.timeout(15_000),
    })
    if (res.ok) return { success: true, message: "Conectado correctamente" }
    if (res.status === 401 || res.status === 403) {
      return { success: false, message: "API Key inválida" }
    }
    const text = await res.text().catch(() => "")
    return { success: false, message: `Error ${res.status}${text ? `: ${text.slice(0, 80)}` : ""}` }
  } catch {
    return { success: false, message: "Error de conexión" }
  }
}

type SerperImagesResponse = {
  images?: Array<{
    title?: string
    imageUrl?: string
    thumbnailUrl?: string
    source?: string
    domain?: string
    imageWidth?: number
    imageHeight?: number
  }>
}

export async function searchSerperImages(
  query: string,
  opts?: { num?: number; gl?: string; hl?: string },
): Promise<SerperImageResult[]> {
  const key = await getSerperApiKey()
  if (!key) {
    throw new Error(
      "Serper no está configurado. Agregá SERPER_API_KEY en .env o Configuración → Integración API.",
    )
  }

  const q = query.trim()
  if (!q) throw new Error("Escribí un término de búsqueda")

  const res = await fetch(SERPER_IMAGES_URL, {
    method: "POST",
    headers: {
      "X-API-KEY": key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q,
      num: Math.min(opts?.num ?? 12, 20),
      gl: opts?.gl ?? "ar",
      hl: opts?.hl ?? "es",
    }),
    signal: AbortSignal.timeout(20_000),
  })

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error("API Key de Serper inválida")
    }
    throw new Error(`Serper respondió con error ${res.status}`)
  }

  const data = (await res.json()) as SerperImagesResponse
  const images = data.images ?? []

  return images
    .filter((img) => img.imageUrl)
    .map((img) => ({
      title: img.title?.trim() || "Sin título",
      imageUrl: img.imageUrl!,
      thumbnailUrl: img.thumbnailUrl ?? null,
      source: img.source ?? null,
      domain: img.domain ?? null,
      imageWidth: img.imageWidth ?? null,
      imageHeight: img.imageHeight ?? null,
    }))
}
