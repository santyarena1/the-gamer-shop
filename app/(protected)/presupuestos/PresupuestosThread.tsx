"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useActionState, useRef, useEffect, useState } from "react"
import { addQuoteMessage, applyQuoteQuickButton } from "@/actions/quotes"
import { formatDate } from "@/lib/utils"
import { QUOTE_BUTTON_VARIANTS, type QuickButton } from "@/lib/quote-constants"
import QuoteComposer from "@/components/quotes/QuoteComposer"
import {
  QuoteFilePreviewModal,
  QuoteFileThumb,
  isImageFile,
} from "@/components/quotes/QuoteFilePreview"

type Message = {
  id: string
  body: string | null
  fileName: string | null
  filePath: string | null
  mimeType: string | null
  isAction: boolean
  actionLabel: string | null
  createdAt: Date
  author: { id: string; name: string }
}

type Thread = {
  id: string
  clientName: string | null
  clientPhone: string | null
  subject: string | null
  statusLabel: string | null
  author: { name: string }
  messages: Message[]
}

export default function PresupuestosThread({
  thread,
  quickButtons,
  currentUserId,
}: {
  thread: Thread
  quickButtons: QuickButton[]
  currentUserId: string
}) {
  const router = useRouter()
  const bottomRef = useRef<HTMLDivElement>(null)
  const [previewFile, setPreviewFile] = useState<{
    url: string
    fileName: string
    mimeType: string | null
  } | null>(null)

  const [replyError, replyAction] = useActionState(async (prev: string | null, fd: FormData) => {
    const err = await addQuoteMessage(prev, fd)
    if (!err) {
      const form = document.getElementById("reply-form") as HTMLFormElement | null
      form?.reset()
    }
    return err
  }, null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [thread.messages.length])

  function clientLabel() {
    if (thread.clientName && thread.clientPhone) return `${thread.clientName} · ${thread.clientPhone}`
    if (thread.clientName) return thread.clientName
    if (thread.clientPhone) return thread.clientPhone
    return "Cliente sin identificar"
  }

  const statusVariant =
    QUOTE_BUTTON_VARIANTS[
      quickButtons.find((b) => b.label === thread.statusLabel)?.variant ?? "default"
    ]?.badge ?? QUOTE_BUTTON_VARIANTS.default.badge

  return (
    <>
    <div className="flex flex-col h-full max-h-[calc(100vh-8rem)]">
      <div className="shrink-0 mb-4">
        <Link href="/presupuestos" className="text-xs text-white/50 hover:text-white mb-2 inline-block">
          ← Volver a presupuestos
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">{clientLabel()}</h2>
            {thread.subject && <p className="text-sm text-white/50">{thread.subject}</p>}
            <p className="text-xs text-white/30 mt-1">Abierto por {thread.author.name}</p>
          </div>
          {thread.statusLabel && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${statusVariant}`}>
              {thread.statusLabel}
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-0">
        {thread.messages.length === 0 ? (
          <p className="text-center text-white/30 py-8">Sin mensajes todavía</p>
        ) : (
          thread.messages.map((m) => {
            const isMine = m.author.id === currentUserId
            if (m.isAction) {
              return (
                <div key={m.id} className="flex justify-center">
                  <span className="text-xs px-3 py-1 rounded-full bg-white/10 text-white/50">
                    {m.actionLabel ?? m.body} · {m.author.name} · {formatDate(m.createdAt)}
                  </span>
                </div>
              )
            }
            return (
              <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 ${
                    isMine
                      ? "bg-green-500/15 border border-green-500/25"
                      : "bg-[#141414] border border-white/10"
                  }`}
                >
                  <p className="text-[10px] text-white/40 mb-1">
                    {m.author.name} · {formatDate(m.createdAt)}
                  </p>
                  {m.body && <p className="text-sm whitespace-pre-wrap">{m.body}</p>}
                  {m.filePath && (
                    <div className="mt-2">
                      {isImageFile(m.mimeType, m.fileName) ? (
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewFile({
                              url: m.filePath!,
                              fileName: m.fileName ?? "Imagen",
                              mimeType: m.mimeType,
                            })
                          }
                          className="block rounded-lg border border-white/10 overflow-hidden hover:border-green-500/40 transition-colors"
                        >
                          <img
                            src={m.filePath}
                            alt={m.fileName ?? "Imagen"}
                            className="max-w-full max-h-72 object-cover"
                          />
                        </button>
                      ) : (
                        <QuoteFileThumb
                          url={m.filePath}
                          fileName={m.fileName ?? "Archivo"}
                          mimeType={m.mimeType}
                          onOpen={() =>
                            setPreviewFile({
                              url: m.filePath!,
                              fileName: m.fileName ?? "Archivo",
                              mimeType: m.mimeType,
                            })
                          }
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {quickButtons.length > 0 && (
        <div className="shrink-0 py-3 border-t border-white/10">
          <p className="text-[10px] text-white/40 mb-2">Acción rápida</p>
          <div className="flex flex-wrap gap-2">
            {quickButtons.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={async () => {
                  await applyQuoteQuickButton(thread.id, b.id)
                  router.refresh()
                }}
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                  QUOTE_BUTTON_VARIANTS[b.variant]?.button ?? QUOTE_BUTTON_VARIANTS.default.button
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="shrink-0 pt-3 border-t border-white/10">
        <form id="reply-form" action={replyAction} className="space-y-2">
          <input type="hidden" name="threadId" value={thread.id} />
          <QuoteComposer
            key={`reply-${thread.messages.length}`}
            rows={2}
            placeholder="Escribí una respuesta... Ctrl+V para pegar imágenes."
          />
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-green-500 hover:bg-green-400 text-black text-sm font-semibold rounded-lg"
            >
              Enviar
            </button>
          </div>
          {replyError && <p className="text-red-400 text-xs">{replyError}</p>}
        </form>
      </div>
    </div>
    <QuoteFilePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
    </>
  )
}
