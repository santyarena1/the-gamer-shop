"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

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

  revalidatePath("/deudas")
  return null
}

export async function markDebtPaid(debtId: string) {
  await requireAdmin()

  await db.debt.update({
    where: { id: debtId },
    data: { paid: true, paidAt: new Date() },
  })

  revalidatePath("/deudas")
}

export async function deleteDebt(debtId: string) {
  await requireAdmin()
  await db.debt.delete({ where: { id: debtId } })
  revalidatePath("/deudas")
}
