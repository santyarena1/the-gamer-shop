import { requireAdmin } from "@/lib/auth"
import Header from "@/components/Header"
import { db } from "@/lib/db"
import PurchaseGoalsView from "./PurchaseGoalsView"

export default async function ObjetivosCompraPage() {
  await requireAdmin()

  const brands = await db.marketingBrand.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      categories: {
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      },
    },
  })

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header
        title="Objetivos de compra"
        backHref="/dashboard"
        backLabel="Volver al dashboard"
      />
      <main className="flex-1 p-6">
        <p className="text-sm text-white/50 mb-4">
          Elegí una marca a la izquierda; a la derecha gestionás categorías y el avance con{" "}
          <strong className="text-white/60">+</strong> / <strong className="text-white/60">−</strong>.
        </p>
        <PurchaseGoalsView
          brands={brands.map((b) => ({
            id: b.id,
            name: b.name,
            categories: b.categories.map((c) => ({
              id: c.id,
              name: c.name,
              targetAmount: Number(c.targetAmount),
              currentAmount: Number(c.currentAmount),
            })),
          }))}
        />
      </main>
    </div>
  )
}
