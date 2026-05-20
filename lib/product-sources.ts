import type { StockProduct } from "@/lib/acustock-feed"

export const INTERNAL_PRODUCT_SOURCE = "INTERNAL"

export function isInternalCatalogProduct(product: StockProduct): boolean {
  return product._source === INTERNAL_PRODUCT_SOURCE
}
