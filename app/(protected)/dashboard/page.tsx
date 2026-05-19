import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { IPC_ALERT_DISMISS_COOKIE, isIpcAlertDismissed } from "@/lib/ipc-alert"
import { syncPayrollForCurrentPeriod } from "@/lib/payroll"
import { getSession } from "@/lib/session"
import Header from "@/components/Header"
import PayrollPeriodAlerts from "@/components/PayrollPeriodAlerts"
import DashboardAdmin, { type EmployeeSummary } from "./DashboardAdmin"

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  if (session.role !== "ADMIN") {
    redirect(`/empleados/${session.userId}`)
  }

  const payroll = await syncPayrollForCurrentPeriod()
  const cookieStore = await cookies()
  const showIpcAlert =
    payroll.showIpcPrompt &&
    !isIpcAlertDismissed(
      cookieStore.get(IPC_ALERT_DISMISS_COOKIE)?.value,
      payroll.month,
      payroll.year,
    )

  const users = await db.user.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    include: {
      salaries: { where: { paid: false }, select: { amount: true } },
      debts: { where: { paid: false }, select: { amount: true } },
      purchases: { select: { amount: true } },
      tasks: {
        where: { status: { in: ["PENDING", "IN_PROGRESS"] } },
        select: { id: true },
      },
    },
  })

  const employees: EmployeeSummary[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    position: u.position,
    role: u.role,
    pendingTasks: u.tasks.length,
    unpaidSalaries: u.salaries.length,
    unpaidSalariesAmount: u.salaries.reduce((acc, s) => acc + Number(s.amount), 0),
    activeDebts: u.debts.length,
    activeDebtsAmount: u.debts.reduce((acc, d) => acc + Number(d.amount), 0),
    totalPurchases: u.purchases.length,
    purchasesAmount: u.purchases.reduce((acc, p) => acc + Number(p.amount), 0),
  }))

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header title="Dashboard" />
      <main className="flex-1 p-6 space-y-6">
        {showIpcAlert && <PayrollPeriodAlerts payroll={payroll} />}
        <p className="text-white/60 text-sm">Bienvenido, {session.name}</p>
        <DashboardAdmin employees={employees} />
      </main>
    </div>
  )
}
