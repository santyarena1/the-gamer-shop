"use server"

import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { revalidateEmployee } from "@/lib/revalidate"

async function requireAdmin() {
  const session = await getSession()
  if (!session || session.role !== "ADMIN") throw new Error("No autorizado")
}

export async function createDebt(prevState: string | null, formData: FormData) {
  await requireAdmin()

  const userId = formData.get("userId") as string
  const description = formData.get("description") as string
  const amount = parseFloat(formData.get("amount") as string)
  const dueDate = formData.get("dueDate") as string

  if (!userId || !description || isNaN(amount)) {
    return "Completá todos los campos obligatorios"
  }

  await db.debt.create({
    data: {
      userId,
      description,
      amount,
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  })

  revalidateEmployee(userId)
  return null
}

export async function markDebtPaid(debtId: string) {
  await requireAdmin()

  const debt = await db.debt.update({
    where: { id: debtId },
    data: { paid: true, paidAt: new Date() },
  })

  revalidateEmployee(debt.userId)
}

export async function deleteDebt(debtId: string) {
  await requireAdmin()
  const debt = await db.debt.delete({ where: { id: debtId } })
  revalidateEmployee(debt.userId)
}
