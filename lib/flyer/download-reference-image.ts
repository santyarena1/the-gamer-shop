import "server-only"

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"])

export async function downloadImageFromUrl(imageUrl: string): Promise<{
  buffer: Buffer
  mime: string
  ext: string
}> {
  let parsed: URL
  try {
    parsed = new URL(imageUrl)
  } catch {
    throw new Error("URL de imagen inválida")
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Solo se permiten URLs http/https")
  }

  const res = await fetch(imageUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; TheGamerShop/1.0; +https://thegamershop.com)",
      Accept: "image/*",
    },
    signal: AbortSignal.timeout(25_000),
    redirect: "follow",
  })

  if (!res.ok) {
    throw new Error(`No se pudo descargar la imagen (${res.status})`)
  }

  const contentType = res.headers.get("content-type")?.split(";")[0]?.trim() ?? ""
  const mime = ALLOWED_TYPES.has(contentType)
    ? contentType
    : contentType.startsWith("image/")
      ? contentType
      : "image/jpeg"

  if (!mime.startsWith("image/")) {
    throw new Error("La URL no devolvió una imagen válida")
  }

  const arrayBuffer = await res.arrayBuffer()
  if (arrayBuffer.byteLength > MAX_BYTES) {
    throw new Error("La imagen supera el máximo de 5 MB")
  }

  const buffer = Buffer.from(arrayBuffer)
  const ext =
    mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : mime === "image/gif" ? "gif" : "jpg"

  return { buffer, mime, ext }
}
