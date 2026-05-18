"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import {
  calculateSalaryAmounts,
  getPreviousSalaryBase,
  resolveSalaryStatus,
  salaryPeriodBefore,
} from "@/lib/salary"
import { sumPaymentsArs } from "@/lib/salary-constants"
import { revalidateEmployee } from "@/lib/revalidate"

const PAYROLL_SKIP_AUTO_COOKIE = "payroll-skip-auto"

async function markPayrollSkipAuto(month: number, year: number) {
  const cookieStore = await cookies()
  cookieStore.set(PAYROLL_SKIP_AUTO_COOKIE, `${month}-${year}`, {
    path: "/",
    maxAge: 60 * 30,
    sameSite: "lax",
  })
}

async function requireAdmin() {
  const session = await getSession()
  if (!session || session.role !== "ADMIN") throw new Error("No autorizado")
  return session
}

async function syncSalaryPaymentStatus(salaryId: string) {
  const salary = await db.salary.findUnique({
    where: { id: salaryId },
    include: { payments: true, debts: { include: { debt: true } } },
  })
  if (!salary) return

  const paidTotal = sumPaymentsArs(salary.payments)
  const netAmount = Number(salary.amount)
  const status = resolveSalaryStatus(salary.status, paidTotal, netAmount)
  const fullyPaid = status === "PAID"

  await db.salary.update({
    where: { id: salaryId },
    data: {
      status,
      paid: fullyPaid,
      paidAt: fullyPaid ? salary.paidAt ?? new Date() : null,
    },
  })

  if (fullyPaid && salary.debts.length > 0) {
    await db.debt.updateMany({
      where: { id: { in: salary.debts.map((d) => d.debtId) } },
      data: { paid: true, paidAt: new Date() },
    })
  }

  return { salary, paidTotal }
}

