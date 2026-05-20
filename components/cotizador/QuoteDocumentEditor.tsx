"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState, useTransition } from "react"
import {
  createQuoteDocument,
  updateQuoteDocument,
  sendToQuoteForum,
} from "@/actions/quote-builder"
import { computeBuildTotal } from "@/lib/quote-builder"
import { buildQuoteTitleFromLineItems } from "@/lib/quote-document-title"
import {
  applyMarkupToLineItems,
  DEFAULT_MARKUP_PERCENT,
} from "@/lib/quote-pricing"
import { QUOTE_DOCUMENT_STATUS_LABELS, type LineItemInput } from "@/lib/quote-builder-constants"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"
import BuildSlotGrid from "./BuildSlotGrid"
import MarkupPercentControl from "./MarkupPercentControl"

type Props = {
  mode: "create" | "edit"
  documentId?: string
  buildId?: string
  initial?: {
    notes: string
    status: string
    markupPercent: number
    lineItems: LineItemInput[]
    threadId?: string | null
  }
}

export default function QuoteDocumentEditor({ mode, documentId, buildId, initial }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [notes, setNotes] = useState(initial?.notes ?? "")
  const [markupPercent, setMarkupPercent] = useState(
    initial?.markupPercent ?? DEFAULT_MARKUP_PERCENT,
  )
  const [lineItems, setLineItems] = useState<LineItemInput[]>(initial?.lineItems ?? [])

  function handleMarkupChange(next: number) {
    setMarkupPercent(next)
    setLineItems((items) => applyMarkupToLineItems(items, next))
  }

  const autoTitle = useMemo(() => buildQuoteTitleFromLineItems(lineItems), [lineItems])
  const total = computeBuildTotal(lineItems)

  function handleSave(status?: "DRAFT" | "CONFIRMED") {
    setError(null)
    startTransition(async () => {
      try {
        if (mode === "create") {
          const id = await createQuoteDocument({
            notes,
            lineItems,
            markupPercent,
          })
          router.push(`/cotizador/${id}`)
        } else if (documentId) {
          await updateQuoteDocument(documentId, {
            notes,
            lineItems,
            markupPercent,
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
      <div className="space-y-4">
        <div className="rounded-xl border border-white/10 bg-[#141414] px-4 py-3">
          <p className="text-xs text-white/40">Título (automático según componentes)</p>
          <p className="text-sm font-medium text-white/90 mt-0.5">{autoTitle}</p>
        </div>
        <div>
          <label className="text-xs text-white/50 mb-1 block">Estado</label>
          <p className="text-sm text-white/70">
            {initial?.status
              ? QUOTE_DOCUMENT_STATUS_LABELS[initial.status] ?? initial.status
              : "Borrador"}
          </p>
        </div>
        <Field
          label="Notas internas"
          value={notes}
          onChange={setNotes}
          multiline
        />
      </div>

      <MarkupPercentControl value={markupPercent} onChange={handleMarkupChange} />
      <BuildSlotGrid
        items={lineItems}
        onChange={setLineItems}
        markupPercent={markupPercent}
      />

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
  multiline,
}: {
  label: string
  value: string
  onChange: (v: string) => void
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
          className={className}
        />
      )}
    </label>
  )
}
