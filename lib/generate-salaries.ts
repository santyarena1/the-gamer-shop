import { db } from "@/lib/db"
import {
  calculateSalaryAmounts,
  getPreviousSalaryBase,
  salaryPeriodBefore,
} from "@/lib/salary"
import { revalidateEmployee } from "@/lib/revalidate"

export async function generateSalariesForMonth(month: number, year: number) {
  const ipc = await db.monthlyIpc.findUnique({ where: { month_year: { month, year } } })
  const ipcPercentage = ipc ? Number(ipc.percentage) : null

  const users = await db.user.findMany({
    where: { active: true },
    include: {
      debts: { where: { paid: false } },
      salaries: {
        select: { month: true, year: true, grossAmount: true, amount: true, paid: true },
        orderBy: [{ year: "desc" }, { month: "desc" }],
      },
    },
  })

  for (const user of users) {
    const prior = salaryPeriodBefore(month, year)
    const priorSalary = user.salaries.find(
      (s) => s.month === prior.month && s.year === prior.year,
    )
    const anyPriorSalary = user.salaries.find(
      (s) => s.year < year || (s.year === year && s.month < month),
    )

    const canReceiveSalary =
      user.ipcAdjusted || user.baseSalary != null || Boolean(anyPriorSalary)

    if (!canReceiveSalary) continue

    const previousBase = getPreviousSalaryBase(
      user,
      priorSalary ?? anyPriorSalary ?? null,
    )

    if (previousBase <= 0) continue

    const calc = calculateSalaryAmounts({
      previousBase,
      ipcPercentage,
      unpaidDebts: user.debts,
    })

    const existing = await db.salary.findUnique({
      where: { userId_month_year: { userId: user.id, month, year } },
      include: { payments: true },
    })

    if (existing?.paid) continue
    if (existing && existing.status !== "PENDING") continue
    if (existing && existing.payments.length > 0) continue

    if (existing) {
      await db.salaryDebt.deleteMany({ where: { salaryId: existing.id } })
      await db.salary.update({
        where: { id: existing.id },
        data: {
          previousBase: calc.previousBase,
          ipcPercentage: calc.ipcPercentage,
          ipcIncrease: calc.ipcIncrease,
          grossAmount: calc.grossAmount,
          debtDeduction: calc.debtDeduction,
          amount: calc.amount,
          status: "PENDING",
        },
      })
      if (calc.debtIds.length > 0) {
        await db.salaryDebt.createMany({
          data: calc.debtIds.map((debtId) => ({
            salaryId: existing.id,
            debtId,
            amount: user.debts.find((d) => d.id === debtId)!.amount,
          })),
        })
      }
    } else {
      const salary = await db.salary.create({
        data: {
          userId: user.id,
          month,
          year,
          previousBase: calc.previousBase,
          ipcPercentage: calc.ipcPercentage,
          ipcIncrease: calc.ipcIncrease,
          grossAmount: calc.grossAmount,
          debtDeduction: calc.debtDeduction,
          amount: calc.amount,
          status: "PENDING",
        },
      })
      if (calc.debtIds.length > 0) {
        await db.salaryDebt.createMany({
          data: calc.debtIds.map((debtId) => ({
            salaryId: salary.id,
            debtId,
            amount: user.debts.find((d) => d.id === debtId)!.amount,
          })),
        })
      }
    }

    revalidateEmployee(user.id)
  }
}
