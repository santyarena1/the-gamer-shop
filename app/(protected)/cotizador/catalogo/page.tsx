import { db } from "@/lib/db"
import { requireSession } from "@/lib/auth"
import { getSession } from "@/lib/session"
import Header from "@/components/Header"
import QuoteCatalogView from "./QuoteCatalogView"

export default async function CotizadorCatalogoPage() {
  await requireSession()
  const session = await getSession()
  const isAdmin = session?.role === "ADMIN"

  const items = await db.quoteCatalogItem.findMany({
    orderBy: { name: "asc" },
  })

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header
        title="Catálogo interno"
        backHref="/cotizador"
        backLabel="Volver al cotizador"
      />
      <main className="flex-1 p-6">
        <p className="text-sm text-white/50 mb-6">
          Productos del cotizador: también aparecen en la lista de Productos (etiqueta
          &quot;Catálogo interno&quot;) y al buscar en presupuestos.
        </p>
        <QuoteCatalogView items={items.map((i) => ({
          ...i,
          unitPrice: Number(i.unitPrice),
        }))} isAdmin={isAdmin ?? false} />
      </main>
    </div>
  )
}
