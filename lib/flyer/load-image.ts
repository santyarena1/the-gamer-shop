import "server-only"

import { readFile } from "fs/promises"
import { join } from "path"

export async function fileToDataUri(
  filePath: string,
  mime?: string,
): Promise<string | null> {
  try {
    const abs = filePath.startsWith("/")
      ? join(process.cwd(), "public", filePath.replace(/^\//, ""))
      : filePath
    const buf = await readFile(abs)
    const ext = abs.split(".").pop()?.toLowerCase()
    const type =
      mime ??
      (ext === "png"
        ? "image/png"
        : ext === "webp"
          ? "image/webp"
          : ext === "svg"
            ? "image/svg+xml"
            : "image/jpeg")
    return `data:${type};base64,${buf.toString("base64")}`
  } catch {
    return null
  }
}

export async function bufferToDataUri(buffer: Buffer, mime: string): Promise<string> {
  return `data:${mime};base64,${buffer.toString("base64")}`
}
