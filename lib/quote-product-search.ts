import { db } from "@/lib/db"
import type { PcComponentSlot } from "@/lib/quote-builder-constants"
import { SLOT_LABELS } from "@/lib/quote-builder-constants"
import { getCachedStockFeed } from "@/lib/server-cache"
import {
  getProductBrand,
  getProductCategory,
  getProductName,
  getProductPrice,
  getProductSku,
  getProductStock,
} from "@/lib/product-catalog"
import type { SearchProductResult } from "@/lib/quote-builder-constants"

export type QuoteSearchResponse = {
  mine: SearchProductResult[]
  acustock: SearchProductResult[]
  /** Compat: míos primero, después AcuStock */
  results: SearchProductResult[]
}

const SLOT_CATEGORY_HINTS: Partial<Record<PcComponentSlot, string[]>> = {
  CPU: ["procesador", "cpu"],
  COOLER: ["refrigeración", "refrigeracion", "cooler", "aio"],
  MOTHER: ["placa madre", "motherboard", "mother"],
  RAM: ["memoria", "ram"],
  GPU: ["video", "gpu", "placa de video", "tarjeta"],
  SSD_NVME: ["ssd", "nvme", "m.2"],
  HDD: ["hdd", "disco"],
  CASE: ["gabinete", "case"],
  PSU: ["fuente", "psu", "poder"],
  MONITOR: ["monitor"],
  KEYBOARD: ["teclado", "keyboard"],
  MOUSE: ["mouse", "ratón", "raton"],
  HEADPHONES: ["auricular", "headphone", "audífono"],
}

function mapCatalogItem(c: {
  id: string
  name: string
  sku: string | null
  category: string
  unitPrice: { toString(): string } | number
}): SearchProductResult {
  return {
    sourceType: "CUSTOM",
    sourceRef: c.id,
    name: c.name,
    sku: c.sku ?? `INT-${c.id.slice(-6)}`,
    category: c.category,
    unitPrice: Number(c.unitPrice),
    stock: null,
    brand: "",
  }
}

function slotCategoryFilter(slot?: PcComponentSlot) {
  if (!slot) return undefined
  const hints = [
    SLOT_LABELS[slot].toLowerCase(),
    ...(SLOT_CATEGORY_HINTS[slot] ?? []),
  ]
  return {
    OR: hints.map((h) => ({
      category: { contains: h, mode: "insensitive" as const },
    })),
  }
}

async function searchMyCatalog(
  query: string,
  userId: string,
  opts: { slot?: PcComponentSlot; take: number },
): Promise<SearchProductResult[]> {
  const q = query.trim()
  const slotFilter = slotCategoryFilter(opts.slot)

  const items = await db.quoteCatalogItem.findMany({
    where: {
      active: true,
      authorId: userId,
      ...(q.length >= 2
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { sku: { contains: q, mode: "insensitive" } },
              { category: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(slotFilter ?? {}),
    },
    take: opts.take,
    orderBy: { updatedAt: "desc" },
  })

  return items.map(mapCatalogItem)
}

async function searchAcustock(q: string, limit: number): Promise<SearchProductResult[]> {
  try {
    const feed = await getCachedStockFeed()
    const products = feed.products
    const results: SearchProductResult[] = []

    for (const p of products) {
      const name = getProductName(p).toLowerCase()
      const sku = getProductSku(p).toLowerCase()
      const brand = getProductBrand(p).toLowerCase()
      const category = getProductCategory(p).toLowerCase()

      if (!name.includes(q) && !sku.includes(q) && !brand.includes(q) && !category.includes(q)) {
        continue
      }

      const price = getProductPrice(p)
      if (price == null) continue

      results.push({
        sourceType: "ACUSTOCK",
        sourceRef: getProductSku(p) || p.id || "",
        name: getProductName(p),
        sku: getProductSku(p),
        category: getProductCategory(p) || "Sin categoría",
        unitPrice: price,
        stock: getProductStock(p),
        brand: getProductBrand(p),
      })

      if (results.length >= limit) break
    }

    return results
  } catch {
    return []
  }
}

export async function searchQuoteProducts(
  query: string,
  opts: { userId: string; slot?: PcComponentSlot; limit?: number },
): Promise<QuoteSearchResponse> {
  const limit = opts.limit ?? 25
  const q = query.trim().toLowerCase()
  const mineLimit = Math.min(12, limit)

  let mine = await searchMyCatalog(query, opts.userId, {
    slot: opts.slot,
    take: mineLimit,
  })

  if (mine.length === 0 && opts.slot && q.length < 2) {
    mine = await searchMyCatalog(query, opts.userId, { take: mineLimit })
  }

  const acustockLimit = Math.max(0, limit - mine.length)
  const acustock =
    q.length >= 2 && acustockLimit > 0
      ? await searchAcustock(q, acustockLimit)
      : []

  const seen = new Set(mine.map((r) => r.sourceRef))
  const acustockFiltered = acustock.filter((a) => !seen.has(a.sourceRef))

  return {
    mine,
    acustock: acustockFiltered,
    results: [...mine, ...acustockFiltered],
  }
}
