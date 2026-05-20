"use client"

import type { LineItemInput } from "@/lib/quote-builder-constants"
import { salePriceFromCost } from "@/lib/quote-pricing"
import { formatCurrency } from "@/lib/utils"

type Props = {
  item: LineItemInput
  markupPercent: number
  onChange: (item: LineItemInput) => void
  compact?: boolean
}

export default function LineItemCostFields({
  item,
  markupPercent,
  onChange,
  compact,
}: Props) {
  const sale = salePriceFromCost(item.unitCost, markupPercent)

  function setCost(raw: string) {
    const unitCost = Math.max(0, parseFloat(raw) || 0)
    onChange({
      ...item,
      unitCost,
      unitPrice: salePriceFromCost(unitCost, markupPercent),
    })
  }

  const inputClass = compact
    ? "w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-green-500"
    : "w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-green-500"

  return (
    <div className={compact ? "grid grid-cols-2 gap-2 mt-2" : "grid grid-cols-2 gap-3 mt-2"}>
      <label className="block space-y-0.5">
        <span className="text-[10px] text-white/45">Costo</span>
        <input
          type="number"
          min={0}
          step={0.01}
          value={item.unitCost || ""}
          onChange={(e) => setCost(e.target.value)}
          placeholder="0"
          className={inputClass}
        />
      </label>
      <div className="block space-y-0.5">
        <span className="text-[10px] text-white/45">Venta (+{markupPercent}%)</span>
        <p className={`font-semibold text-green-400 ${compact ? "text-xs py-1.5" : "text-sm py-2"}`}>
          {formatCurrency(sale)}
        </p>
      </div>
    </div>
  )
}
