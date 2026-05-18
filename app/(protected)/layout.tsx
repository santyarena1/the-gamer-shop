import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { getAppDateIso, isDevDateBarEnabled, isFakeDateActive } from "@/lib/app-date"
import { syncPayrollForCurrentPeriod } from "@/lib/payroll"
import Sidebar from "@/components/Sidebar"
import DevDateBar from "@/components/DevDateBar"
import PayrollPeriodAlerts from "@/components/PayrollPeriodAlerts"
import RecurringExpensesAlert from "@/components/RecurringExpensesAlert"
import { getRecurringExpenseAlert } from "@/lib/recurring-expenses"

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect("/login")

  const showDevDateBar = isDevDateBarEnabled()
  const payroll = session.role === "ADMIN" ? await syncPayrollForCurrentPeriod() : null
  const recurringAlert =
    session.role === "ADMIN" ? await getRecurringExpenseAlert() : null
  const employees =
    session.role === "ADMIN"
      ? await db.user.findMany({
          orderBy: { name: "asc" },
          select: { id: true, name: true, active: true },
        })
      : []

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role={session.role} userId={session.userId} employees={employees} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {showDevDateBar && (
          <DevDateBar
            currentIso={await getAppDateIso()}
            isFake={await isFakeDateActive()}
          />
        )}
        {session.role === "ADMIN" && (payroll?.showIpcPrompt || recurringAlert?.showReminder) && (
          <div className="shrink-0 px-4 py-3 border-b border-white/10 bg-[#0a0a0a] space-y-3">
            {payroll?.showIpcPrompt && <PayrollPeriodAlerts payroll={payroll} />}
            {recurringAlert && <RecurringExpensesAlert alert={recurringAlert} />}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
