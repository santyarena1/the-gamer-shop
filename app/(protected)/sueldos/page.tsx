import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import Header from "@/components/Header"
import SalariesView from "./SalariesView"

export default async function SueldosPage() {
  const session = await getSession()

  const [salaries, employees] = await Promise.all([
    db.salary.findMany({
      orderBy: [{ year: "desc" }, { month: "desc" }],
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
      <Header title="Sueldos" />
      <main className="flex-1 p-6">
        <SalariesView salaries={salaries} employees={employees} isAdmin={session?.role === "ADMIN"} />
      </main>
    </div>
  )
}
