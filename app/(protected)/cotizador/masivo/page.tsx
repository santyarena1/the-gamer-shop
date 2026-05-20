import { db } from "@/lib/db"
import { requireSession } from "@/lib/auth"
import Header from "@/components/Header"
import CombinationQuoteWizard from "@/components/cotizador/CombinationQuoteWizard"
export default async function CotizadorMasivoPage() {
  await requireSession()

  const templates = await db.pcBuildTemplate.findMany({
    orderBy: { updatedAt: "desc" },
    take: 20,
  })

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header
        title="Presupuestos por combinación"
        backHref="/cotizador"
        backLabel="Volver al cotizador"
      />
      <main className="flex-1 p-6">
        <p className="text-sm text-white/50 mb-6">
          Elegí productos por categoría: lo que agregues una vez queda fijo; si agregás varios en la
          misma categoría, se crea un presupuesto por cada combinación (ej. 1 mother + 3 CPUs → 3
          presupuestos).
        </p>
        <CombinationQuoteWizard templates={templates} />
      </main>
    </div>
  )
}
