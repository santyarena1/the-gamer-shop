import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import Header from "@/components/Header"
import { formatCurrency } from "@/lib/utils"

export default async function DashboardPage() {
  const session = await getSession()

  const [totalEmployees, pendingTasks, unpaidSalaries, activeDebts, recentPurchases] =
    await Promise.all([
      db.user.count({ where: { active: true } }),
      db.task.count({ where: { status: { in: ["PENDING", "IN_PROGRESS"] } } }),
      db.salary.aggregate({ where: { paid: false }, _sum: { amount: true }, _count: true }),
      db.debt.aggregate({ where: { paid: false }, _sum: { amount: true }, _count: true }),
      db.purchase.findMany({ take: 5, orderBy: { createdAt: "desc" }, include: { user: { select: { name: true } } } }),
    ])

  const stats = [
    { label: "Empleados activos", value: totalEmployees, color: "text-green-400", bg: "bg-green-500/10" },
    { label: "Tareas pendientes", value: pendingTasks, color: "text-yellow-400", bg: "bg-yellow-500/10" },
    { label: "Sueldos sin pagar", value: unpaidSalaries._count, color: "text-blue-400", bg: "bg-blue-500/10", sub: formatCurrency(Number(unpaidSalaries._sum.amount ?? 0)) },
    { label: "Deudas activas", value: activeDebts._count, color: "text-red-400", bg: "bg-red-500/10", sub: formatCurrency(Number(activeDebts._sum.amount ?? 0)) },
  ]

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header title="Dashboard" />
      <main className="flex-1 p-6 space-y-6">
        <p className="text-white/60 text-sm">Bienvenido, {session?.name}</p>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className={`${s.bg} border border-white/10 rounded-xl p-4`}>
              <p className="text-xs text-white/50 mb-1">{s.label}</p>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              {s.sub && <p className="text-xs text-white/40 mt-1">{s.sub}</p>}
            </div>
          ))}
        </div>

        <div className="bg-[#141414] border border-white/10 rounded-xl p-5">
          <h2 className="font-semibold mb-4">Compras recientes</h2>
          {recentPurchases.length === 0 ? (
            <p className="text-white/40 text-sm">Sin compras registradas</p>
          ) : (
            <div className="space-y-3">
              {recentPurchases.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div>
                    <p className="text-sm font-medium">{p.item}</p>
                    <p className="text-xs text-white/40">{p.user.name} · {p.category}</p>
                  </div>
                  <p className="text-sm font-semibold text-green-400">{formatCurrency(Number(p.amount))}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
