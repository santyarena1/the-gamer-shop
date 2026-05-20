"use client"

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react"
import { createQuoteCatalogItemQuick } from "@/actions/quote-catalog"
import type { PcComponentSlot } from "@/lib/quote-builder-constants"
import { salePriceFromCost } from "@/lib/quote-pricing"
import { formatCurrency } from "@/lib/utils"
import type { SearchProductResult } from "@/lib/quote-builder-constants"
import { SLOT_LABELS } from "@/lib/quote-builder-constants"

type Props = {
  slot: PcComponentSlot
  markupPercent: number
  onSelect: (result: SearchProductResult) => void
  onClose: () => void
}

export default function ProductSearchCombobox({
  slot,
  markupPercent,
  onSelect,
  onClose,
}: Props) {
  const [query, setQuery] = useState("")
  const [mine, setMine] = useState<SearchProductResult[]>([])
  const [acustock, setAcustock] = useState<SearchProductResult[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const fetchResults = useCallback(
    async (q: string) => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          q,
          slot,
          limit: "20",
        })
        const res = await fetch(`/api/cotizador/search?${params}`)
        const data = await res.json()
        setMine(data.mine ?? [])
        setAcustock(data.acustock ?? [])
      } catch {
        setMine([])
        setAcustock([])
      } finally {
        setLoading(false)
      }
    },
    [slot],
  )

  useEffect(() => {
    inputRef.current?.focus()
    void fetchResults("")
  }, [fetchResults])

  useEffect(() => {
    const t = setTimeout(() => void fetchResults(query), 280)
    return () => clearTimeout(t)
  }, [query, fetchResults])

  const trimmedQuery = query.trim()
  const hasMine = mine.length > 0
  const hasAcustock = acustock.length > 0
  const showQuickCreate = !loading && !hasMine && !hasAcustock

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
            placeholder="Buscar… (primero tus productos creados)"
            className="mt-3 w-full bg-[#0f0f0f] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500"
          />
        </div>
        <ul className="max-h-[min(28rem,70vh)] overflow-y-auto divide-y divide-white/5">
          {loading && (
            <li className="px-4 py-6 text-center text-sm text-white/40">Buscando…</li>
          )}

          {!loading && hasMine && (
            <>
              <li className="px-4 py-2 text-[11px] font-medium text-purple-400/90 bg-purple-500/5 sticky top-0">
                Tus productos
              </li>
              {mine.map((r) => (
                <SearchResultRow
                  key={`mine-${r.sourceRef}`}
                  result={r}
                  markupPercent={markupPercent}
                  badge="Creado por vos"
                  onPick={() => {
                    onSelect(r)
                    onClose()
                  }}
                />
              ))}
            </>
          )}

          {!loading && hasAcustock && (
            <>
              <li className="px-4 py-2 text-[11px] font-medium text-blue-400/90 bg-blue-500/5 sticky top-0">
                AcuStock
              </li>
              {acustock.map((r) => (
                <SearchResultRow
                  key={`acu-${r.sourceRef}`}
                  result={r}
                  markupPercent={markupPercent}
                  badge="AcuStock"
                  onPick={() => {
                    onSelect(r)
                    onClose()
                  }}
                />
              ))}
            </>
          )}

          {showQuickCreate && (
            <li className="px-4 py-4">
              <QuickCreateProductForm
                defaultName={trimmedQuery}
                defaultCategory={SLOT_LABELS[slot]}
                markupPercent={markupPercent}
                onCreated={(product) => {
                  onSelect(product)
                  onClose()
                }}
              />
            </li>
          )}

          {!loading && !hasMine && !hasAcustock && trimmedQuery.length < 2 && (
            <li className="px-4 py-6 text-center text-sm text-white/40">
              No tenés productos en esta categoría todavía. Escribí para buscar en AcuStock o
              creá uno nuevo abajo.
            </li>
          )}

          {!loading && !hasMine && !hasAcustock && trimmedQuery.length >= 2 && (
            <li className="px-4 py-2 text-center text-xs text-white/35">
              Sin coincidencias. Podés crear el producto abajo.
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}

function SearchResultRow({
  result: r,
  markupPercent,
  badge,
  onPick,
}: {
  result: SearchProductResult
  markupPercent: number
  badge: string
  onPick: () => void
}) {
  const isMine = r.sourceType === "CUSTOM"
  return (
    <li>
      <button
        type="button"
        onClick={onPick}
        className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex justify-between gap-2">
          <span className="text-sm font-medium line-clamp-2">{r.name}</span>
          <span className="text-sm text-green-400 shrink-0 text-right">
            <span className="block text-[10px] text-white/35">
              costo {formatCurrency(r.unitPrice)}
            </span>
            {formatCurrency(salePriceFromCost(r.unitPrice, markupPercent))}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 mt-1 text-[11px] text-white/40">
          <span className={isMine ? "text-purple-400" : "text-blue-400"}>{badge}</span>
          {r.sku && <span className="font-mono">{r.sku}</span>}
          {r.category && <span>{r.category}</span>}
          {r.stock != null && <span>Stock: {r.stock}</span>}
        </div>
      </button>
    </li>
  )
}

function QuickCreateProductForm({
  defaultName,
  defaultCategory,
  markupPercent,
  onCreated,
}: {
  defaultName: string
  defaultCategory: string
  markupPercent: number
  onCreated: (product: SearchProductResult) => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [costPreview, setCostPreview] = useState("")

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setPending(true)

    const fd = new FormData(e.currentTarget)
    const name = (fd.get("name") as string)?.trim()
    const sku = (fd.get("sku") as string)?.trim() || null
    const category = (fd.get("category") as string)?.trim() || defaultCategory
    const unitCost = parseFloat(fd.get("unitCost") as string)

    const result = await createQuoteCatalogItemQuick({
      name,
      sku,
      category,
      unitCost,
    })

    setPending(false)

    if (result.ok) {
      onCreated(result.product)
    } else {
      setError(result.error)
    }
  }

  return (
    <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4 space-y-3">
      <p className="text-sm text-white/70">
        No hay resultados para <span className="text-white font-medium">“{defaultName}”</span>.
        Creá el producto ahora y usalo en el armado:
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block space-y-1">
          <span className="text-xs text-white/50">Nombre *</span>
          <input
            name="name"
            required
            defaultValue={defaultName}
            className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1">
            <span className="text-xs text-white/50">SKU</span>
            <input
              name="sku"
              placeholder="Opcional"
              className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-white/50">Costo *</span>
            <input
              name="unitCost"
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="0"
              value={costPreview}
              onChange={(e) => setCostPreview(e.target.value)}
              className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
            />
          </label>
        </div>
        {costPreview && (
          <p className="text-xs text-green-400">
            Venta (+{markupPercent}%):{" "}
            {formatCurrency(salePriceFromCost(parseFloat(costPreview) || 0, markupPercent))}
          </p>
        )}
        <label className="block space-y-1">
          <span className="text-xs text-white/50">Categoría</span>
          <input
            name="category"
            defaultValue={defaultCategory}
            className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
          />
        </label>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full py-2.5 rounded-xl bg-green-500 hover:bg-green-400 text-black text-sm font-semibold disabled:opacity-50 transition-colors"
        >
          {pending ? "Creando…" : "Crear y agregar al armado"}
        </button>
      </form>
    </div>
  )
}
