"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

const MARKETING_PATH = "/marketing/objetivos-compra"

async function requireAdmin() {
  const session = await getSession()
  if (!session) throw new Error("No autorizado")
  if (session.role !== "ADMIN") throw new Error("Solo administradores")
  return session
}

function revalidateMarketing() {
  revalidatePath(MARKETING_PATH)
  revalidatePath("/marketing")
}

export async function createMarketingBrand(
  prev: string | null,
  formData: FormData,
): Promise<string | null> {
  try {
    await requireAdmin()
    const name = (formData.get("name") as string)?.trim()
    if (!name) return "El nombre de la marca es obligatorio"

    const maxOrder = await db.marketingBrand.aggregate({ _max: { sortOrder: true } })
    await db.marketingBrand.create({
      data: {
        name,
        sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
      },
    })
    revalidateMarketing()
    return null
  } catch (e) {
    return e instanceof Error ? e.message : "Error al crear la marca"
  }
}

export async function deleteMarketingBrand(brandId: string) {
  await requireAdmin()
  await db.marketingBrand.delete({ where: { id: brandId } })
  revalidateMarketing()
}

export async function createPurchaseGoalCategory(
  prev: string | null,
  formData: FormData,
): Promise<string | null> {
  try {
    await requireAdmin()
    const brandId = formData.get("brandId") as string
    const name = (formData.get("name") as string)?.trim()
    const targetAmount = parseFloat(formData.get("targetAmount") as string)

    if (!brandId || !name) return "Marca y categoría son obligatorios"
    if (!Number.isFinite(targetAmount) || targetAmount < 0) {
      return "Objetivo inválido"
    }

    const maxOrder = await db.marketingPurchaseGoalCategory.aggregate({
      where: { brandId },
      _max: { sortOrder: true },
    })

    await db.marketingPurchaseGoalCategory.create({
      data: {
        brandId,
        name,
        targetAmount,
        currentAmount: 0,
        sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
      },
    })
    revalidateMarketing()
    return null
  } catch (e) {
    return e instanceof Error ? e.message : "Error al crear la categoría"
  }
}

export async function updatePurchaseGoalCategory(
  prev: string | null,
  formData: FormData,
): Promise<string | null> {
  try {
    await requireAdmin()
    const id = formData.get("id") as string
    const name = (formData.get("name") as string)?.trim()
    const targetAmount = parseFloat(formData.get("targetAmount") as string)

    if (!id || !name) return "Datos incompletos"
    if (!Number.isFinite(targetAmount) || targetAmount < 0) {
      return "Objetivo inválido"
    }

    await db.marketingPurchaseGoalCategory.update({
      where: { id },
      data: { name, targetAmount },
    })
    revalidateMarketing()
    return null
  } catch (e) {
    return e instanceof Error ? e.message : "Error al actualizar"
  }
}

export async function deletePurchaseGoalCategory(categoryId: string) {
  await requireAdmin()
  await db.marketingPurchaseGoalCategory.delete({ where: { id: categoryId } })
  revalidateMarketing()
}

export async function adjustPurchaseGoalProgress(
  categoryId: string,
  delta: number,
): Promise<{ ok: true; currentAmount: number } | { ok: false; error: string }> {
  try {
    await requireAdmin()
    if (!Number.isFinite(delta) || delta === 0) {
      return { ok: false, error: "Cambio inválido" }
    }

    const row = await db.marketingPurchaseGoalCategory.findUnique({
      where: { id: categoryId },
    })
    if (!row) return { ok: false, error: "Categoría no encontrada" }

    const next = Math.max(0, Number(row.currentAmount) + delta)

    const updated = await db.marketingPurchaseGoalCategory.update({
      where: { id: categoryId },
      data: { currentAmount: next },
    })

    revalidateMarketing()
    return { ok: true, currentAmount: Number(updated.currentAmount) }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al actualizar el avance",
    }
  }
}
