import "server-only"

import { db } from "@/lib/db"
import { decryptSecret, encryptSecret, maskApiKey } from "@/lib/integration-crypto"

const OPENAI_ID = "openai"

import type { OpenAiPublicSettings } from "@/lib/openai-integration-types"

export type { OpenAiPublicSettings } from "@/lib/openai-integration-types"

export async function getOpenAiPublicSettings(): Promise<OpenAiPublicSettings> {
  const env = process.env.OPENAI_API_KEY?.trim()
  if (env) {
    return {
      configured: true,
      maskedKey: maskApiKey(env),
      defaultModel: "gpt-image-1",
    }
  }

  try {
    const row = await db.integrationSettings.findUnique({ where: { id: OPENAI_ID } })
    if (!row?.encryptedApiKey) {
      return {
        configured: false,
        maskedKey: null,
        defaultModel: row?.defaultModel ?? "gpt-image-1",
      }
    }
    try {
      const key = decryptSecret(row.encryptedApiKey)
      return {
        configured: true,
        maskedKey: maskApiKey(key),
        defaultModel: row.defaultModel,
      }
    } catch {
      return { configured: false, maskedKey: null, defaultModel: row.defaultModel }
    }
  } catch {
    return { configured: false, maskedKey: null, defaultModel: "gpt-image-1" }
  }
}

export async function getOpenAiApiKey(): Promise<string | null> {
  const diag = await getOpenAiFlyerDiagnostics()
  return diag.key
}

export type OpenAiFlyerDiagnostics = {
  ready: boolean
  source: "env" | "database" | null
  message: string
  key: string | null
}

/** Estado real de la API Key para generación de flyers (env o BD cifrada). */
export async function getOpenAiFlyerDiagnostics(): Promise<OpenAiFlyerDiagnostics> {
  const env = process.env.OPENAI_API_KEY?.trim()
  if (env) {
    return {
      ready: true,
      source: "env",
      message: "API Key cargada desde .env",
      key: env,
    }
  }

  try {
    const row = await db.integrationSettings.findUnique({ where: { id: OPENAI_ID } })
    if (!row?.encryptedApiKey) {
      return {
        ready: false,
        source: null,
        message:
          "Sin API Key de OpenAI. Completá OPENAI_API_KEY en .env o guardala en Configuración → Integración API.",
        key: null,
      }
    }
    try {
      const key = decryptSecret(row.encryptedApiKey).trim()
      if (!key) {
        return {
          ready: false,
          source: null,
          message: "La API Key guardada en configuración está vacía. Volvé a guardarla.",
          key: null,
        }
      }
      return {
        ready: true,
        source: "database",
        message: "API Key cargada desde Configuración → Integración API",
        key,
      }
    } catch {
      return {
        ready: false,
        source: null,
        message:
          "No se pudo leer la API Key guardada (cifrado). Volvé a guardarla en Configuración → Integración API.",
        key: null,
      }
    }
  } catch {
    return {
      ready: false,
      source: null,
      message:
        "No se pudo acceder a la configuración de OpenAI. Ejecutá las migraciones de Prisma (integration_settings).",
      key: null,
    }
  }
}

export async function saveOpenAiSettings(apiKey: string, defaultModel: string) {
  await db.integrationSettings.upsert({
    where: { id: OPENAI_ID },
    create: {
      id: OPENAI_ID,
      encryptedApiKey: encryptSecret(apiKey.trim()),
      defaultModel: defaultModel || "gpt-image-1",
    },
    update: {
      encryptedApiKey: encryptSecret(apiKey.trim()),
      defaultModel: defaultModel || "gpt-image-1",
    },
  })
}

export async function updateOpenAiModel(defaultModel: string) {
  await db.integrationSettings.upsert({
    where: { id: OPENAI_ID },
    create: { id: OPENAI_ID, defaultModel },
    update: { defaultModel },
  })
}

export async function deleteOpenAiSettings() {
  await db.integrationSettings.deleteMany({ where: { id: OPENAI_ID } })
}

export async function testOpenAiConnection(): Promise<{ success: boolean; message: string }> {
  const key = await getOpenAiApiKey()
  if (!key) return { success: false, message: "Sin API Key configurada" }

  try {
    const res = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(15_000),
    })
    if (res.ok) return { success: true, message: "Conectado correctamente" }
    if (res.status === 401) return { success: false, message: "Token inválido" }
    return { success: false, message: `Error ${res.status}` }
  } catch {
    return { success: false, message: "Error de conexión" }
  }
}
