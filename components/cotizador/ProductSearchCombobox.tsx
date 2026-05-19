"use client"

import { useEffect, useRef, useState } from "react"
import type { PcComponentSlot } from "@/lib/quote-builder-constants"
import { formatCurrency } from "@/lib/utils"
import type { SearchProductResult } from "@/lib/quote-builder-constants"
import { SLOT_LABELS } from "@/lib/quote-builder-constants"

type Props = {
  slot: PcComponentSlot
  onSelect: (result: SearchProductResult) => void
  onClose: () => void
}

export default function ProductSearchCombobox({ slot, onSelect, onClose }: Props) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchProductResult[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      return
    }

    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `/api/cotizador/search?q=${encodeURIComponent(query)}&limit=20`,
        )
        const data = await res.json()
        setResults(data.results ?? [])
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 280)

    return () => clearTimeout(t)
  }, [query])

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[10vh]">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Cerrar"
      />
      <div className="relative w-full max-w-lg bg-[#141414] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10">
          <p className="text-xs text-white/40">Agregar a</p>
          <p className="font-semibold text-sm">{SLOT_LABELS[slot]}</p>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar en AcuStock y catálogo interno…"
            className="mt-3 w-full bg-[#0f0f0f] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500"
          />
        </div>
        <ul className="max-h-80 overflow-y-auto divide-y divide-white/5">
          {loading && (
            <li className="px-4 py-6 text-center text-sm text-white/40">Buscando…</li>
          )}
          {!loading && query.length >= 2 && results.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-white/40">
              Sin resultados. Probá otro término o agregá un producto en Catálogo interno.
            </li>
          )}
          {!loading &&
            results.map((r) => (
              <li key={`${r.sourceType}-${r.sourceRef}`}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(r)
                    onClose()
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors"
                >
                  <div className="flex justify-between gap-2">
                    <span className="text-sm font-medium line-clamp-2">{r.name}</span>
                    <span className="text-sm text-green-400 shrink-0">
                      {formatCurrency(r.unitPrice)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1 text-[11px] text-white/40">
                    <span
                      className={
                        r.sourceType === "CUSTOM"
                          ? "text-purple-400"
                          : "text-blue-400"
                      }
                    >
                      {r.sourceType === "CUSTOM" ? "Interno" : "AcuStock"}
                    </span>
                    {r.sku && <span className="font-mono">{r.sku}</span>}
                    {r.stock != null && <span>Stock: {r.stock}</span>}
                  </div>
                </button>
              </li>
            ))}
        </ul>
      </div>
    </div>
  )
}
