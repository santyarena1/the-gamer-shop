import type { ExpenseCategory } from "@/app/generated/prisma/client"

export const DEFAULT_PAY_UNTIL_DAY = 10

export function formatPaymentWindow(payUntilDay: number | null) {
  const end = payUntilDay ?? DEFAULT_PAY_UNTIL_DAY
  return `del 1 al ${end}`
}

export function isWithinPaymentWindow(day: number, payUntilDay: number | null) {
  const end = payUntilDay ?? DEFAULT_PAY_UNTIL_DAY
  return day >= 1 && day <= end
}

export type RecurringExpenseAlert = {
  showReminder: boolean
  windowEnd: number
  month: number
  year: number
  unpaid: {
    paymentId: string
    vendorId: string
    vendorName: string
    category: string
    amount: number
    payUntilDay: number | null
    overdue: boolean
  }[]
  unpaidTotal: number
  unpaidCount: number
}

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  UTILITIES: "Servicios (agua, luz, gas)",
  INTERNET: "Internet / telefonía",
  PROFESSIONAL: "Honorarios (contador, etc.)",
  PAYROLL_TAXES: "Cargas sociales",
  CHECKS: "Cheques / avisos",
  RENT: "Alquiler",
  INSURANCE: "Seguros",
  OTHER: "Otros",
}

export const EXPENSE_CATEGORY_ORDER: ExpenseCategory[] = [
  "UTILITIES",
  "INTERNET",
  "PROFESSIONAL",
  "PAYROLL_TAXES",
  "CHECKS",
  "RENT",
  "INSURANCE",
  "OTHER",
]
