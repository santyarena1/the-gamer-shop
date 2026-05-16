"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

async function requireAdmin() {
  const session = await getSession()
  if (!session || session.role !== "ADMIN") throw new Error("No autorizado")
}

export async function createSalary(prevState: string | null, formData: FormData) {
  await requireAdmin()

  const userId = formData.get("userId") as string
  const amount = parseFloat(formData.get("amount") as string)
  const month = parseInt(formData.get("month") as string)
  const year = parseInt(formData.get("year") as string)
  const notes = formData.get("notes") as string

  if (!userId || isNaN(amount) || isNaN(month) || isNaN(year)) {
    return "Completá todos los campos obligatorios"
  }

  const exists = await db.salary.findFirst({ where: { userId, month, year } })
  if (exists) return "Ya existe un sueldo registrado para ese mes y año"

  await db.salary.create({
    data: { userId, amount, month, year, notes: notes || null },
  })

  revalidatePath("/sueldos")
  return null
}

export async function markSalaryPaid(salaryId: string) {
  await requireAdmin()

  await db.salary.update({
    where: { id: salaryId },
    data: { paid: true, paidAt: new Date() },
  })

  revalidatePath("/sueldos")
}

export async function deleteSalary(salaryId: string) {
  await requireAdmin()
  await db.salary.delete({ where: { id: salaryId } })
  revalidatePath("/sueldos")
}
