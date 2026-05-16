"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

async function requireAdmin() {
  const session = await getSession()
  if (!session || session.role !== "ADMIN") throw new Error("No autorizado")
}

export async function createPurchase(prevState: string | null, formData: FormData) {
  await requireAdmin()

  const userId = formData.get("userId") as string
  const item = formData.get("item") as string
  const description = formData.get("description") as string
  const amount = parseFloat(formData.get("amount") as string)
  const category = formData.get("category") as string
  const date = formData.get("date") as string

  if (!userId || !item || isNaN(amount)) {
    return "Completá todos los campos obligatorios"
  }

  await db.purchase.create({
    data: {
      userId,
      item,
      description: description || null,
      amount,
      category: category || "Componente",
      date: date ? new Date(date) : new Date(),
    },
  })

  revalidatePath("/compras")
  return null
}

export async function deletePurchase(purchaseId: string) {
  await requireAdmin()
  await db.purchase.delete({ where: { id: purchaseId } })
  revalidatePath("/compras")
}
