import type { LineItemInput } from "@/lib/quote-builder-constants"

export const DEFAULT_MARKUP_PERCENT = 30

export const MARKUP_PERCENT_OPTIONS = [15, 20, 25, 30, 35, 40, 45, 50, 60, 75] as const

export function salePriceFromCost(cost: number, markupPercent: number): number {
  if (!Number.isFinite(cost) || cost < 0) return 0
  const markup = Number.isFinite(markupPercent) ? markupPercent : DEFAULT_MARKUP_PERCENT
  return Math.round(cost * (1 + markup / 100) * 100) / 100
}

/** Estima costo si solo tenemos precio de venta guardado. */
export function costFromSalePrice(salePrice: number, markupPercent: number): number {
  if (!Number.isFinite(salePrice) || salePrice <= 0) return 0
  const markup = Number.isFinite(markupPercent) ? markupPercent : DEFAULT_MARKUP_PERCENT
  return Math.round((salePrice / (1 + markup / 100)) * 100) / 100
}

export function applyMarkupToLineItem(
  item: LineItemInput,
  markupPercent: number,
): LineItemInput {
  const unitCost = item.unitCost ?? 0
  return {
    ...item,
    unitCost,
    unitPrice: salePriceFromCost(unitCost, markupPercent),
  }
}

export function applyMarkupToLineItems(
  items: LineItemInput[],
  markupPercent: number,
): LineItemInput[] {
  return items.map((item) => applyMarkupToLineItem(item, markupPercent))
}

export function normalizeLineItemPricing(
  item: LineItemInput,
  markupPercent: number,
): LineItemInput {
  const unitCost =
    item.unitCost != null && item.unitCost > 0
      ? item.unitCost
      : costFromSalePrice(item.unitPrice, markupPercent)
  return applyMarkupToLineItem({ ...item, unitCost }, markupPercent)
}