export async function createSalary(prevState: string | null, formData: FormData) {
  await requireAdmin()

  const userId = formData.get("userId") as string
  const month = parseInt(formData.get("month") as string)
  const year = parseInt(formData.get("year") as string)
  const manualAmount = formData.get("amount") as string
  const notes = formData.get("notes") as string

  if (!userId || isNaN(month) || isNaN(year)) {
    return "Completá todos los campos obligatorios"
  }

  const exists = await db.salary.findUnique({
    where: { userId_month_year: { userId, month, year } },
  })
  if (exists) return "Ya existe un sueldo registrado para ese mes y año"

  const user = await db.user.findUnique({
    where: { id: userId },
    include: { debts: { where: { paid: false } } },
  })
  if (!user) return "Empleado no encontrado"

  const ipc = await db.monthlyIpc.findUnique({ where: { month_year: { month, year } } })
  const prior = salaryPeriodBefore(month, year)
  const priorSalary = await db.salary.findUnique({
    where: { userId_month_year: { userId, month: prior.month, year: prior.year } },
  })
  const fallbackSalary = priorSalary
    ? null
    : await db.salary.findFirst({
        where: {
          userId,
          OR: [
            { year: { lt: year } },
            { AND: [{ year }, { month: { lt: month } }] },
          ],
        },
        orderBy: [{ year: "desc" }, { month: "desc" }],
      })

  let calc
  if (manualAmount && !isNaN(parseFloat(manualAmount))) {
    const gross = parseFloat(manualAmount)
    const debtDeduction = user.debts.reduce((acc, d) => acc + Number(d.amount), 0)
    calc = {
      previousBase: gross,
      ipcPercentage: null,
      ipcIncrease: 0,
      grossAmount: gross,
      debtDeduction,
      amount: Math.max(0, gross - debtDeduction),
      debtIds: user.debts.map((d) => d.id),
    }
  } else {
    const previousBase = getPreviousSalaryBase(user, priorSalary ?? fallbackSalary)
    if (previousBase <= 0) {
      return "Configurá sueldo base o generá una liquidación del mes anterior primero"
    }

    calc = calculateSalaryAmounts({
      previousBase,
      ipcPercentage: ipc ? Number(ipc.percentage) : null,
      unpaidDebts: user.debts,
    })
  }

  const salary = await db.salary.create({
    data: {
      userId,
      month,
      year,
      previousBase: calc.previousBase,
      ipcPercentage: calc.ipcPercentage,
      ipcIncrease: calc.ipcIncrease,
      grossAmount: calc.grossAmount,
      debtDeduction: calc.debtDeduction,
      amount: calc.amount,
      notes: notes || null,
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

  revalidateEmployee(userId)
  return null
}

export async function addSalaryPayment(prevState: string | null, formData: FormData) {
  await requireAdmin()

  const salaryId = formData.get("salaryId") as string
  const amount = parseFloat(formData.get("amount") as string)
  const currency = (formData.get("currency") as string) || "ARS"
  const exchangeRate = parseFloat(formData.get("exchangeRate") as string) || 1
  const type = (formData.get("type") as string) || "PARTIAL"
  const paidAt = formData.get("paidAt") as string
  const paymentMethod = (formData.get("paymentMethod") as string)?.trim()
  const notesInput = (formData.get("notes") as string)?.trim()
  const notes = paymentMethod || notesInput || null

  if (!salaryId || isNaN(amount) || amount <= 0) {
    return "Ingresá un monto válido"
  }

  const salary = await db.salary.findUnique({ where: { id: salaryId } })
  if (!salary) return "Sueldo no encontrado"
  if (salary.paid) return "Esta liquidación ya está pagada"
  if (salary.status === "PENDING") {
    return "Confirmá la liquidación antes de registrar pagos"
  }

  const amountArs = Math.round(amount * exchangeRate * 100) / 100

  await db.salaryPayment.create({
    data: {
      salaryId,
      amount,
      currency: currency as "ARS" | "USD" | "USDT" | "OTHER",
      exchangeRate,
      amountArs,
      type: type as "PARTIAL" | "ADVANCE" | "FINAL",
      paidAt: paidAt ? new Date(paidAt) : new Date(),
      notes: notes || null,
    },
  })

  await syncSalaryPaymentStatus(salaryId)
  revalidateEmployee(salary.userId)
  return null
}

/** Confirma montos (IPC, bruto, neto). No registra pago; eso se hace después. */
export async function confirmSalaryLiquidation(salaryId: string): Promise<string | null> {
  try {
    await requireAdmin()

    const salary = await db.salary.findUnique({
      where: { id: salaryId },
      include: { payments: true },
    })
    if (!salary) return "Liquidación no encontrada"
    if (salary.status !== "PENDING") {
      return "Solo podés confirmar liquidaciones en borrador"
    }
    if (salary.payments.length > 0) {
      return "No se puede confirmar: ya hay pagos registrados"
    }

    await db.salary.update({
      where: { id: salaryId },
      data: { status: "CONFIRMED", paid: false, paidAt: null },
    })

    await db.user.update({
      where: { id: salary.userId },
      data: { baseSalary: salary.grossAmount },
    })

    revalidateEmployee(salary.userId)
    revalidatePath("/", "layout")
    return null
  } catch (e) {
    return e instanceof Error ? e.message : "Error al confirmar la liquidación"
  }
}

export async function confirmSalaryPaid(salaryId: string) {
  return confirmSalaryLiquidation(salaryId)
}

export async function deleteSalaryPayment(paymentId: string) {
  await requireAdmin()

  const payment = await db.salaryPayment.delete({
    where: { id: paymentId },
    include: { salary: true },
  })

  await db.salary.update({
    where: { id: payment.salaryId },
    data: { paid: false, paidAt: null },
  })

  await syncSalaryPaymentStatus(payment.salaryId)
  revalidateEmployee(payment.salary.userId)
}

export async function deleteSalary(salaryId: string): Promise<string | null> {
  try {
    await requireAdmin()

    const salary = await db.salary.findUnique({
      where: { id: salaryId },
      include: { payments: true },
    })
    if (!salary) return "Liquidación no encontrada"
    if (salary.paid) return "No se puede eliminar una liquidación ya pagada"
    if (salary.status !== "PENDING") {
      return "Solo podés eliminar borradores. Las liquidaciones confirmadas quedan fijas."
    }

    await db.salaryDebt.deleteMany({ where: { salaryId } })
    await db.salary.delete({ where: { id: salaryId } })

    await markPayrollSkipAuto(salary.month, salary.year)

    revalidateEmployee(salary.userId)
    revalidatePath("/", "layout")
    return null
  } catch (e) {
    return e instanceof Error ? e.message : "Error al eliminar la liquidación"
  }
}

export async function recalculateSalary(salaryId: string) {
  await requireAdmin()

  const salary = await db.salary.findUnique({
    where: { id: salaryId },
    include: { payments: true, user: true },
  })
  if (!salary || salary.paid || salary.payments.length > 0) {
    throw new Error("No se puede recalcular")
  }

  const ipc = await db.monthlyIpc.findUnique({
    where: { month_year: { month: salary.month, year: salary.year } },
  })

  const debts = await db.debt.findMany({ where: { userId: salary.userId, paid: false } })

  const calc = calculateSalaryAmounts({
    previousBase: Number(salary.previousBase),
    ipcPercentage: ipc ? Number(ipc.percentage) : null,
    unpaidDebts: debts,
  })

  await db.salaryDebt.deleteMany({ where: { salaryId } })
  await db.salary.update({
    where: { id: salaryId },
    data: {
      ipcPercentage: calc.ipcPercentage,
      ipcIncrease: calc.ipcIncrease,
      grossAmount: calc.grossAmount,
      debtDeduction: calc.debtDeduction,
      amount: calc.amount,
    },
  })

  if (calc.debtIds.length > 0) {
    await db.salaryDebt.createMany({
      data: calc.debtIds.map((debtId) => ({
        salaryId,
        debtId,
        amount: debts.find((d) => d.id === debtId)!.amount,
      })),
    })
  }

  revalidateEmployee(salary.userId)
}
