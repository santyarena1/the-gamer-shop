"use client"

import { useState } from "react"
import Link from "next/link"
import SalariesView from "../../sueldos/SalariesView"
import DebtsView from "../../deudas/DebtsView"
import PurchasesView from "../../compras/PurchasesView"
import TasksView from "../../tareas/TasksView"
import { formatCurrency, MONTHS } from "@/lib/utils"
import type { PayrollStatus } from "@/lib/payroll"

type Employee = {
  id: string
  name: string
  email: string
  role: string
  position: string | null
  phone: string | null
  active: boolean
  baseSalary: unknown | null
  ipcAdjusted: boolean
}

type Summary = {
  pendingTasks: number
  unpaidSalaries: number
  unpaidSalariesAmount: number
  activeDebts: number
  activeDebtsAmount: number
  totalPurchases: number
  purchasesAmount: number
}

type Props = {
  payroll: PayrollStatus | null
  employee: Employee
  summary: Summary
  salaries: Parameters<typeof SalariesView>[0]["salaries"]
  debts: Parameters<typeof DebtsView>[0]["debts"]
  corporateCard: Parameters<typeof DebtsView>[0]["corporateCard"]
  purchases: Parameters<typeof PurchasesView>[0]["purchases"]
  tasks: Parameters<typeof TasksView>[0]["tasks"]
  employees: { id: string; name: string }[]
  isAdmin: boolean
  isOwnProfile: boolean
}

const TABS = [
  { id: "resumen", label: "Resumen" },
  { id: "sueldos", label: "Sueldos" },
  { id: "deudas", label: "Deudas" },
  { id: "compras", label: "Compras" },
  { id: "tareas", label: "Tareas" },
] as const

type TabId = (typeof TABS)[number]["id"]

export default function EmployeeProfile({
  payroll,
  employee,
  summary,
  salaries,
  debts,
  corporateCard,
  purchases,
  tasks,
  employees,
  isAdmin,
  isOwnProfile,
}: Props) {
  const [tab, setTab] = useState<TabId>("resumen")

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400 font-bold text-xl">
            {employee.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold">{employee.name}</h2>
            <p className="text-sm text-white/40">{employee.email}</p>
            {employee.position && <p className="text-xs text-white/30 mt-0.5">{employee.position}</p>}
            <div className="flex gap-2 mt-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${employee.role === "ADMIN" ? "bg-purple-500/20 text-purple-400" : "bg-blue-500/20 text-blue-400"}`}>
                {employee.role === "ADMIN" ? "Admin" : "Empleado"}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${employee.active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                {employee.active ? "Activo" : "Inactivo"}
              </span>
              {employee.ipcAdjusted && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400">IPC</span>
              )}
            </div>
            {employee.baseSalary != null && (
              <p className="text-xs text-white/40 mt-2">
                Sueldo base: {formatCurrency(Number(employee.baseSalary))}
              </p>
            )}
          </div>
        </div>
        {isAdmin && !isOwnProfile && (
          <Link href="/empleados" className="text-xs text-white/50 hover:text-white transition-colors">
            ← Volver a empleados
          </Link>
        )}
      </div>

      <div className="flex gap-2 flex-wrap border-b border-white/10 pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`text-sm px-4 py-2 rounded-t-lg transition-colors ${
              tab === t.id
                ? "bg-green-500/20 text-green-400 font-medium"
                : "text-white/50 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "resumen" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Tareas pendientes" value={summary.pendingTasks} color="text-yellow-400" bg="bg-yellow-500/10" />
            <StatCard label="Sueldos sin pagar" value={summary.unpaidSalaries} sub={formatCurrency(summary.unpaidSalariesAmount)} color="text-blue-400" bg="bg-blue-500/10" />
            <StatCard label="Deudas activas" value={summary.activeDebts} sub={formatCurrency(summary.activeDebtsAmount)} color="text-red-400" bg="bg-red-500/10" />
            <StatCard label="Compras" value={summary.totalPurchases} sub={formatCurrency(summary.purchasesAmount)} color="text-green-400" bg="bg-green-500/10" />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <QuickList
              title="Sueldos pendientes"
              empty="Sin sueldos pendientes"
              items={salaries.filter((s) => !s.paid).slice(0, 3).map((s) => ({
                label: `${MONTHS[s.month - 1]} ${s.year}`,
                value: formatCurrency(Number(s.amount)),
              }))}
              onView={() => setTab("sueldos")}
            />
            <QuickList
              title="Deudas activas"
              empty="Sin deudas"
              items={debts.filter((d) => !d.paid).slice(0, 3).map((d) => ({
                label: d.description,
                value: formatCurrency(Number(d.amount)),
              }))}
              onView={() => setTab("deudas")}
            />
            <QuickList
              title="Tareas activas"
              empty="Sin tareas"
              items={tasks
                .filter((t) => t.status === "PENDING" || t.status === "IN_PROGRESS")
                .slice(0, 3)
                .map((t) => ({ label: t.title, value: t.status }))}
              onView={() => setTab("tareas")}
            />
          </div>
        </div>
      )}

      {tab === "sueldos" && (
        <SalariesView
          salaries={salaries}
          employees={employees}
          isAdmin={isAdmin}
          employeeId={employee.id}
          payroll={payroll}
        />
      )}
      {tab === "deudas" && (
        <DebtsView
          debts={debts}
          corporateCard={corporateCard}
          employees={employees}
          isAdmin={isAdmin}
          employeeId={employee.id}
        />
      )}
      {tab === "compras" && (
        <PurchasesView purchases={purchases} employees={employees} isAdmin={isAdmin} employeeId={employee.id} />
      )}
      {tab === "tareas" && (
        <TasksView tasks={tasks} employees={employees} isAdmin={isAdmin} employeeId={employee.id} />
      )}
    </div>
  )
}

function StatCard({ label, value, sub, color, bg }: { label: string; value: number; sub?: string; color: string; bg: string }) {
  return (
    <div className={`${bg} border border-white/10 rounded-xl p-4`}>
      <p className="text-xs text-white/50 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-white/40 mt-1">{sub}</p>}
    </div>
  )
}

function QuickList({
  title,
  empty,
  items,
  onView,
}: {
  title: string
  empty: string
  items: { label: string; value: string }[]
  onView: () => void
}) {
  return (
    <div className="bg-[#141414] border border-white/10 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">{title}</h3>
        <button type="button" onClick={onView} className="text-xs text-green-400 hover:text-green-300">
          Ver todo
        </button>
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-white/30">{empty}</p>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex justify-between text-xs gap-2">
              <span className="text-white/70 truncate">{item.label}</span>
              <span className="text-white/40 shrink-0">{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
