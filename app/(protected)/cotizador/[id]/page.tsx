import { notFound } from "next/navigation"
import Link from "next/link"
import { db } from "@/lib/db"
import { requireSession } from "@/lib/auth"
import Header from "@/components/Header"
import QuoteDocumentEditor from "@/components/cotizador/QuoteDocumentEditor"
import type { LineItemInput } from "@/lib/quote-builder-constants"
import { computeBuildTotal } from "@/lib/quote-builder"
import { formatCurrency } from "@/lib/utils"

type Props = { params: Promise<{ id: string }> }

export default async function CotizadorDetailPage({ params }: Props) {
  await requireSession()
  const { id } = await params

  const doc = await db.quoteDocument.findUnique({
    where: { id },
    include: {
      builds: {
        orderBy: { sortOrder: "asc" },
        include: { lineItems: { orderBy: { sortOrder: "asc" } } },
      },
    },
  })

  if (!doc) notFound()

  const primaryBuild = doc.builds[0]
  const lineItems: LineItemInput[] =
    primaryBuild?.lineItems.map((li) => ({
      slot: li.slot,
      sourceType: li.sourceType,
      sourceRef: li.sourceRef,
      name: li.name,
      unitPrice: Number(li.unitPrice),
      qty: li.qty,
    })) ?? []

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header title={doc.title} />
      <main className="flex-1 p-6 space-y-6">
        {doc.builds.length > 1 && (
          <div className="rounded-xl border border-white/10 bg-[#141414] p-4 space-y-2">
            <p className="text-xs text-white/40 mb-2">
              Este documento tiene {doc.builds.length} configuraciones
            </p>
            {doc.builds.map((b) => (
              <div
                key={b.id}
                className="flex justify-between text-sm py-2 border-b border-white/5 last:border-0"
              >
                <span>{b.label}</span>
                <span className="text-green-400">
                  {formatCurrency(computeBuildTotal(b.lineItems))}
                </span>
              </div>
            ))}
            <p className="text-[11px] text-white/30">
              Editás la configuración principal ({primaryBuild?.label}). Las demás se
              conservan al guardar la primera.
            </p>
          </div>
        )}

        {doc.threadId && (
          <Link
            href={`/presupuestos/${doc.threadId}`}
            className="inline-block text-sm text-green-400 hover:underline"
          >
            Ver hilo en Presupuestos →
          </Link>
        )}

        <QuoteDocumentEditor
          mode="edit"
          documentId={doc.id}
          buildId={primaryBuild?.id}
          initial={{
            title: doc.title,
            clientName: doc.clientName ?? "",
            clientPhone: doc.clientPhone ?? "",
            notes: doc.notes ?? "",
            status: doc.status,
            lineItems,
            threadId: doc.threadId,
          }}
        />
      </main>
    </div>
  )
}
