import type { Debt, Salary, User } from "@/app/generated/prisma/client"

export function isIpcAlertPeriod(date = new Date()) {
  const day = date.getDate()
  return day >= 1 && day <= 5
}

export function getCurrentPeriod(date = new Date()) {
  return { month: date.getMonth() + 1, year: date.getFullYear() }
}

export function salaryPeriodBefore(month: number, year: number) {
  if (month === 1) return { month: 12, year: year - 1 }
  return { month: month - 1, year }
}

export function getPreviousSalaryBase(
  user: Pick<User, "baseSalary">,
  lastSalary?: Pick<Salary, "grossAmount" | "amount"> | null,
) {
  if (lastSalary) {
    return Number(lastSalary.grossAmount ?? lastSalary.amount)
  }
  if (user.baseSalary) return Number(user.baseSalary)
  return 0
}

export function calculateSalaryAmounts(params: {
  previousBase: number
  ipcPercentage: number | null
  unpaidDebts: Pick<Debt, "id" | "amount">[]
}) {
  const { previousBase, ipcPercentage, unpaidDebts } = params

  const ipcIncrease =
    ipcPercentage != null
      ? Math.round(previousBase * (ipcPercentage / 100) * 100) / 100
      : 0

  const grossAmount = Math.round((previousBase + ipcIncrease) * 100) / 100
  const debtDeduction = unpaidDebts.reduce((acc, d) => acc + Number(d.amount), 0)
  const amount = Math.max(0, Math.round((grossAmount - debtDeduction) * 100) / 100)

  return {
    previousBase,
    ipcPercentage,
    ipcIncrease,
    grossAmount,
    debtDeduction,
    amount,
    debtIds: unpaidDebts.map((d) => d.id),
  }
}

export type SalaryWorkflowStatus = "PENDING" | "CONFIRMED" | "PARTIAL" | "PAID"

/** Estado según pagos registrados (después de confirmar la liquidación). */
export function resolveSalaryStatus(
  currentStatus: string,
  paidTotal: number,
  netAmount: number,
): SalaryWorkflowStatus {
  if (paidTotal >= netAmount - 0.01) return "PAID"
  if (paidTotal > 0) return "PARTIAL"
  if (currentStatus === "CONFIRMED") return "CONFIRMED"
  return "PENDING"
}

export function canRegisterPayments(status: string) {
  return status === "CONFIRMED" || status === "PARTIAL"
}

export function isSalaryDraft(status: string) {
  return status === "PENDING"
}
