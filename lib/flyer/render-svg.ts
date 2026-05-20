import "server-only"

import { readFile } from "fs/promises"
import { join } from "path"
import { mapPayloadToTemplateReplacements } from "@/lib/flyer/map-payload-to-template"
import type { FlyerPayload } from "@/lib/flyer/types"

const TEMPLATE_FILE = "tgs_pc_gamer_1080_v2.svg"

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

async function loadFlyerTemplate(): Promise<string> {
  const path = join(process.cwd(), "lib", "flyer", "templates", TEMPLATE_FILE)
  return readFile(path, "utf8")
}

export async function buildFlyerSvg(
  payload: FlyerPayload,
  logoDataUri: string,
): Promise<string> {
  const template = await loadFlyerTemplate()
  const replacements = mapPayloadToTemplateReplacements(payload, logoDataUri)

  let svg = template
  for (const [key, raw] of Object.entries(replacements)) {
    const token = `{{${key}}}`
    const value = key === "LOGO_URL" || key === "IMAGEN_URL" ? raw : esc(raw)
    svg = svg.split(token).join(value)
  }

  return svg
}
