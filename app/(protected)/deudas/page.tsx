import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import Header from "@/components/Header"
import DebtsView from "./DebtsView"

export default async function DeudasPage() {
  const session = await getSession()

  const [debts, employees] = await Promise.all([
    db.debt.findMany({
      orderBy: { createdAt: "desc" },
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
      <Header title="Deudas" />
      <main className="flex-1 p-6">
        <DebtsView debts={debts} employees={employees} isAdmin={session?.role === "ADMIN"} />
      </main>
    </div>
  )
}
