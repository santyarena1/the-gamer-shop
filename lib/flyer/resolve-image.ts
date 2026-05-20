import "server-only"

import { readFile } from "fs/promises"
import { join } from "path"

/** Quita query/hash en rutas locales (`/uploads/logo.png?v=1` → `/uploads/logo.png`). */
export function normalizeImageRef(ref: string): string {
  const trimmed = ref.trim()
  if (!trimmed || trimmed.startsWith("data:")) return trimmed
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed
  const base = trimmed.split("?")[0]?.split("#")[0] ?? trimmed
  return base
}

function mimeFromPath(path: string): string {
  const ext = normalizeImageRef(path).split(".").pop()?.toLowerCase()
  if (ext === "png") return "image/png"
  if (ext === "webp") return "image/webp"
  if (ext === "svg") return "image/svg+xml"
  if (ext === "gif") return "image/gif"
  return "image/jpeg"
}

export async function resolveImageBuffer(ref: string): Promise<Buffer | null> {
  const trimmed = ref.trim()
  if (!trimmed) return null

  if (trimmed.startsWith("data:")) {
    const b64 = trimmed.split(",")[1]
    if (!b64) return null
    return Buffer.from(b64, "base64")
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const res = await fetch(trimmed, {
        signal: AbortSignal.timeout(20_000),
        headers: { Accept: "image/*" },
      })
      if (!res.ok) return null
      return Buffer.from(await res.arrayBuffer())
    } catch {
      return null
    }
  }

  try {
    const localRef = normalizeImageRef(trimmed)
    const abs = localRef.startsWith("/")
      ? join(process.cwd(), "public", localRef.replace(/^\//, ""))
      : localRef
    return await readFile(abs)
  } catch {
    return null
  }
}

export async function resolveImageDataUri(
  ref: string,
  mime?: string,
): Promise<string | null> {
  const buf = await resolveImageBuffer(ref)
  if (!buf) return null
  const type = mime ?? mimeFromPath(ref)
  return `data:${type};base64,${buf.toString("base64")}`
}

/** @deprecated use resolveImageDataUri */
export async function fileToDataUri(
  filePath: string,
  mime?: string,
): Promise<string | null> {
  return resolveImageDataUri(filePath, mime)
}

export async function bufferToDataUri(buffer: Buffer, mime: string): Promise<string> {
  return `data:${mime};base64,${buffer.toString("base64")}`
}
