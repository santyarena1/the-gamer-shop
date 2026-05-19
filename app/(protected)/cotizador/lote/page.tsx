import { db } from "@/lib/db"
import { requireSession } from "@/lib/auth"
import Header from "@/components/Header"
import BatchQuoteTable from "@/components/cotizador/BatchQuoteTable"
import Link from "next/link"

export default async function CotizadorLotePage() {
  await requireSession()

  const templates = await db.pcBuildTemplate.findMany({
    orderBy: { updatedAt: "desc" },
    take: 20,
  })

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header title="Lote de presupuestos" />
      <main className="flex-1 p-6">
        <Link href="/cotizador" className="text-sm text-white/40 hover:text-white mb-4 inline-block">
          ← Volver al cotizador
        </Link>
        <p className="text-sm text-white/50 mb-6">
          Creá muchos presupuestos independientes con la misma base de componentes.
        </p>
        <BatchQuoteTable templates={templates} />
      </main>
    </div>
  )
}
