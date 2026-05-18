import Link from "next/link"
import { formatCurrency } from "@/lib/utils"

export type EmployeeSummary = {
  id: string
  name: string
  position: string | null
  role: string
  pendingTasks: number
  unpaidSalaries: number
  unpaidSalariesAmount: number
  activeDebts: number
  activeDebtsAmount: number
  totalPurchases: number
  purchasesAmount: number
}

export default function DashboardAdmin({ employees }: { employees: EmployeeSummary[] }) {
  const totals = {
    pendingTasks: employees.reduce((a, e) => a + e.pendingTasks, 0),
    unpaidSalaries: employees.reduce((a, e) => a + e.unpaidSalaries, 0),
    activeDebts: employees.reduce((a, e) => a + e.activeDebts, 0),
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Empleados" value={employees.length} color="text-green-400" bg="bg-green-500/10" />
        <Stat label="Tareas pendientes" value={totals.pendingTasks} color="text-yellow-400" bg="bg-yellow-500/10" />
        <Stat label="Sueldos sin pagar" value={totals.unpaidSalaries} color="text-blue-400" bg="bg-blue-500/10" />
        <Stat label="Deudas activas" value={totals.activeDebts} color="text-red-400" bg="bg-red-500/10" />
      </div>

      <div>
        <h2 className="font-semibold mb-4">Resumen por empleado</h2>
        {employees.length === 0 ? (
          <p className="text-white/40 text-sm">No hay empleados activos</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {employees.map((emp) => (
              <Link
                key={emp.id}
                href={`/empleados/${emp.id}`}
                className="bg-[#141414] border border-white/10 rounded-xl p-4 hover:border-green-500/30 transition-colors block"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400 font-bold">
                    {emp.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{emp.name}</p>
                    {emp.position && <p className="text-xs text-white/40">{emp.position}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <Metric label="Tareas" value={String(emp.pendingTasks)} highlight={emp.pendingTasks > 0} />
                  <Metric
                    label="Sueldos"
                    value={emp.unpaidSalaries > 0 ? formatCurrency(emp.unpaidSalariesAmount) : "—"}
                    highlight={emp.unpaidSalaries > 0}
                  />
                  <Metric
                    label="Deudas"
                    value={emp.activeDebts > 0 ? formatCurrency(emp.activeDebtsAmount) : "—"}
                    highlight={emp.activeDebts > 0}
                  />
                  <Metric label="Compras" value={String(emp.totalPurchases)} />
                </div>
                <p className="text-xs text-green-400 mt-3">Ver perfil →</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div className={`${bg} border border-white/10 rounded-xl p-4`}>
      <p className="text-xs text-white/50 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-white/5 rounded-lg px-2 py-1.5">
      <p className="text-white/40">{label}</p>
      <p className={highlight ? "text-yellow-400 font-medium" : "text-white/80"}>{value}</p>
    </div>
  )
}
