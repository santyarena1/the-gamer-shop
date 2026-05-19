import type { LineItemInput } from "@/lib/quote-builder-constants"
import type { PcComponentSlot } from "@/lib/quote-builder-constants"
import {
  DEFAULT_BENEFITS,
  FLYER_TEMPLATE_ID,
  type FlyerComponent,
  type FlyerComponentIcon,
  type FlyerPayload,
} from "@/lib/flyer/types"

/** Filas iniciales al crear un flyer vacío (el usuario las edita). */
const DEFAULT_COMPONENT_ROWS: FlyerComponent[] = [
  { icon: "cpu", label: "PROCESADOR", value: "" },
  { icon: "motherboard", label: "MOTHERBOARD", value: "" },
  { icon: "ram_storage", label: "MEMORIA RAM + DISCO", value: "" },
  { icon: "gpu", label: "PLACA DE VIDEO", value: "" },
  { icon: "psu", label: "FUENTE DE PODER", value: "" },
]

const SLOT_ICON: Record<PcComponentSlot, FlyerComponentIcon> = {
  CPU: "cpu",
  MOTHER: "motherboard",
  RAM: "ram_storage",
  GPU: "gpu",
  STORAGE: "ram_storage",
  PSU: "psu",
  CASE: "other",
  COOLER: "cooler",
  MONITOR: "monitor",
  OTHER: "other",
}

const SLOT_LABEL: Record<PcComponentSlot, string> = {
  CPU: "PROCESADOR",
  MOTHER: "MOTHERBOARD",
  RAM: "MEMORIA RAM",
  GPU: "PLACA DE VIDEO",
  STORAGE: "ALMACENAMIENTO",
  PSU: "FUENTE DE PODER",
  CASE: "GABINETE",
  COOLER: "COOLER",
  MONITOR: "MONITOR",
  OTHER: "OTROS",
}

export function parseCpuTitle(cpuName: string): { line1: string; line2: string } {
  const upper = cpuName.toUpperCase().trim()
  const ryzen = upper.match(/RYZEN\s*(\d+)\s*(\S+)/)
  if (ryzen) return { line1: `RYZEN ${ryzen[1]}`, line2: ryzen[2] }

  const core = upper.match(/(CORE\s*I[3579][\s-]*\d+)\s*(\S+)?/)
  if (core) return { line1: core[1].replace(/\s+/g, " "), line2: core[2] ?? "" }

  const parts = upper.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return { line1: parts.slice(0, -1).join(" "), line2: parts[parts.length - 1]! }
  }
  return { line1: upper.slice(0, 24), line2: "" }
}

function itemBySlot(items: LineItemInput[], slot: PcComponentSlot) {
  return items.find((i) => i.slot === slot)
}

export function lineItemsToFlyerComponents(items: LineItemInput[]): FlyerComponent[] {
  const ram = itemBySlot(items, "RAM")
  const storage = itemBySlot(items, "STORAGE")
  const ramStorageValue = [ram?.name, storage?.name].filter(Boolean).join("\n")

  const rows: FlyerComponent[] = []

  const cpu = itemBySlot(items, "CPU")
  if (cpu) {
    rows.push({
      icon: "cpu",
      label: "PROCESADOR",
      value: cpu.name.toUpperCase(),
    })
  }

  const mother = itemBySlot(items, "MOTHER")
  if (mother) {
    rows.push({
      icon: "motherboard",
      label: "MOTHERBOARD",
      value: mother.name.toUpperCase(),
    })
  }

  if (ramStorageValue) {
    rows.push({
      icon: "ram_storage",
      label: ram && storage ? "MEMORIA RAM + DISCO" : ram ? SLOT_LABEL.RAM : "ALMACENAMIENTO",
      value: ramStorageValue.toUpperCase(),
    })
  }

  const gpu = itemBySlot(items, "GPU")
  if (gpu) {
    rows.push({
      icon: "gpu",
      label: "PLACA DE VIDEO",
      value: gpu.name.toUpperCase(),
    })
  }

  const psu = itemBySlot(items, "PSU")
  if (psu) {
    rows.push({
      icon: "psu",
      label: "FUENTE DE PODER",
      value: psu.name.toUpperCase(),
    })
  }

  for (const item of items) {
    if (["CPU", "MOTHER", "RAM", "GPU", "STORAGE", "PSU"].includes(item.slot)) continue
    rows.push({
      icon: SLOT_ICON[item.slot],
      label: SLOT_LABEL[item.slot],
      value: item.name.toUpperCase(),
    })
  }

  return rows
}

export function buildFlyerPayloadFromLineItems(
  items: LineItemInput[],
  opts?: {
    categoryLabel?: string
    titleLine1?: string
    titleLine2?: string
    logoPath?: string | null
    pcImageBase64?: string | null
  },
): FlyerPayload {
  const cpu = itemBySlot(items, "CPU")
  const parsed = cpu ? parseCpuTitle(cpu.name) : { line1: "RYZEN 5", line2: "8400F" }
  const components =
    items.length > 0 ? lineItemsToFlyerComponents(items) : DEFAULT_COMPONENT_ROWS

  return {
    template: FLYER_TEMPLATE_ID,
    output: { width: 1080, height: 1080, format: "png" },
    brand: {
      logoPath: opts?.logoPath ?? null,
      primaryColor: "#ff0000",
      secondaryColor: "#ffffff",
      backgroundColor: "#050505",
      accentColor: "#b00000",
    },
    product: {
      categoryLabel: opts?.categoryLabel ?? "PC GAMER",
      mainTitleLine1: opts?.titleLine1 ?? parsed.line1,
      mainTitleLine2: opts?.titleLine2 ?? parsed.line2,
      pcImageBase64: opts?.pcImageBase64 ?? null,
    },
    components,
    benefits: DEFAULT_BENEFITS,
  }
}

export function flyerDisplayTitle(payload: FlyerPayload): string {
  return `${payload.product.mainTitleLine1} ${payload.product.mainTitleLine2}`.trim()
}
