"use client"

import { useState } from "react"
import type { PcComponentSlot } from "@/lib/quote-builder-constants"
import {
  PC_SLOTS,
  type LineItemInput,
  type SearchProductResult,
} from "@/lib/quote-builder-constants"
import { searchResultToLineItem } from "@/lib/quote-builder"
import ProductSearchCombobox from "./ProductSearchCombobox"
import LineItemCostFields from "./LineItemCostFields"

type Props = {
  items: LineItemInput[]
  onChange: (items: LineItemInput[]) => void
  markupPercent: number
  readOnly?: boolean
}

export default function BuildSlotGrid({ items, onChange, markupPercent, readOnly }: Props) {
  const [activeSlot, setActiveSlot] = useState<PcComponentSlot | null>(null)
  const bySlot = new Map(items.map((i) => [i.slot, i]))

  function handleSelect(result: SearchProductResult) {
    if (!activeSlot) return
    const line = searchResultToLineItem(result, activeSlot, markupPercent)
    const next = items.filter((i) => i.slot !== activeSlot)
    onChange([...next, line])
    setActiveSlot(null)
  }

  function updateItem(slot: PcComponentSlot, updated: LineItemInput) {
    onChange(items.map((i) => (i.slot === slot ? updated : i)))
  }

  function removeSlot(slot: PcComponentSlot) {
    onChange(items.filter((i) => i.slot !== slot))
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {PC_SLOTS.map(({ slot, label, subtitle }) => {
          const item = bySlot.get(slot)
          return (
            <div
              key={slot}
              className={`rounded-xl border p-4 transition-colors ${
                item
                  ? "border-green-500/30 bg-green-500/5"
                  : "border-white/10 bg-[#141414] border-dashed"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="text-xs text-white/40">{label}</p>
                  {subtitle && <p className="text-[10px] text-white/25">{subtitle}</p>}
                </div>
                {item && !readOnly && (
                  <button
                    type="button"
                    onClick={() => removeSlot(slot)}
                    className="text-white/30 hover:text-red-400 text-xs"
                    aria-label="Quitar"
                  >
                    ✕
                  </button>
                )}
              </div>
              {item ? (
                <div className="space-y-1">
                  <p className="text-sm font-medium line-clamp-2 leading-snug">{item.name}</p>
                  <p className="text-[10px] text-white/30">
                    {item.sourceType === "CUSTOM" ? "Interno" : "AcuStock"} · x{item.qty}
                  </p>
                  {!readOnly && (
                    <LineItemCostFields
                      item={item}
                      markupPercent={markupPercent}
                      onChange={(updated) => updateItem(slot, updated)}
                      compact
                    />
                  )}
                </div>
              ) : readOnly ? (
                <p className="text-xs text-white/25">Vacío</p>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveSlot(slot)}
                  className="w-full mt-2 py-2 text-xs rounded-lg border border-white/10 text-white/50 hover:border-green-500/40 hover:text-green-400 transition-colors"
                >
                  + Buscar componente
                </button>
              )}
            </div>
          )
        })}
      </div>
      {activeSlot && (
        <ProductSearchCombobox
          slot={activeSlot}
          markupPercent={markupPercent}
          onSelect={handleSelect}
          onClose={() => setActiveSlot(null)}
        />
      )}
    </>
  )
}
