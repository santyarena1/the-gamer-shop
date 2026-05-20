"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import {
  buildCatalogWorkbook,
  parseWorkbookBuffer,
  type CatalogExcelField,
  type ColumnMapping,
  type ParsedCatalogRow,
  generateStableSku,
} from "@/lib/catalog-excel"
import { getSession } from "@/lib/session"

function revalidateCatalog() {
  revalidatePath("/cotizador/catalogo")
  revalidatePath("/cotizador")
  revalidatePath("/productos")
}

async function requireAdmin() {
  const session = await getSession()
  if (!session) throw new Error("No autorizado")
  if (session.role !== "ADMIN") throw new Error("Solo administradores")
  return session
}

export type CatalogImportPreview = {
  headers: string[]
  suggestedMapping: ColumnMapping
  sheetNames: string[]
  unifiedSheet: boolean
  previewRows: ParsedCatalogRow[]
  totalRows: number
}

function mappingFromFormData(formData: FormData): ColumnMapping {
  const fields: CatalogExcelField[] = [
    "sku",
    "category",
    "name",
    "unitPrice",
    "description",
    "active",
  ]
  const mapping: ColumnMapping = {}
  for (const field of fields) {
    const col = (formData.get(`map_${field}`) as string)?.trim()
    if (col && col !== "__none__") mapping[field] = col
  }
  return mapping
}

export async function previewCatalogImport(
  formData: FormData,
): Promise<
  { ok: true; preview: CatalogImportPreview } | { ok: false; error: string }
> {
  try {
    await requireAdmin()
    const file = formData.get("file") as File | null
    if (!file || file.size === 0) {
      return { ok: false, error: "Seleccioná un archivo Excel (.xlsx)" }
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const parsed = parseWorkbookBuffer(buffer)

    if (parsed.rows.length === 0) {
      return {
        ok: false,
        error:
          "No se encontraron filas válidas. Revisá que haya columnas de nombre y precio.",
      }
    }

    return {
      ok: true,
      preview: {
        headers: parsed.headers,
        suggestedMapping: parsed.suggestedMapping,
        sheetNames: parsed.sheetNames,
        unifiedSheet: parsed.unifiedSheet,
        previewRows: parsed.rows,
        totalRows: parsed.rows.length,
      },
    }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al leer el archivo",
    }
  }
}

export async function importCatalogFromExcel(
  formData: FormData,
): Promise<
  | { ok: true; created: number; updated: number; skipped: number }
  | { ok: false; error: string }
> {
  try {
    const session = await requireAdmin()
    const file = formData.get("file") as File | null
    if (!file || file.size === 0) {
      return { ok: false, error: "Archivo requerido" }
    }

    const mapping = mappingFromFormData(formData)
    if (!mapping.name || !mapping.unitPrice) {
      return {
        ok: false,
        error: "Mapeá al menos las columnas Nombre y Precio",
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const { rows } = parseWorkbookBuffer(buffer, mapping)

    if (rows.length === 0) {
      return { ok: false, error: "No hay filas para importar" }
    }

    const skus = rows.map(
      (row) => row.sku.trim() || generateStableSku(row.category, row.name),
    )

    const existingList = await db.quoteCatalogItem.findMany({
      where: { sku: { in: skus } },
      select: { id: true, sku: true },
    })
    const existingBySku = new Map(
      existingList
        .filter((e): e is { id: string; sku: string } => e.sku != null)
        .map((e) => [e.sku, e.id]),
    )

    let created = 0
    let updated = 0
    let skipped = 0

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const sku = skus[i]

      const existingId = existingBySku.get(sku)

      if (existingId) {
        await db.quoteCatalogItem.update({
          where: { id: existingId },
          data: {
            name: row.name,
            category: row.category,
            unitPrice: row.unitPrice,
            description: row.description,
            active: row.active,
          },
        })
        updated++
      } else {
        try {
          const item = await db.quoteCatalogItem.create({
            data: {
              sku,
              name: row.name,
              category: row.category,
              unitPrice: row.unitPrice,
              description: row.description,
              active: row.active,
              authorId: session.userId,
            },
          })
          existingBySku.set(sku, item.id)
          created++
        } catch (e) {
          skipped++
          console.error("Import skip", sku, e)
        }
      }
    }

    revalidateCatalog()
    return { ok: true, created, updated, skipped }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al importar",
    }
  }
}

export async function exportCatalogExcel(): Promise<
  { ok: true; base64: string; filename: string } | { ok: false; error: string }
> {
  try {
    await requireAdmin()

    const items = await db.quoteCatalogItem.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    })

    const buffer = buildCatalogWorkbook(
      items.map((i) => ({
        sku: i.sku,
        category: i.category,
        name: i.name,
        unitPrice: Number(i.unitPrice),
        description: i.description,
        active: i.active,
      })),
    )

    const date = new Date().toISOString().slice(0, 10)
    return {
      ok: true,
      base64: buffer.toString("base64"),
      filename: `catalogo-interno-${date}.xlsx`,
    }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al exportar",
    }
  }
}
