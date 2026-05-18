"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { ensureRecurringPaymentsForPeriod } from "@/lib/recurring-expenses"
import type { ExpenseCategory } from "@/app/generated/prisma/client"

async function requireAdmin() {
  const session = await getSession()
  if (!session || session.role !== "ADMIN") throw new Error("No autorizado")
}

export async function createRecurringVendor(prevState: string | null, formData: FormData) {
  try {
    await requireAdmin()

    const name = (formData.get("name") as string)?.trim()
    const category = formData.get("category") as ExpenseCategory
    const description = (formData.get("description") as string)?.trim()
    const payUntilDayRaw = formData.get("payUntilDay") as string
    const payUntilDay = payUntilDayRaw ? parseInt(payUntilDayRaw) : null

    if (!name) return "El nombre es obligatorio"

    await db.recurringVendor.create({
      data: {
        name,
        category: category || "OTHER",
        description: description || null,
        payUntilDay: payUntilDay && payUntilDay >= 1 && payUntilDay <= 28 ? payUntilDay : null,
      },
    })

    revalidatePath("/gastos")
    revalidatePath("/", "layout")
    return null
  } catch (e) {
    return e instanceof Error ? e.message : "Error al crear el proveedor"
  }
}

export async function updateRecurringVendor(prevState: string | null, formData: FormData) {
  try {
    await requireAdmin()

    const id = formData.get("id") as string
    const name = (formData.get("name") as string)?.trim()
    const category = formData.get("category") as ExpenseCategory
    const description = (formData.get("description") as string)?.trim()
    const payUntilDayRaw = formData.get("payUntilDay") as string
    const active = formData.get("active") === "true"
    const payUntilDay = payUntilDayRaw ? parseInt(payUntilDayRaw) : null

    if (!id || !name) return "Datos incompletos"

    await db.recurringVendor.update({
      where: { id },
      data: {
        name,
        category: category || "OTHER",
        description: description || null,
        payUntilDay: payUntilDay && payUntilDay >= 1 && payUntilDay <= 28 ? payUntilDay : null,
        active,
      },
    })

    revalidatePath("/gastos")
    revalidatePath("/", "layout")
    return null
  } catch (e) {
    return e instanceof Error ? e.message : "Error al actualizar"
  }
}

export async function markRecurringPaymentPaid(prevState: string | null, formData: FormData) {
  try {
    await requireAdmin()

    const paymentId = formData.get("paymentId") as string
    const amount = parseFloat(formData.get("amount") as string)
    const paidAt = formData.get("paidAt") as string
    const notes = (formData.get("notes") as string)?.trim()

    if (!paymentId || isNaN(amount) || amount <= 0) {
      return "Ingresá un monto válido"
    }

    await db.recurringPayment.update({
      where: { id: paymentId },
      data: {
        amount,
        paid: true,
        paidAt: paidAt ? new Date(paidAt) : new Date(),
        notes: notes || null,
      },
    })

    revalidatePath("/gastos")
    revalidatePath("/", "layout")
    return null
  } catch (e) {
    return e instanceof Error ? e.message : "Error al registrar el pago"
  }
}

export async function updateRecurringPaymentNotes(paymentId: string, notes: string) {
  await requireAdmin()
  await db.recurringPayment.update({
    where: { id: paymentId },
    data: { notes: notes.trim() || null },
  })
  revalidatePath("/gastos")
}

export async function deleteRecurringVendor(vendorId: string) {
  await requireAdmin()
  await db.recurringVendor.delete({ where: { id: vendorId } })
  revalidatePath("/gastos")
  revalidatePath("/", "layout")
}

export async function syncRecurringPeriod(month: number, year: number) {
  await requireAdmin()
  await ensureRecurringPaymentsForPeriod(month, year)
  revalidatePath("/gastos")
}
