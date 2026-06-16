import "server-only"

import type { StockProduct } from "@/lib/acustock-feed"
import { getProductSku } from "@/lib/product-catalog"
import { ACUSTOCK_PRODUCT_SOURCE, INTERNAL_PRODUCT_SOURCE } from "@/lib/product-sources"
import { db } from "@/lib/db"

export { INTERNAL_PRODUCT_SOURCE } from "@/lib/product-sources"

export type CatalogItemRow = {
  id: string
  name: string
  sku: string | null
  category: string
  unitPrice: number
  description: string | null
  active: boolean
}

/** Convierte un ítem del catálogo interno al formato de la lista de Productos. */
export function catalogItemToStockProduct(item: CatalogItemRow): StockProduct {
  const sku = item.sku ?? `INT-${item.id.slice(-6)}`
  return {
    nombre: item.name,
    sku,
    categoria: item.category,
    marca: "Catálogo interno",
    stock: "",
    "precios.precio_venta": String(item.unitPrice),
    descripcion: item.description ?? "",
    _source: INTERNAL_PRODUCT_SOURCE,
    _catalogId: item.id,
  }
}

export async function listActiveCatalogAsStockProducts(): Promise<StockProduct[]> {
  const items = await db.quoteCatalogItem.findMany({
    where: { active: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  })

  return items.map((i) =>
    catalogItemToStockProduct({
      id: i.id,
      name: i.name,
      sku: i.sku,
      category: i.category,
      unitPrice: Number(i.unitPrice),
      description: i.description,
      active: i.active,
    }),
  )
}

/** Catálogo interno primero; si el feed trae el mismo SKU, se muestra solo el interno. */
export function mergeFeedWithCatalog(
  feedProducts: StockProduct[],
  catalogProducts: StockProduct[],
): StockProduct[] {
  const internalSkus = new Set(
    catalogProducts.map((p) => getProductSku(p)).filter(Boolean),
  )

  const feedFiltered = feedProducts
    .filter((p) => {
      const sku = getProductSku(p)
      return !sku || !internalSkus.has(sku)
    })
    .map((p) => ({ ...p, _source: ACUSTOCK_PRODUCT_SOURCE }))

  return [...catalogProducts, ...feedFiltered]
}
