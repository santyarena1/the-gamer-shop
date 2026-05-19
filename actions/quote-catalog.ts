"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

async function requireUser() {
  const session = await getSession()
  if (!session) throw new Error("No autorizado")
  return session
}

async function requireAdmin() {
  const session = await requireUser()
  if (session.role !== "ADMIN") throw new Error("Solo administradores")
  return session
}

function revalidateCatalog() {
  revalidatePath("/cotizador/catalogo")
  revalidatePath("/cotizador")
}

export async function createQuoteCatalogItem(prev: string | null, formData: FormData) {
  try {
    const session = await requireAdmin()
    const name = (formData.get("name") as string)?.trim()
    const sku = (formData.get("sku") as string)?.trim() || null
    const category = (formData.get("category") as string)?.trim() || "Otro"
    const unitPrice = parseFloat(formData.get("unitPrice") as string)
    const description = (formData.get("description") as string)?.trim() || null

    if (!name) return "El nombre es obligatorio"
    if (isNaN(unitPrice) || unitPrice < 0) return "Precio inválido"

    await db.quoteCatalogItem.create({
      data: {
        name,
        sku,
        category,
        unitPrice,
        description,
        authorId: session.userId,
      },
    })

    revalidateCatalog()
    return null
  } catch (e) {
    return e instanceof Error ? e.message : "Error al crear"
  }
}

export async function updateQuoteCatalogItem(prev: string | null, formData: FormData) {
  try {
    await requireAdmin()
    const id = formData.get("id") as string
    const name = (formData.get("name") as string)?.trim()
    const sku = (formData.get("sku") as string)?.trim() || null
    const category = (formData.get("category") as string)?.trim() || "Otro"
    const unitPrice = parseFloat(formData.get("unitPrice") as string)
    const description = (formData.get("description") as string)?.trim() || null
    const active = formData.get("active") === "true"

    if (!id || !name) return "Datos incompletos"
    if (isNaN(unitPrice) || unitPrice < 0) return "Precio inválido"

    await db.quoteCatalogItem.update({
      where: { id },
      data: { name, sku, category, unitPrice, description, active },
    })

    revalidateCatalog()
    return null
  } catch (e) {
    return e instanceof Error ? e.message : "Error al actualizar"
  }
}

export async function deleteQuoteCatalogItem(id: string) {
  await requireAdmin()
  await db.quoteCatalogItem.update({
    where: { id },
    data: { active: false },
  })
  revalidateCatalog()
}
