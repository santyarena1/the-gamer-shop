"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useActionState } from "react"
import { createQuoteThread, type CreateQuoteThreadResult } from "@/actions/quotes"
import { formatDate } from "@/lib/utils"
import { QUOTE_BUTTON_VARIANTS } from "@/lib/quote-constants"
import QuickButtonsSettings from "./QuickButtonsSettings"
import QuoteComposer from "@/components/quotes/QuoteComposer"
import type { QuickButton } from "@/lib/quote-constants"

type Thread = {
  id: string
  clientName: string | null
  clientPhone: string | null
  subject: string | null
  statusLabel: string | null
  createdAt: Date
  updatedAt: Date
  author: { id: string; name: string }
  messages: { body: string | null; createdAt: Date; author: { name: string } }[]
  _count: { messages: number }
}

export default function PresupuestosList({
  threads,
  quickButtons,
  isAdmin,
  currentUserId,
}: {
  threads: Thread[]
  quickButtons: QuickButton[]
  isAdmin: boolean
  currentUserId: string
}) {
  const router = useRouter()
  const [showCreate, setShowCreate] = useState(false)
  const [showButtons, setShowButtons] = useState(false)

  const [createState, createAction, isCreating] = useActionState(
    async (_prev: CreateQuoteThreadResult | null, fd: FormData) => {
      const result = await createQuoteThread(null, fd)
      if (result.ok) {
        setShowCreate(false)
        router.push(`/presupuestos/${result.threadId}`)
        return null
      }
      return result
    },
    null as CreateQuoteThreadResult | null,
  )

  const createError = createState && !createState.ok ? createState.error : null

  function clientLabel(t: Thread) {
    if (t.clientName && t.clientPhone) return `${t.clientName} · ${t.clientPhone}`
    if (t.clientName) return t.clientName
    if (t.clientPhone) return t.clientPhone
    return "Cliente sin identificar"
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-white/50 max-w-2xl">
        Pedidos de presupuesto en formato hilo: cualquier usuario puede abrir un caso y responder con texto o PDF.
        Usá los botones rápidos para marcar estado (enviado, revisar, etc.).
      </p>

      <div className="flex flex-wrap gap-2 justify-between">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-green-500 hover:bg-green-400 text-black text-sm font-semibold rounded-lg"
          >
            + Nuevo pedido
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowButtons((v) => !v)}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-sm rounded-lg"
            >
              {showButtons ? "Ocultar botones" : "Configurar botones"}
            </button>
          )}
        </div>
      </div>

      {showButtons && isAdmin && (
        <QuickButtonsSettings buttons={quickButtons} />
      )}

      <div className="space-y-2">
        {threads.length === 0 ? (
          <p className="text-center py-16 text-white/30">No hay pedidos de presupuesto</p>
        ) : (
          threads.map((t) => {
            const last = t.messages[0]
            const statusVariant =
              QUOTE_BUTTON_VARIANTS[
                quickButtons.find((b) => b.label === t.statusLabel)?.variant ?? "default"
              ]?.badge ?? QUOTE_BUTTON_VARIANTS.default.badge

            return (
              <Link
                key={t.id}
                href={`/presupuestos/${t.id}`}
                className="block bg-[#141414] border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{clientLabel(t)}</p>
                    {t.subject && (
                      <p className="text-xs text-white/50 mt-0.5 truncate">{t.subject}</p>
                    )}
                    {last?.body && (
                      <p className="text-xs text-white/35 mt-1 line-clamp-1">
                        {last.author.name}: {last.body}
                      </p>
                    )}
                    <p className="text-[10px] text-white/25 mt-1">
                      {t._count.messages} mensaje{t._count.messages !== 1 ? "s" : ""} ·{" "}
                      {formatDate(t.updatedAt)}
                      {t.author.id === currentUserId ? " · vos" : ` · ${t.author.name}`}
                    </p>
                  </div>
                  {t.statusLabel && (
                    <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${statusVariant}`}>
                      {t.statusLabel}
                    </span>
                  )}
                </div>
              </Link>
            )
          })
        )}
      </div>

      {showCreate && (
        <Modal title="Nuevo pedido de presupuesto" onClose={() => setShowCreate(false)}>
          <form action={createAction} className="space-y-3">
            <p className="text-xs text-white/40">
              Cliente opcional — podés poner solo nombre, solo teléfono, o nada.
            </p>
            <Field label="Nombre del cliente" name="clientName" placeholder="Ej. Juan" />
            <Field label="Teléfono" name="clientPhone" placeholder="Ej. 11 1234-5678" />
            <Field label="Asunto (opcional)" name="subject" placeholder="Ej. PC gamer" />
            <QuoteComposer
              rows={3}
              placeholder="Qué necesita el cliente... Ctrl+V para pegar capturas."
            />
            {createError && <p className="text-red-400 text-xs">{createError}</p>}
            <button
              type="submit"
              disabled={isCreating}
              className="w-full py-2 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold rounded-lg text-sm"
            >
              {isCreating ? "Creando…" : "Crear pedido"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl w-full max-w-md p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between mb-4">
          <h2 className="font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="text-white/40 hover:text-white text-xl">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({
  label,
  name,
  placeholder,
}: {
  label: string
  name: string
  placeholder?: string
}) {
  return (
    <div>
      <label className="text-xs text-white/60 mb-1 block">{label}</label>
      <input
        name={name}
        placeholder={placeholder}
        className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
      />
    </div>
  )
}
