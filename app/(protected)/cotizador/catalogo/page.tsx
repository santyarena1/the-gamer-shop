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
      <Header title="Catálogo interno" />
      <main className="flex-1 p-6">
        <p className="text-sm text-white/50 mb-6">
          Productos visibles solo al armar presupuestos en el Cotizador (no aparecen en
          Productos/AcuStock).
        </p>
        <QuoteCatalogView items={items.map((i) => ({
          ...i,
          unitPrice: Number(i.unitPrice),
        }))} isAdmin={isAdmin ?? false} />
      </main>
    </div>
  )
}
