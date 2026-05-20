import type { PcComponentSlot } from "@/lib/quote-builder-constants"
import type { LineItemInput } from "@/lib/quote-builder-constants"
import { lineItemsBySlot } from "@/lib/quote-builder"
import { SLOT_LABELS } from "@/lib/quote-builder-constants"

function shortName(name: string, max = 32): string {
  const t = name.trim()
  return t.length > max ? `${t.slice(0, max)}…` : t
}

function formatShortDate(d: Date): string {
  return d.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })
}

/** Título a partir de CPU/GPU u otros componentes del armado. */
export function buildQuoteTitleFromLineItems(items: LineItemInput[]): string {
  if (items.length === 0) {
    return `Presupuesto ${formatShortDate(new Date())}`
  }

  const bySlot = lineItemsBySlot(items)
  const highlights: PcComponentSlot[] = ["CPU", "GPU", "RAM", "MOTHER", "SSD_NVME"]
  const parts = highlights
    .map((slot) => bySlot.get(slot)?.name)
    .filter((n): n is string => Boolean(n?.trim()))
    .map((n) => shortName(n, 24))

  if (parts.length > 0) {
    return `PC — ${parts.slice(0, 2).join(" + ")}`
  }

  const first = items.find((i) => i.name.trim())?.name
  if (first) return `PC — ${shortName(first)}`

  return `Presupuesto ${formatShortDate(new Date())}`
}

/** Lote masivo: etiqueta manual o numeración automática. */
export function buildBatchQuoteTitle(
  index: number,
  total: number,
  label?: string | null,
): string {
  const trimmed = label?.trim()
  if (trimmed) return trimmed
  if (total > 1) return `Presupuesto ${index + 1}/${total}`
  return `Presupuesto ${formatShortDate(new Date())}`
}

/** Variantes en un solo documento. */
export function buildVariantsQuoteTitle(
  slot: PcComponentSlot,
  variantCount: number,
): string {
  const slotLabel = SLOT_LABELS[slot]
  const date = formatShortDate(new Date())
  if (variantCount <= 0) {
    return `Variantes — ${slotLabel} (${date})`
  }
  return `Variantes — ${slotLabel} (${variantCount + 1} configs, ${date})`
}
