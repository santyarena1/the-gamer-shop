import Link from "next/link"
import { db } from "@/lib/db"
import { requireSession } from "@/lib/auth"
import { computeBuildTotal } from "@/lib/quote-builder"
import { QUOTE_DOCUMENT_STATUS_LABELS } from "@/lib/quote-builder-constants"
import { formatCurrency, formatDate } from "@/lib/utils"
import Header from "@/components/Header"
import {
  duplicateQuoteDocumentAction,
  archiveQuoteDocumentAction,
} from "@/actions/quote-builder"

export default async function CotizadorPage() {
  await requireSession()

  const documents = await db.quoteDocument.findMany({
    where: { status: { not: "ARCHIVED" } },
    orderBy: { updatedAt: "desc" },
    include: {
      author: { select: { name: true } },
      builds: {
        take: 1,
        orderBy: { sortOrder: "asc" },
        select: {
          id: true,
          lineItems: { select: { unitPrice: true, qty: true } },
        },
      },
      _count: { select: { builds: true } },
    },
  })

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header title="Cotizador" />
      <main className="flex-1 p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-white/50 text-sm">
            Armá presupuestos de PC con componentes de AcuStock y catálogo interno.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/cotizador/catalogo"
              className="px-4 py-2 text-sm rounded-xl border border-white/10 hover:bg-white/5"
            >
              Catálogo interno
            </Link>
            <Link
              href="/cotizador/masivo"
              className="px-4 py-2 text-sm rounded-xl border border-white/10 hover:bg-white/5"
            >
              Combinaciones
            </Link>
            <Link
              href="/cotizador/lote"
              className="px-4 py-2 text-sm rounded-xl border border-white/10 hover:bg-white/5"
            >
              Lote
            </Link>
            <Link
              href="/cotizador/nuevo"
              className="px-4 py-2 text-sm rounded-xl bg-green-500 hover:bg-green-400 text-black font-semibold"
            >
              + Nuevo presupuesto
            </Link>
          </div>
        </div>

        {documents.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-white/10">
            <p className="text-white/40 mb-4">No hay cotizaciones todavía</p>
            <Link href="/cotizador/nuevo" className="text-green-400 hover:underline text-sm">
              Crear el primero →
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => {
              const build = doc.builds[0]
              const total = build ? computeBuildTotal(build.lineItems) : 0
              return (
                <div
                  key={doc.id}
                  className="flex flex-wrap items-center gap-4 bg-[#141414] border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors"
                >
                  <Link href={`/cotizador/${doc.id}`} className="flex-1 min-w-0">
                    <p className="font-medium truncate">{doc.title}</p>
                    <p className="text-xs text-white/40 mt-0.5">
                      {doc.author.name} · {formatDate(doc.updatedAt)}
                      {doc._count.builds > 1 && ` · ${doc._count.builds} configs`}
                    </p>
                  </Link>
                  <div className="text-right shrink-0">
                    <p className="text-green-400 font-semibold">{formatCurrency(total)}</p>
                    <p className="text-[11px] text-white/30">
                      {doc._count.builds} config. ·{" "}
                      {QUOTE_DOCUMENT_STATUS_LABELS[doc.status] ?? doc.status}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <form action={duplicateQuoteDocumentAction}>
                      <input type="hidden" name="id" value={doc.id} />
                      <button
                        type="submit"
                        className="text-xs px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10"
                      >
                        Duplicar
                      </button>
                    </form>
                    <form action={archiveQuoteDocumentAction}>
                      <input type="hidden" name="id" value={doc.id} />
                      <button
                        type="submit"
                        className="text-xs px-2 py-1 rounded-lg text-red-300/80 hover:bg-red-500/10"
                      >
                        Archivar
                      </button>
                    </form>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
