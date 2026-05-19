"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import {
  createQuoteDocument,
  updateQuoteDocument,
  sendToQuoteForum,
} from "@/actions/quote-builder"
import { computeBuildTotal } from "@/lib/quote-builder"
import { QUOTE_DOCUMENT_STATUS_LABELS, type LineItemInput } from "@/lib/quote-builder-constants"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"
import BuildSlotGrid from "./BuildSlotGrid"

type Props = {
  mode: "create" | "edit"
  documentId?: string
  buildId?: string
  initial?: {
    title: string
    clientName: string
    clientPhone: string
    notes: string
    status: string
    lineItems: LineItemInput[]
    threadId?: string | null
  }
}

export default function QuoteDocumentEditor({ mode, documentId, buildId, initial }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState(initial?.title ?? "")
  const [clientName, setClientName] = useState(initial?.clientName ?? "")
  const [clientPhone, setClientPhone] = useState(initial?.clientPhone ?? "")
  const [notes, setNotes] = useState(initial?.notes ?? "")
  const [lineItems, setLineItems] = useState<LineItemInput[]>(initial?.lineItems ?? [])

  const total = computeBuildTotal(lineItems)

  function handleSave(status?: "DRAFT" | "CONFIRMED") {
    setError(null)
    startTransition(async () => {
      try {
        if (mode === "create") {
          const id = await createQuoteDocument({
            title: title || "Presupuesto PC",
            clientName,
            clientPhone,
            notes,
            lineItems,
          })
          router.push(`/cotizador/${id}`)
        } else if (documentId) {
          await updateQuoteDocument(documentId, {
            title: title || "Presupuesto PC",
            clientName,
            clientPhone,
            notes,
            lineItems,
            buildId,
            status,
          })
          router.refresh()
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al guardar")
      }
    })
  }

  function handleSendForum() {
    if (!documentId) return
    setError(null)
    startTransition(async () => {
      try {
        const threadId = await sendToQuoteForum(documentId)
        router.push(`/presupuestos/${threadId}`)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al enviar")
      }
    })
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Título del presupuesto" value={title} onChange={setTitle} required />
        <Field label="Cliente" value={clientName} onChange={setClientName} />
        <Field label="Teléfono" value={clientPhone} onChange={setClientPhone} />
        <div>
          <label className="text-xs text-white/50 mb-1 block">Estado</label>
          <p className="text-sm text-white/70">
            {initial?.status
              ? QUOTE_DOCUMENT_STATUS_LABELS[initial.status] ?? initial.status
              : "Borrador"}
          </p>
        </div>
      </div>
      <Field
        label="Notas internas"
        value={notes}
        onChange={setNotes}
        multiline
      />

      <BuildSlotGrid items={lineItems} onChange={setLineItems} />

      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="fixed bottom-0 left-0 right-0 md:left-60 bg-[#0a0a0a]/95 border-t border-white/10 backdrop-blur px-6 py-4 flex flex-wrap items-center justify-between gap-4 z-40">
        <div>
          <p className="text-xs text-white/40">Total configuración</p>
          <p className="text-2xl font-bold text-green-400">{formatCurrency(total)}</p>
          <p className="text-[11px] text-white/30">{lineItems.length} componentes</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => handleSave("DRAFT")}
            className="px-4 py-2 text-sm rounded-xl border border-white/10 hover:bg-white/5 disabled:opacity-50"
          >
            {pending ? "Guardando…" : "Guardar borrador"}
          </button>
          {mode === "edit" && documentId && (
            <>
              <Link
                href={`/cotizador/${documentId}/export`}
                target="_blank"
                className="px-4 py-2 text-sm rounded-xl border border-white/10 hover:bg-white/5 inline-flex items-center"
              >
                Exportar PDF
              </Link>
              <Link
                href={`/generador-imagenes/nuevo?quoteId=${documentId}`}
                className="px-4 py-2 text-sm rounded-xl border border-white/10 hover:bg-white/5 inline-flex items-center"
              >
                Generar imagen
              </Link>
              <button
                type="button"
                disabled={pending}
                onClick={() => handleSave("CONFIRMED")}
                className="px-4 py-2 text-sm rounded-xl bg-white/10 hover:bg-white/15 disabled:opacity-50"
              >
                Confirmar
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={handleSendForum}
                className="px-4 py-2 text-sm rounded-xl bg-green-500 hover:bg-green-400 text-black font-semibold disabled:opacity-50"
              >
                Enviar a presupuestos
              </button>
            </>
          )}
          {mode === "create" && (
            <button
              type="button"
              disabled={pending || lineItems.length === 0}
              onClick={() => handleSave("CONFIRMED")}
              className="px-4 py-2 text-sm rounded-xl bg-green-500 hover:bg-green-400 text-black font-semibold disabled:opacity-50"
            >
              Crear presupuesto
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  required,
  multiline,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
  multiline?: boolean
}) {
  const className =
    "w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-500"
  return (
    <label className="block space-y-1">
      <span className="text-xs text-white/50">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          className={className}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className={className}
        />
      )}
    </label>
  )
}
