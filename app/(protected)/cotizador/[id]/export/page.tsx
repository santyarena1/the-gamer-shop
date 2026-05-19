import { notFound } from "next/navigation"
import Link from "next/link"
import { db } from "@/lib/db"
import { requireSession } from "@/lib/auth"
import { computeBuildTotal } from "@/lib/quote-builder"
import { SLOT_LABELS } from "@/lib/quote-builder-constants"
import { formatCurrency, formatDate } from "@/lib/utils"
import PrintButton from "@/components/cotizador/PrintButton"

type Props = { params: Promise<{ id: string }> }

export default async function CotizadorExportPage({ params }: Props) {
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

  return (
    <div className="min-h-screen bg-white text-black p-8 print:p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-start mb-6 print:hidden">
          <Link href={`/cotizador/${id}`} className="text-sm text-gray-600 hover:underline">
            ← Volver
          </Link>
          <PrintButton />
        </div>

        <h1 className="text-2xl font-bold">{doc.title}</h1>
        <p className="text-gray-600 text-sm mt-1">
          {doc.clientName && `${doc.clientName} · `}
          {doc.clientPhone && `${doc.clientPhone} · `}
          {formatDate(doc.updatedAt)}
        </p>
        {doc.notes && <p className="text-gray-600 text-sm mt-2">{doc.notes}</p>}

        {doc.builds.map((build) => (
          <section key={build.id} className="mt-8">
            <h2 className="text-lg font-semibold border-b pb-2">{build.label}</h2>
            <table className="w-full mt-4 text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Componente</th>
                  <th className="text-left py-2">Producto</th>
                  <th className="text-right py-2">Cant.</th>
                  <th className="text-right py-2">Precio</th>
                  <th className="text-right py-2">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {build.lineItems.map((li) => (
                  <tr key={li.id} className="border-b border-gray-100">
                    <td className="py-2">{SLOT_LABELS[li.slot]}</td>
                    <td className="py-2">{li.name}</td>
                    <td className="py-2 text-right">{li.qty}</td>
                    <td className="py-2 text-right">{formatCurrency(Number(li.unitPrice))}</td>
                    <td className="py-2 text-right">
                      {formatCurrency(Number(li.unitPrice) * li.qty)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-lg font-bold mt-4 text-right">
              Total: {formatCurrency(computeBuildTotal(build.lineItems))}
            </p>
          </section>
        ))}
      </div>
    </div>
  )
}
