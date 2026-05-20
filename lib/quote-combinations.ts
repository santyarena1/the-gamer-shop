import type { PcComponentSlot } from "@/lib/quote-builder-constants"
import { PC_SLOTS, type LineItemInput } from "@/lib/quote-builder-constants"

export type SlotSelections = Partial<Record<PcComponentSlot, LineItemInput[]>>

export const MAX_QUOTE_COMBINATIONS = 48

/** Producto cartesiano de las opciones por categoría (orden PC_SLOTS). */
export function buildQuoteCombinations(
  selections: SlotSelections,
): LineItemInput[][] {
  const tiers = PC_SLOTS.map(({ slot }) => selections[slot]?.filter(Boolean) ?? []).filter(
    (items) => items.length > 0,
  )

  if (tiers.length === 0) return []

  let combos: LineItemInput[][] = [[]]

  for (const items of tiers) {
    const next: LineItemInput[][] = []
    for (const combo of combos) {
      for (const item of items) {
        next.push([...combo, item])
      }
    }
    combos = next
    if (combos.length > MAX_QUOTE_COMBINATIONS) break
  }

  return combos.slice(0, MAX_QUOTE_COMBINATIONS)
}

export function countQuoteCombinations(selections: SlotSelections): number {
  let total = 1
  let hasAny = false

  for (const { slot } of PC_SLOTS) {
    const n = selections[slot]?.length ?? 0
    if (n > 0) {
      hasAny = true
      total *= n
      if (total > MAX_QUOTE_COMBINATIONS) return MAX_QUOTE_COMBINATIONS + 1
    }
  }

  return hasAny ? total : 0
}

/** Etiqueta corta para preview (componentes que tienen más de una opción). */
export function combinationPreviewLabel(items: LineItemInput[]): string {
  const bySlot = new Map(items.map((i) => [i.slot, i]))
  const varying = items
    .map((i) => i.name)
    .filter(Boolean)
    .map((n) => (n.length > 36 ? `${n.slice(0, 36)}…` : n))

  if (varying.length <= 2) return varying.join(" · ")
  return `${varying[0]} · +${varying.length - 1} más`
}
