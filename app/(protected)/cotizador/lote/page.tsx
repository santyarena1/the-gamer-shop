import { db } from "@/lib/db"
import { requireSession } from "@/lib/auth"
import Header from "@/components/Header"
import BatchQuoteTable from "@/components/cotizador/BatchQuoteTable"
export default async function CotizadorLotePage() {
  await requireSession()

  const templates = await db.pcBuildTemplate.findMany({
    orderBy: { updatedAt: "desc" },
    take: 20,
  })

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header
        title="Lote de presupuestos"
        backHref="/cotizador"
        backLabel="Volver al cotizador"
      />
      <main className="flex-1 p-6">
        <p className="text-sm text-white/50 mb-6">
          Creá muchos presupuestos independientes con la misma base de componentes.
        </p>
        <BatchQuoteTable templates={templates} />
      </main>
    </div>
  )
}
