/** Slots activos en el cotizador (orden del menú desplegable). */
export type PcComponentSlot =
  | "CPU"
  | "COOLER"
  | "MOTHER"
  | "RAM"
  | "GPU"
  | "SSD_NVME"
  | "HDD"
  | "CASE"
  | "PSU"
  | "MONITOR"
  | "KEYBOARD"
  | "MOUSE"
  | "HEADPHONES"
  /** @deprecated usar SSD_NVME o HDD */
  | "STORAGE"
  /** @deprecated */
  | "OTHER"

export const PC_SLOTS: {
  slot: PcComponentSlot
  label: string
  subtitle: string
}[] = [
  { slot: "CPU", label: "PROCESADOR", subtitle: "CPU" },
  { slot: "COOLER", label: "REFRIGERACIÓN", subtitle: "Cooler / AIO" },
  { slot: "MOTHER", label: "PLACA MADRE", subtitle: "Motherboard" },
  { slot: "RAM", label: "MEMORIA RAM", subtitle: "RAM" },
  { slot: "GPU", label: "TARJETA DE VIDEO", subtitle: "GPU" },
  { slot: "SSD_NVME", label: "DISCO SSD/NVME", subtitle: "SSD / NVMe" },
  { slot: "HDD", label: "DISCO HDD", subtitle: "HDD" },
  { slot: "CASE", label: "GABINETE", subtitle: "Case" },
  { slot: "PSU", label: "FUENTE DE PODER", subtitle: "PSU" },
  { slot: "MONITOR", label: "MONITOR", subtitle: "Monitor" },
  { slot: "KEYBOARD", label: "TECLADO", subtitle: "Teclado" },
  { slot: "MOUSE", label: "MOUSE", subtitle: "Mouse" },
  { slot: "HEADPHONES", label: "AURICULARES", subtitle: "Auriculares" },
]

export const SLOT_LABELS: Record<PcComponentSlot, string> = {
  CPU: "PROCESADOR",
  COOLER: "REFRIGERACIÓN",
  MOTHER: "PLACA MADRE",
  RAM: "MEMORIA RAM",
  GPU: "TARJETA DE VIDEO",
  SSD_NVME: "DISCO SSD/NVME",
  HDD: "DISCO HDD",
  CASE: "GABINETE",
  PSU: "FUENTE DE PODER",
  MONITOR: "MONITOR",
  KEYBOARD: "TECLADO",
  MOUSE: "MOUSE",
  HEADPHONES: "AURICULARES",
  STORAGE: "DISCO SSD/NVME",
  OTHER: "OTROS",
}

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
  /** Costo de compra (lo cargás vos). */
  unitCost: number
  /** Precio de venta = costo + margen %. */
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

/** Normaliza slots viejos al cargar plantillas o datos legacy. */
export function normalizePcSlot(slot: string): PcComponentSlot {
  if (slot === "STORAGE") return "SSD_NVME"
  if (PC_SLOTS.some((s) => s.slot === slot)) return slot as PcComponentSlot
  return "OTHER"
}
