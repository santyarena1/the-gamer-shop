"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { generateStableSku } from "@/lib/catalog-excel"
import type { SearchProductResult } from "@/lib/quote-builder-constants"
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
  revalidatePath("/productos")
}

export async function createQuoteCatalogItemQuick(input: {
  name: string
  sku?: string | null
  category?: string
  /** Costo de referencia en catálogo (se usa como costo al armar presupuesto). */
  unitCost: number
}): Promise<
  { ok: true; product: SearchProductResult } | { ok: false; error: string }
> {
  try {
    const session = await requireUser()
    const name = input.name.trim()
    const category = input.category?.trim() || "Otro"
    const sku =
      input.sku?.trim() ||
      generateStableSku(category, input.name.trim())
    const unitCost = input.unitCost

    if (!name) return { ok: false, error: "El nombre es obligatorio" }
    if (!Number.isFinite(unitCost) || unitCost < 0) {
      return { ok: false, error: "Costo inválido" }
    }

    const item = await db.quoteCatalogItem.create({
      data: {
        name,
        sku,
        category,
        unitPrice: unitCost,
        authorId: session.userId,
      },
    })

    revalidateCatalog()

    return {
      ok: true,
      product: {
        sourceType: "CUSTOM",
        sourceRef: item.id,
        name: item.name,
        sku: item.sku ?? `INT-${item.id.slice(-6)}`,
        category: item.category,
        unitPrice: Number(item.unitPrice),
        stock: null,
        brand: "",
      },
    }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al crear el producto",
    }
  }
}

export async function createQuoteCatalogItem(prev: string | null, formData: FormData) {
  try {
    const session = await requireAdmin()
    const name = (formData.get("name") as string)?.trim()
    const category = (formData.get("category") as string)?.trim() || "Otro"
    const skuInput = (formData.get("sku") as string)?.trim()
    const unitPrice = parseFloat(formData.get("unitPrice") as string)
    const description = (formData.get("description") as string)?.trim() || null

    if (!name) return "El nombre es obligatorio"
    if (isNaN(unitPrice) || unitPrice < 0) return "Precio inválido"

    const sku = skuInput || generateStableSku(category, name)

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

/** Actualización rápida de nombre y/o precio desde la tabla del catálogo. */
export async function patchQuoteCatalogItemQuick(input: {
  id: string
  name?: string
  unitPrice?: number
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireAdmin()
    const { id } = input
    if (!id) return { ok: false, error: "ID requerido" }

    const data: { name?: string; unitPrice?: number } = {}

    if (input.name !== undefined) {
      const name = input.name.trim()
      if (!name) return { ok: false, error: "El nombre no puede estar vacío" }
      data.name = name
    }

    if (input.unitPrice !== undefined) {
      if (!Number.isFinite(input.unitPrice) || input.unitPrice < 0) {
        return { ok: false, error: "Precio inválido" }
      }
      data.unitPrice = input.unitPrice
    }

    if (Object.keys(data).length === 0) {
      return { ok: false, error: "Nada que actualizar" }
    }

    await db.quoteCatalogItem.update({ where: { id }, data })
    revalidateCatalog()
    return { ok: true }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al guardar",
    }
  }
}
