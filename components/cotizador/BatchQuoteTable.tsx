"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createBatchDocuments } from "@/actions/quote-builder"
import { applyTemplateSlots } from "@/lib/quote-builder"
import type { LineItemInput } from "@/lib/quote-builder-constants"
import { buildBatchQuoteTitle } from "@/lib/quote-document-title"
import {
  applyMarkupToLineItems,
  DEFAULT_MARKUP_PERCENT,
} from "@/lib/quote-pricing"
import BuildSlotGrid from "./BuildSlotGrid"
import MarkupPercentControl from "./MarkupPercentControl"

type Template = { id: string; name: string; slotsJson: string }

type Row = {
  id: string
  label: string
  notes: string
}

export default function BatchQuoteTable({ templates }: { templates: Template[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [templateItems, setTemplateItems] = useState<LineItemInput[]>([])
  const [markupPercent, setMarkupPercent] = useState(DEFAULT_MARKUP_PERCENT)

  function handleMarkupChange(next: number) {
    setMarkupPercent(next)
    setTemplateItems((items) => applyMarkupToLineItems(items, next))
  }
  const [rows, setRows] = useState<Row[]>([
    { id: "1", label: "", notes: "" },
  ])

  function addRow() {
    setRows((r) => [...r, { id: String(Date.now()), label: "", notes: "" }])
  }

  function updateRow(id: string, field: keyof Row, value: string) {
    setRows((r) => r.map((row) => (row.id === id ? { ...row, [field]: value } : row)))
  }

  function removeRow(id: string) {
    setRows((r) => (r.length > 1 ? r.filter((row) => row.id !== id) : r))
  }

  const rowCount = rows.length

  function submit() {
    setError(null)
    if (templateItems.length === 0) {
      setError("Definí la plantilla de componentes primero")
      return
    }

    startTransition(async () => {
      try {
        await createBatchDocuments(
          rows.map((r) => ({
            label: r.label,
            notes: r.notes,
            lineItems: templateItems,
          })),
          markupPercent,
        )
        router.push("/cotizador")
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error")
      }
    })
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <section className="space-y-4">
        <h2 className="font-semibold">1. Plantilla de componentes (común a todos)</h2>
        {templates.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTemplateItems(applyTemplateSlots(t.slotsJson))}
                className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10"
              >
                Cargar: {t.name}
              </button>
            ))}
          </div>
        )}
        <MarkupPercentControl value={markupPercent} onChange={handleMarkupChange} />
        <BuildSlotGrid
          items={templateItems}
          onChange={setTemplateItems}
          markupPercent={markupPercent}
        />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-semibold">2. Cuántos presupuestos crear</h2>
            <p className="text-sm text-white/45 mt-1">
              El título se genera solo: etiqueta opcional o &quot;Presupuesto 1/5&quot;, etc.
            </p>
          </div>
          <button
            type="button"
            onClick={addRow}
            className="text-sm px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 shrink-0"
          >
            + Fila
          </button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-[#1a1a1a]">
              <tr>
                <th className="text-left px-3 py-2 text-white/50 w-12">#</th>
                <th className="text-left px-3 py-2 text-white/50">Etiqueta (opcional)</th>
                <th className="text-left px-3 py-2 text-white/50">Título automático</th>
                <th className="text-left px-3 py-2 text-white/50">Notas</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id} className="border-t border-white/5">
                  <td className="px-3 py-2 text-white/30">{index + 1}</td>
                  <td className="px-2 py-2">
                    <input
                      value={row.label}
                      onChange={(e) => updateRow(row.id, "label", e.target.value)}
                      placeholder="Ej. PC oficina recepción"
                      className="w-full min-w-[160px] bg-[#0f0f0f] border border-white/10 rounded-lg px-2 py-1.5 text-sm"
                    />
                  </td>
                  <td className="px-3 py-2 text-white/50 text-xs">
                    {buildBatchQuoteTitle(index, rowCount, row.label)}
                  </td>
                  <td className="px-2 py-2">
                    <input
                      value={row.notes}
                      onChange={(e) => updateRow(row.id, "notes", e.target.value)}
                      placeholder="Opcional"
                      className="w-full min-w-[120px] bg-[#0f0f0f] border border-white/10 rounded-lg px-2 py-1.5 text-sm"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      className="text-white/30 hover:text-red-400"
                      aria-label="Quitar fila"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="button"
        disabled={pending}
        onClick={submit}
        className="px-6 py-3 rounded-xl bg-green-500 hover:bg-green-400 text-black font-semibold disabled:opacity-50"
      >
        {pending ? "Creando presupuestos…" : `Crear ${rowCount} presupuesto${rowCount === 1 ? "" : "s"}`}
      </button>
    </div>
  )
}
