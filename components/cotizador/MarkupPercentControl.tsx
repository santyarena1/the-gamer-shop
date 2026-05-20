"use client"

import {
  DEFAULT_MARKUP_PERCENT,
  MARKUP_PERCENT_OPTIONS,
} from "@/lib/quote-pricing"

type Props = {
  value: number
  onChange: (percent: number) => void
}

export default function MarkupPercentControl({ value, onChange }: Props) {
  const isPreset = MARKUP_PERCENT_OPTIONS.includes(
    value as (typeof MARKUP_PERCENT_OPTIONS)[number],
  )

  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="block space-y-1.5 min-w-[200px]">
        <span className="text-xs text-white/50">Margen sobre costo</span>
        <select
          value={isPreset ? String(value) : "custom"}
          onChange={(e) => {
            const v = e.target.value
            if (v === "custom") return
            onChange(Number(v))
          }}
          className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500"
        >
          {MARKUP_PERCENT_OPTIONS.map((p) => (
            <option key={p} value={p} className="bg-[#141414]">
              +{p}%
              {p === DEFAULT_MARKUP_PERCENT ? " (por defecto)" : ""}
            </option>
          ))}
          <option value="custom" className="bg-[#141414]">
            Otro porcentaje…
          </option>
        </select>
      </label>
      {!isPreset && (
        <label className="block space-y-1.5 w-28">
          <span className="text-xs text-white/50">%</span>
          <input
            type="number"
            min={0}
            max={500}
            step={1}
            value={value}
            onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
            className="w-full bg-[#141414] border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-green-500"
          />
        </label>
      )}
      <p className="text-xs text-white/40 pb-2.5">
        Venta = costo × (1 + {value}%)
      </p>
    </div>
  )
}
