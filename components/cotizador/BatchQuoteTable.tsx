"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createBatchDocuments } from "@/actions/quote-builder"
import { applyTemplateSlots } from "@/lib/quote-builder"
import type { LineItemInput } from "@/lib/quote-builder-constants"
import BuildSlotGrid from "./BuildSlotGrid"

type Template = { id: string; name: string; slotsJson: string }

type Row = {
  id: string
  title: string
  clientName: string
  clientPhone: string
  notes: string
}

export default function BatchQuoteTable({ templates }: { templates: Template[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [templateItems, setTemplateItems] = useState<LineItemInput[]>([])
  const [rows, setRows] = useState<Row[]>([
    { id: "1", title: "", clientName: "", clientPhone: "", notes: "" },
  ])

  function addRow() {
    setRows((r) => [
      ...r,
      { id: String(Date.now()), title: "", clientName: "", clientPhone: "", notes: "" },
    ])
  }

  function updateRow(id: string, field: keyof Row, value: string) {
    setRows((r) => r.map((row) => (row.id === id ? { ...row, [field]: value } : row)))
  }

  function removeRow(id: string) {
    setRows((r) => (r.length > 1 ? r.filter((row) => row.id !== id) : r))
  }

  function submit() {
    setError(null)
    const valid = rows.filter((r) => r.title.trim())
    if (valid.length === 0) {
      setError("Agregá al menos una fila con título")
      return
    }
    if (templateItems.length === 0) {
      setError("Definí la plantilla de componentes primero")
      return
    }

    startTransition(async () => {
      try {
        await createBatchDocuments(
          valid.map((r) => ({
            title: r.title,
            clientName: r.clientName,
            clientPhone: r.clientPhone,
            notes: r.notes,
            lineItems: templateItems,
          })),
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
        <BuildSlotGrid items={templateItems} onChange={setTemplateItems} />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">2. Lista de presupuestos</h2>
          <button
            type="button"
            onClick={addRow}
            className="text-sm px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5"
          >
            + Fila
          </button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-[#1a1a1a]">
              <tr>
                <th className="text-left px-3 py-2 text-white/50">Título *</th>
                <th className="text-left px-3 py-2 text-white/50">Cliente</th>
                <th className="text-left px-3 py-2 text-white/50">Teléfono</th>
                <th className="text-left px-3 py-2 text-white/50">Notas</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-white/5">
                  <td className="px-2 py-2">
                    <input
                      value={row.title}
                      onChange={(e) => updateRow(row.id, "title", e.target.value)}
                      placeholder="PC Oficina #1"
                      className="w-full min-w-[140px] bg-[#0f0f0f] border border-white/10 rounded-lg px-2 py-1.5 text-sm"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      value={row.clientName}
                      onChange={(e) => updateRow(row.id, "clientName", e.target.value)}
                      className="w-full min-w-[100px] bg-[#0f0f0f] border border-white/10 rounded-lg px-2 py-1.5 text-sm"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      value={row.clientPhone}
                      onChange={(e) => updateRow(row.id, "clientPhone", e.target.value)}
                      className="w-full min-w-[100px] bg-[#0f0f0f] border border-white/10 rounded-lg px-2 py-1.5 text-sm"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <input
                      value={row.notes}
                      onChange={(e) => updateRow(row.id, "notes", e.target.value)}
                      className="w-full min-w-[100px] bg-[#0f0f0f] border border-white/10 rounded-lg px-2 py-1.5 text-sm"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      className="text-white/30 hover:text-red-400"
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
        {pending ? "Creando presupuestos…" : `Crear ${rows.filter((r) => r.title.trim()).length} presupuestos`}
      </button>
    </div>
  )
}
