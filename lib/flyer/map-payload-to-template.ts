import { DEFAULT_BENEFITS, type FlyerComponentIcon, type FlyerPayload } from "@/lib/flyer/types"

const TRANSPARENT_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"

function findByIcon(payload: FlyerPayload, icon: FlyerComponentIcon) {
  return payload.components.find((c) => c.icon === icon)
}

function splitTwoLines(value: string): [string, string] {
  const lines = value
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
  return [lines[0] ?? "", lines[1] ?? ""]
}

function singleLine(value: string): string {
  return value.replace(/\n/g, " ").trim()
}

export function mapPayloadToTemplateReplacements(
  payload: FlyerPayload,
  logoDataUri: string,
): Record<string, string> {
  const cpu = findByIcon(payload, "cpu")
  const mb = findByIcon(payload, "motherboard")
  const ram = findByIcon(payload, "ram_storage")
  const gpu = findByIcon(payload, "gpu")
  const psu = findByIcon(payload, "psu")
  const [mem1, mem2] = splitTwoLines(ram?.value ?? "")
  const [vid1, vid2] = splitTwoLines(gpu?.value ?? "")

  const benefits = payload.benefits.length >= 4 ? payload.benefits : DEFAULT_BENEFITS

  return {
    LOGO_URL: logoDataUri,
    CATEGORIA: payload.product.categoryLabel.toUpperCase(),
    TITULO_LINEA1: payload.product.mainTitleLine1.toUpperCase(),
    TITULO_LINEA2: payload.product.mainTitleLine2.toUpperCase(),
    PROCESADOR: singleLine(cpu?.value ?? ""),
    MOTHERBOARD: singleLine(mb?.value ?? ""),
    MEMORIA_1: mem1.toUpperCase(),
    MEMORIA_2: mem2.toUpperCase(),
    VIDEO_1: vid1.toUpperCase(),
    VIDEO_2: vid2.toUpperCase(),
    FUENTE: singleLine(psu?.value ?? ""),
    IMAGEN_URL: payload.product.pcImageBase64?.trim() || TRANSPARENT_PIXEL,
    B1_L1: benefits[0]!.line1.toUpperCase(),
    B1_L2: benefits[0]!.line2.toUpperCase(),
    B2_L1: benefits[1]!.line1.toUpperCase(),
    B2_L2: benefits[1]!.line2.toUpperCase(),
    B3_L1: benefits[2]!.line1.toUpperCase(),
    B3_L2: benefits[2]!.line2.toUpperCase(),
    B4_L1: benefits[3]!.line1.toUpperCase(),
    B4_L2: benefits[3]!.line2.toUpperCase(),
  }
}
