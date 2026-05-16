import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import Header from "@/components/Header"
import PurchasesView from "./PurchasesView"

export default async function ComprasPage() {
  const session = await getSession()

  const [purchases, employees] = await Promise.all([
    db.purchase.findMany({
      orderBy: { date: "desc" },
      include: { user: { select: { id: true, name: true } } },
      ...(session?.role !== "ADMIN" ? { where: { userId: session?.userId } } : {}),
    }),
    db.user.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header title="Compras de componentes" />
      <main className="flex-1 p-6">
        <PurchasesView purchases={purchases} employees={employees} isAdmin={session?.role === "ADMIN"} />
      </main>
    </div>
  )
}
