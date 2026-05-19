import { db } from "@/lib/db"
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

export async function searchQuoteProducts(
  query: string,
  limit = 25,
): Promise<SearchProductResult[]> {
  const q = query.trim().toLowerCase()
  if (q.length < 2) return []

  const [custom, acustock] = await Promise.all([
    db.quoteCatalogItem.findMany({
      where: {
        active: true,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { sku: { contains: query, mode: "insensitive" } },
          { category: { contains: query, mode: "insensitive" } },
        ],
      },
      take: limit,
      orderBy: { name: "asc" },
    }),
    searchAcustock(q, limit),
  ])

  const customResults: SearchProductResult[] = custom.map((c) => ({
    sourceType: "CUSTOM",
    sourceRef: c.id,
    name: c.name,
    sku: c.sku ?? `INT-${c.id.slice(-6)}`,
    category: c.category,
    unitPrice: Number(c.unitPrice),
    stock: null,
    brand: "",
  }))

  const seen = new Set(customResults.map((r) => r.sourceRef))
  const merged = [
    ...customResults,
    ...acustock.filter((a) => !seen.has(a.sourceRef)),
  ]

  return merged.slice(0, limit)
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

