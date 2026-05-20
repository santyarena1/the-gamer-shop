import type { PcComponentSlot } from "@/lib/quote-builder-constants"
import {
  normalizePcSlot,
  PC_SLOTS,
  type LineItemInput,
  type SearchProductResult,
} from "@/lib/quote-builder-constants"
import { salePriceFromCost } from "@/lib/quote-pricing"

type PricedLine = { unitPrice: number | string | { toString(): string }; qty: number }

export function computeBuildTotal(items: PricedLine[] | LineItemInput[]) {
  return items.reduce((sum, item) => {
    const price = typeof item.unitPrice === "number" ? item.unitPrice : Number(item.unitPrice)
    return sum + price * item.qty
  }, 0)
}

export function lineItemsBySlot<T extends { slot: PcComponentSlot }>(items: T[]) {
  const map = new Map<PcComponentSlot, T>()
  for (const item of items) {
    const slot = normalizePcSlot(item.slot)
    if (!map.has(slot) || slot === "OTHER") {
      map.set(slot, item)
    }
  }
  return map
}

export function emptySlotLineItems(): LineItemInput[] {
  return []
}

export function applyTemplateSlots(
  templateJson: string,
): LineItemInput[] {
  try {
    const parsed = JSON.parse(templateJson) as LineItemInput[]
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((l) => l.slot && l.name)
      .map((l) => {
        const unitCost = Number(l.unitCost ?? l.unitPrice ?? 0)
        const unitPrice = Number(l.unitPrice ?? unitCost)
        return {
          ...l,
          slot: normalizePcSlot(l.slot),
          unitCost,
          unitPrice,
          qty: l.qty ?? 1,
        }
      })
  } catch {
    return []
  }
}

export function serializeTemplateSlots(items: LineItemInput[]): string {
  return JSON.stringify(
    items.map((l) => ({
      slot: l.slot,
      sourceType: l.sourceType,
      sourceRef: l.sourceRef,
      name: l.name,
      unitCost: l.unitCost,
      unitPrice: l.unitPrice,
      qty: l.qty,
    })),
  )
}

export function variantFromBase(
  base: LineItemInput[],
  slot: PcComponentSlot,
  replacement: LineItemInput,
): LineItemInput[] {
  const without = base.filter((l) => l.slot !== slot)
  return [...without, replacement]
}

export function getMissingSlots(items: LineItemInput[]) {
  const filled = new Set(items.map((i) => i.slot))
  return PC_SLOTS.filter((s) => !filled.has(s.slot))
}

export function formatBuildSummary(items: LineItemInput[]) {
  return items
    .map((l) => `${l.name} x${l.qty}`)
    .join("\n")
}

export function searchResultToLineItem(
  result: SearchProductResult,
  slot: PcComponentSlot,
  markupPercent: number,
): LineItemInput {
  const unitCost = result.unitPrice
  return {
    slot,
    sourceType: result.sourceType,
    sourceRef: result.sourceRef,
    name: result.name,
    unitCost,
    unitPrice: salePriceFromCost(unitCost, markupPercent),
    qty: 1,
  }
}
