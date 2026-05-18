import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { assertEmployeeAccess } from "@/lib/auth"
import { toNumber } from "@/lib/serialize"
import { getPayrollStatus } from "@/lib/payroll"
import Header from "@/components/Header"
import EmployeeProfile from "./EmployeeProfile"

type Props = { params: Promise<{ id: string }> }

export default async function EmployeeProfilePage({ params }: Props) {
  const { id } = await params
  const session = await assertEmployeeAccess(id)
  const isAdmin = session.role === "ADMIN"
  const payroll = isAdmin ? await getPayrollStatus() : null

  const employee = await db.user.findUnique({
    where: { id },
    include: {
      salaries: {
        orderBy: [{ year: "desc" }, { month: "desc" }],
        include: {
          payments: { orderBy: { paidAt: "desc" } },
          debts: { include: { debt: { select: { description: true } } } },
        },
      },
      debts: { orderBy: { createdAt: "desc" } },
      corporateCard: {
        include: {
          statements: { orderBy: [{ year: "desc" }, { month: "desc" }] },
        },
      },
      purchases: { orderBy: { date: "desc" } },
      tasks: {
        where: { assignedToId: id },
        include: {
          assignedTo: { select: { id: true, name: true } },
          createdBy: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!employee) notFound()

  const userRef = { id: employee.id, name: employee.name }
  const salaries = employee.salaries.map((s) => ({
    ...s,
    user: userRef,
    previousBase: toNumber(s.previousBase),
    ipcPercentage: s.ipcPercentage != null ? toNumber(s.ipcPercentage) : null,
    ipcIncrease: toNumber(s.ipcIncrease),
    grossAmount: toNumber(s.grossAmount),
    debtDeduction: toNumber(s.debtDeduction),
    amount: toNumber(s.amount),
    payments: s.payments.map((p) => ({
      ...p,
      amount: toNumber(p.amount),
      exchangeRate: toNumber(p.exchangeRate),
      amountArs: toNumber(p.amountArs),
    })),
    debts: s.debts.map((d) => ({
      ...d,
      amount: toNumber(d.amount),
    })),
  }))
  const cardDebtIds = new Set(
    employee.corporateCard?.statements
      .map((s) => s.debtId)
      .filter((id): id is string => id != null) ?? [],
  )
  const debts = employee.debts
    .filter((d) => !cardDebtIds.has(d.id))
    .map((d) => ({
      ...d,
      user: userRef,
      amount: toNumber(d.amount),
    }))
  const corporateCard = employee.corporateCard
    ? {
        id: employee.corporateCard.id,
        label: employee.corporateCard.label,
        lastFour: employee.corporateCard.lastFour,
        active: employee.corporateCard.active,
        statements: employee.corporateCard.statements.map((s) => ({
          id: s.id,
          month: s.month,
          year: s.year,
          totalAmount: toNumber(s.totalAmount),
          closingDate: s.closingDate,
          dueDate: s.dueDate,
          paid: s.paid,
          paidAt: s.paidAt,
          notes: s.notes,
        })),
      }
    : null

  const cardPending = corporateCard?.statements
    .filter((s) => !s.paid)
    .reduce((acc, s) => acc + s.totalAmount, 0) ?? 0
  const purchases = employee.purchases.map((p) => ({
    ...p,
    user: userRef,
    amount: toNumber(p.amount),
  }))

  const unpaidSalaries = salaries.filter((s) => !s.paid)
  const unpaidDebtCount =
    debts.filter((d) => !d.paid).length +
    (corporateCard?.statements.filter((s) => !s.paid).length ?? 0)
  const pendingTasks = employee.tasks.filter(
    (t) => t.status === "PENDING" || t.status === "IN_PROGRESS",
  )

  const summary = {
    pendingTasks: pendingTasks.length,
    unpaidSalaries: unpaidSalaries.length,
    unpaidSalariesAmount: unpaidSalaries.reduce((acc, s) => acc + Number(s.amount), 0),
    activeDebts: unpaidDebtCount,
    activeDebtsAmount:
      debts.filter((d) => !d.paid).reduce((acc, d) => acc + Number(d.amount), 0) + cardPending,
    totalPurchases: purchases.length,
    purchasesAmount: purchases.reduce((acc, p) => acc + Number(p.amount), 0),
  }

  const employees = await db.user.findMany({
    where: { active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  const isOwnProfile = session.userId === id
  const title = isOwnProfile ? "Mi perfil" : employee.name

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header title={title} />
      <main className="flex-1 p-6">
        <EmployeeProfile
          payroll={payroll}
          employee={{
            id: employee.id,
            name: employee.name,
            email: employee.email,
            role: employee.role,
            position: employee.position,
            phone: employee.phone,
            active: employee.active,
            baseSalary: employee.baseSalary != null ? toNumber(employee.baseSalary) : null,
            ipcAdjusted: employee.ipcAdjusted,
          }}
          summary={summary}
          salaries={salaries}
          debts={debts}
          corporateCard={corporateCard}
          purchases={purchases}
          tasks={employee.tasks}
          employees={employees}
          isAdmin={isAdmin}
          isOwnProfile={isOwnProfile}
        />
      </main>
    </div>
  )
}
