"use client"

import { useMemo, useState } from "react"
import type { PcComponentSlot } from "@/lib/quote-builder-constants"
import {
  PC_SLOTS,
  SLOT_LABELS,
  type LineItemInput,
  type SearchProductResult,
} from "@/lib/quote-builder-constants"
import { searchResultToLineItem } from "@/lib/quote-builder"
import type { SlotSelections } from "@/lib/quote-combinations"
import ProductSearchCombobox from "./ProductSearchCombobox"
import LineItemCostFields from "./LineItemCostFields"

type Props = {
  selections: SlotSelections
  onChange: (selections: SlotSelections) => void
  markupPercent: number
}

export default function CombinationSlotGrid({
  selections,
  onChange,
  markupPercent,
}: Props) {
  const [selectedSlot, setSelectedSlot] = useState<PcComponentSlot>("CPU")
  const [searchOpen, setSearchOpen] = useState(false)

  const filledSlots = useMemo(
    () => PC_SLOTS.filter(({ slot }) => (selections[slot]?.length ?? 0) > 0),
    [selections],
  )

  const items = selections[selectedSlot] ?? []
  const meta = PC_SLOTS.find((s) => s.slot === selectedSlot)!

  function setSlotItems(slot: PcComponentSlot, nextItems: LineItemInput[]) {
    const next = { ...selections }
    if (nextItems.length === 0) delete next[slot]
    else next[slot] = nextItems
    onChange(next)
  }

  function handleAdd(result: SearchProductResult) {
    const line = searchResultToLineItem(result, selectedSlot, markupPercent)
    if (items.some((i) => i.sourceRef === line.sourceRef)) {
      setSearchOpen(false)
      return
    }
    setSlotItems(selectedSlot, [...items, line])
    setSearchOpen(false)
  }

  function updateItem(sourceRef: string, updated: LineItemInput) {
    setSlotItems(
      selectedSlot,
      items.map((i) => (i.sourceRef === sourceRef ? updated : i)),
    )
  }

  function removeItem(sourceRef: string) {
    setSlotItems(
      selectedSlot,
      items.filter((i) => i.sourceRef !== sourceRef),
    )
  }

  return (
    <>
      <div className="space-y-4">
        {/* Resumen de categorías con productos */}
        {filledSlots.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {filledSlots.map(({ slot, label }) => {
              const count = selections[slot]!.length
              return (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setSelectedSlot(slot)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    selectedSlot === slot
                      ? "border-green-500/50 bg-green-500/15 text-green-300"
                      : "border-white/10 bg-white/5 text-white/50 hover:border-white/20"
                  }`}
                >
                  {label}
                  <span className="ml-1 opacity-70">
                    ({count === 1 ? "fijo" : `${count} var.`})
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* Desplegable de categoría */}
        <label className="block space-y-1.5">
          <span className="text-xs text-white/50">Categoría</span>
          <select
            value={selectedSlot}
            onChange={(e) => setSelectedSlot(e.target.value as PcComponentSlot)}
            className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-green-500 appearance-none cursor-pointer"
          >
            {PC_SLOTS.map(({ slot, label, subtitle }) => {
              const count = selections[slot]?.length ?? 0
              return (
                <option key={slot} value={slot} className="bg-[#141414]">
                  {label} — {subtitle}
                  {count > 0 ? ` (${count})` : ""}
                </option>
              )
            })}
          </select>
        </label>

        {/* Panel de la categoría elegida */}
        <div
          className={`rounded-xl border p-4 space-y-3 ${
            items.length > 0
              ? "border-green-500/30 bg-green-500/[0.04]"
              : "border-white/10 bg-[#141414]"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">{meta.label}</p>
              <p className="text-xs text-white/40">{meta.subtitle}</p>
            </div>
            {items.length > 1 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300">
                {items.length} variantes
              </span>
            )}
            {items.length === 1 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/50">
                1 fijo
              </span>
            )}
          </div>

          {items.length === 0 ? (
            <p className="text-sm text-white/35">Sin productos en esta categoría.</p>
          ) : (
            <ul className="space-y-2">
              {items.map((item) => (
                <li
                  key={item.sourceRef}
                  className="flex items-start gap-2 rounded-lg bg-[#0f0f0f] border border-white/10 px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm line-clamp-2 pr-2">{item.name}</p>
                    <LineItemCostFields
                      item={item}
                      markupPercent={markupPercent}
                      onChange={(updated) => updateItem(item.sourceRef, updated)}
                      compact
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.sourceRef)}
                    className="text-white/30 hover:text-red-400 text-xs shrink-0 self-start"
                    aria-label="Quitar"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="w-full py-2.5 text-sm rounded-xl border border-dashed border-white/15 text-white/55 hover:border-green-500/40 hover:text-green-400 transition-colors"
          >
            + Buscar producto en {SLOT_LABELS[selectedSlot].toLowerCase()}
          </button>

          {items.length > 1 && (
            <p className="text-[11px] text-amber-300/80">
              Varias opciones aquí generan un presupuesto por cada una (combinado con el
              resto).
            </p>
          )}
        </div>
      </div>

      {searchOpen && (
        <ProductSearchCombobox
          slot={selectedSlot}
          markupPercent={markupPercent}
          onSelect={handleAdd}
          onClose={() => setSearchOpen(false)}
        />
      )}
    </>
  )
}
