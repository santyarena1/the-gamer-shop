import "server-only"

import { db } from "@/lib/db"
import { getAppDate } from "@/lib/app-date"
import { salaryPeriodBefore } from "@/lib/salary"
import {
  DEFAULT_PAY_UNTIL_DAY,
  type RecurringExpenseAlert,
} from "@/lib/recurring-expense-constants"

export type { RecurringExpenseAlert } from "@/lib/recurring-expense-constants"
export { formatPaymentWindow, isWithinPaymentWindow } from "@/lib/recurring-expense-constants"

/** Día máximo del plazo (1..N) según proveedores activos; si no hay, 10. */
export async function getPaymentWindowEnd(): Promise<number> {
  if (!db.recurringVendor) return DEFAULT_PAY_UNTIL_DAY

  const vendors = await db.recurringVendor.findMany({
    where: { active: true },
    select: { payUntilDay: true },
  })
  const days = vendors
    .map((v) => v.payUntilDay)
    .filter((d): d is number => d != null && d >= 1)
  return days.length > 0 ? Math.max(...days) : DEFAULT_PAY_UNTIL_DAY
}

/** Período de aviso global: del 1 al último día de plazo configurado. */
export async function isRecurringReminderPeriod(date = new Date()) {
  const end = await getPaymentWindowEnd()
  const day = date.getDate()
  return day >= 1 && day <= end
}

export async function ensureRecurringPaymentsForPeriod(month: number, year: number) {
  if (!db.recurringVendor) return

  const vendors = await db.recurringVendor.findMany({
    where: { active: true },
    select: { id: true },
  })

  for (const vendor of vendors) {
    const exists = await db.recurringPayment.findUnique({
      where: { vendorId_month_year: { vendorId: vendor.id, month, year } },
    })
    if (!exists) {
      await db.recurringPayment.create({
        data: { vendorId: vendor.id, month, year },
      })
    }
  }
}

export async function getRecurringExpenseAlert(appDate?: Date): Promise<RecurringExpenseAlert> {
  const date = appDate ?? (await getAppDate())
  const windowEnd = await getPaymentWindowEnd()
  const today = date.getDate()
  const showReminder = today >= 1 && today <= windowEnd

  const prior = salaryPeriodBefore(date.getMonth() + 1, date.getFullYear())
  const { month, year } = prior

  if (showReminder) {
    await ensureRecurringPaymentsForPeriod(month, year)
  }

  if (!db.recurringPayment) {
    return {
      showReminder,
      windowEnd,
      month,
      year,
      unpaid: [],
      unpaidTotal: 0,
      unpaidCount: 0,
    }
  }

  const unpaidRows = showReminder
    ? await db.recurringPayment.findMany({
        where: { month, year, paid: false },
        include: { vendor: true },
        orderBy: { vendor: { name: "asc" } },
      })
    : []

  const unpaid = unpaidRows.map((p) => {
    const limit = p.vendor.payUntilDay ?? DEFAULT_PAY_UNTIL_DAY
    return {
      paymentId: p.id,
      vendorId: p.vendorId,
      vendorName: p.vendor.name,
      category: p.vendor.category,
      amount: Number(p.amount),
      payUntilDay: p.vendor.payUntilDay,
      overdue: today > limit,
    }
  })

  return {
    showReminder,
    windowEnd,
    month,
    year,
    unpaid,
    unpaidTotal: unpaid.reduce((acc, u) => acc + u.amount, 0),
    unpaidCount: unpaid.length,
  }
}
