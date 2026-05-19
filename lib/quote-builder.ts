import type { PcComponentSlot } from "@/lib/quote-builder-constants"
import {
  PC_SLOTS,
  type LineItemInput,
  type SearchProductResult,
} from "@/lib/quote-builder-constants"

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
    if (!map.has(item.slot) || item.slot === "STORAGE" || item.slot === "OTHER") {
      map.set(item.slot, item)
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
    return parsed.filter((l) => l.slot && l.name)
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
): LineItemInput {
  return {
    slot,
    sourceType: result.sourceType,
    sourceRef: result.sourceRef,
    name: result.name,
    unitPrice: result.unitPrice,
    qty: 1,
  }
}
