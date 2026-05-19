import type { StockProduct } from "@/lib/acustock-feed"
import { formatCurrency } from "@/lib/utils"

const IMAGE_FIELD_KEYS = [
  "imagen",
  "imagen_url",
  "url_imagen",
  "foto",
  "foto_url",
  "thumbnail",
  "imagen_principal",
  "imagenes.imagen",
  "imagenes.url",
] as const

export const FILTER_FIELD_KEYS = [
  "categoria",
  "marca",
  "tipo",
  "stock",
  "precios.precio_venta",
  "precios.precio_rebajado",
  "sincronizar_web",
] as const

export type ProductSort = "nombre-asc" | "nombre-desc" | "precio-asc" | "precio-desc" | "stock-desc"

export function getField(product: StockProduct, ...keys: string[]) {
  for (const key of keys) {
    const v = product[key]
    if (v != null && String(v).trim() !== "") return String(v).trim()
  }
  return ""
}

export function getProductName(product: StockProduct) {
  return getField(product, "nombre", "name", "titulo") || getField(product, "sku") || "Sin nombre"
}

export function getProductSku(product: StockProduct) {
  return getField(product, "sku", "codigo", "id")
}

export function getProductCategory(product: StockProduct) {
  return getField(product, "categoria", "category")
}

export function getProductBrand(product: StockProduct) {
  return getField(product, "marca", "brand")
}

export function getProductPrice(product: StockProduct) {
  const raw =
    getField(product, "precios.precio_venta", "precio_venta", "precio") ||
    getField(product, "precios.precio_rebajado", "precio_rebajado")
  const n = parseFloat(raw.replace(",", "."))
  return Number.isFinite(n) ? n : null
}

export function getProductSalePrice(product: StockProduct) {
  const raw = getField(product, "precios.precio_rebajado", "precio_rebajado")
  const n = parseFloat(raw.replace(",", "."))
  return Number.isFinite(n) ? n : null
}

export function getProductStock(product: StockProduct) {
  const raw = getField(product, "stock", "cantidad", "qty")
  const n = parseInt(raw, 10)
  return Number.isFinite(n) ? n : 0
}

export function formatProductPrice(product: StockProduct) {
  const price = getProductPrice(product)
  return price != null ? formatCurrency(price) : "—"
}

export function stockStatus(stock: number) {
  if (stock <= 0) return { label: "Sin stock", className: "bg-red-500/15 text-red-400 border-red-500/25" }
  if (stock <= 5) return { label: "Stock bajo", className: "bg-amber-500/15 text-amber-400 border-amber-500/25" }
  return { label: "En stock", className: "bg-green-500/15 text-green-400 border-green-500/25" }
}

export function resolveProductImageUrl(product: StockProduct): string | null {
  const preset = product._imageUrl
  if (preset && isHttpUrl(preset)) return preset

  for (const key of IMAGE_FIELD_KEYS) {
    const url = product[key]
    if (url && isHttpUrl(url)) return url
  }

  for (const [key, value] of Object.entries(product)) {
    if (/imagen|foto|image|thumbnail/i.test(key) && isHttpUrl(value)) return value
  }

  const id = getField(product, "id")
  if (id) return `/api/productos/imagen?id=${encodeURIComponent(id)}`

  return null
}

function isHttpUrl(value: string) {
  return /^https?:\/\//i.test(value.trim())
}

export function sortProducts(products: StockProduct[], sort: ProductSort) {
  const copy = [...products]
  copy.sort((a, b) => {
    switch (sort) {
      case "nombre-asc":
        return getProductName(a).localeCompare(getProductName(b), "es")
      case "nombre-desc":
        return getProductName(b).localeCompare(getProductName(a), "es")
      case "precio-asc":
        return (getProductPrice(a) ?? 0) - (getProductPrice(b) ?? 0)
      case "precio-desc":
        return (getProductPrice(b) ?? 0) - (getProductPrice(a) ?? 0)
      case "stock-desc":
        return getProductStock(b) - getProductStock(a)
      default:
        return 0
    }
  })
  return copy
}

export function distinctValues(products: StockProduct[], key: string, limit = 120) {
  const set = new Set<string>()
  for (const p of products) {
    const v = getField(p, key)
    if (v) set.add(v)
    if (set.size >= limit) break
  }
  return [...set].sort((a, b) => a.localeCompare(b, "es"))
}

export function productMatchesQuickFilters(
  product: StockProduct,
  opts: {
    search: string
    categoria: string
    marca: string
    stockMode: "all" | "in" | "out" | "low"
    priceMin: string
    priceMax: string
  },
) {
  const q = opts.search.trim().toLowerCase()
  if (q) {
    const haystack = [
      getProductName(product),
      getProductSku(product),
      getProductCategory(product),
      getProductBrand(product),
      getField(product, "descripcion"),
      getField(product, "codigo_barras"),
    ]
      .join(" ")
      .toLowerCase()
    if (!haystack.includes(q)) return false
  }

  if (opts.categoria && getProductCategory(product) !== opts.categoria) return false
  if (opts.marca && getProductBrand(product) !== opts.marca) return false

  const stock = getProductStock(product)
  if (opts.stockMode === "in" && stock <= 0) return false
  if (opts.stockMode === "out" && stock > 0) return false
  if (opts.stockMode === "low" && (stock <= 0 || stock > 5)) return false

  const price = getProductPrice(product)
  if (opts.priceMin) {
    const min = parseFloat(opts.priceMin)
    if (Number.isFinite(min) && (price == null || price < min)) return false
  }
  if (opts.priceMax) {
    const max = parseFloat(opts.priceMax)
    if (Number.isFinite(max) && (price == null || price > max)) return false
  }

  return true
}

export function productDetailEntries(product: StockProduct) {
  return Object.entries(product)
    .filter(([k, v]) => v && !k.startsWith("_"))
    .sort(([a], [b]) => a.localeCompare(b, "es"))
}
