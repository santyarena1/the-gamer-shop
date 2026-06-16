import type { StockProduct } from "@/lib/acustock-feed"
import { getProductSku } from "@/lib/product-catalog"

export const INTERNAL_PRODUCT_SOURCE = "INTERNAL"
export const ACUSTOCK_PRODUCT_SOURCE = "ACUSTOCK"

/** Código de distribuidor (prefijo del SKU hasta el primer `_`). */
export type ProductDistributorCode = string

/** Nombres legibles para códigos conocidos; el resto se muestra tal cual. */
export const DISTRIBUTOR_LABELS: Record<string, string> = {
  TGS: "Catálogo interno",
}

/**
 * Prefijo del SKU hasta el primer guion bajo (p. ej. `INV_12345` → `INV`).
 * Catálogo interno sin `_` pero con `TGS-…` o `INT-…` → `TGS`.
 */
export function getDistributorCodeFromSku(sku: string): ProductDistributorCode | null {
  const s = sku.trim()
  if (!s) return null

  const underscore = s.indexOf("_")
  if (underscore > 0) {
    return s.slice(0, underscore).toUpperCase()
  }

  const upper = s.toUpperCase()
  if (upper.startsWith("TGS-") || upper.startsWith("INT-")) return "TGS"

  return null
}

export function getProductDistributor(product: StockProduct): ProductDistributorCode {
  const sku = getProductSku(product)
  const fromSku = getDistributorCodeFromSku(sku)
  if (fromSku) return fromSku
  if (product._source === INTERNAL_PRODUCT_SOURCE) return "TGS"
  return "OTRO"
}

export function getProductDistributorLabel(code: ProductDistributorCode): string {
  return DISTRIBUTOR_LABELS[code] ?? code
}

export function isInternalCatalogProduct(product: StockProduct): boolean {
  return product._source === INTERNAL_PRODUCT_SOURCE
}

export function isAcustockProduct(product: StockProduct): boolean {
  return product._source === ACUSTOCK_PRODUCT_SOURCE
}

export type DistributorOption = {
  code: ProductDistributorCode
  label: string
  count: number
}

/** Opciones para el desplegable, ordenadas por etiqueta. */
export function listDistributorsFromProducts(products: StockProduct[]): DistributorOption[] {
  const counts = new Map<ProductDistributorCode, number>()
  for (const p of products) {
    const code = getProductDistributor(p)
    counts.set(code, (counts.get(code) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([code, count]) => ({
      code,
      label: getProductDistributorLabel(code),
      count,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, "es"))
}
