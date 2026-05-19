export type PcComponentSlot =
  | "CPU"
  | "MOTHER"
  | "RAM"
  | "GPU"
  | "STORAGE"
  | "PSU"
  | "CASE"
  | "COOLER"
  | "MONITOR"
  | "OTHER"

export const PC_SLOTS: { slot: PcComponentSlot; label: string; hint?: string }[] = [
  { slot: "CPU", label: "Procesador" },
  { slot: "MOTHER", label: "Motherboard" },
  { slot: "RAM", label: "Memoria RAM" },
  { slot: "GPU", label: "Placa de video" },
  { slot: "STORAGE", label: "Almacenamiento", hint: "SSD / HDD" },
  { slot: "PSU", label: "Fuente" },
  { slot: "CASE", label: "Gabinete" },
  { slot: "COOLER", label: "Cooler" },
  { slot: "MONITOR", label: "Monitor" },
  { slot: "OTHER", label: "Otros" },
]

export const SLOT_LABELS: Record<PcComponentSlot, string> = Object.fromEntries(
  PC_SLOTS.map((s) => [s.slot, s.label]),
) as Record<PcComponentSlot, string>

export const QUOTE_DOCUMENT_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  CONFIRMED: "Confirmado",
  SENT: "Enviado",
  ARCHIVED: "Archivado",
}

export type LineItemInput = {
  slot: PcComponentSlot
  sourceType: "ACUSTOCK" | "CUSTOM"
  sourceRef: string
  name: string
  unitPrice: number
  qty: number
}

export type SearchProductResult = {
  sourceType: "ACUSTOCK" | "CUSTOM"
  sourceRef: string
  name: string
  sku: string
  category: string
  unitPrice: number
  stock: number | null
  brand: string
}
