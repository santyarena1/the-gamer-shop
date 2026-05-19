import type { StockProduct } from "@/lib/acustock-feed"

export type ColumnKind = "text" | "number" | "boolean"

export type ProductColumn = {
  key: string
  label: string
  kind: ColumnKind
  options: string[]
}

export type ColumnFilters = Record<string, string>

const SKIP_KEYS = new Set(["@_"])

function humanizeKey(key: string) {
  const last = key.split(".").pop() ?? key
  return last
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function isNumericColumn(values: string[]) {
  const sample = values.filter(Boolean).slice(0, 40)
  if (sample.length === 0) return false
  return sample.every((v) => /^-?\d+([.,]\d+)?$/.test(v.replace(/\s/g, "")))
}

function isBooleanColumn(values: string[]) {
  const set = new Set(values.map((v) => v.toLowerCase()))
  return [...set].every((v) =>
    ["", "sí", "si", "no", "true", "false", "1", "0", "yes"].includes(v),
  )
}

export function buildProductColumns(products: StockProduct[]): ProductColumn[] {
  const keys = new Set<string>()
  for (const product of products) {
    for (const key of Object.keys(product)) {
      if (!SKIP_KEYS.has(key)) keys.add(key)
    }
  }

  const sortedKeys = [...keys].sort((a, b) => {
    const priority = [
      "sku",
      "nombre",
      "marca",
      "categoria",
      "stock",
      "precio_venta",
      "precio",
      "tipo",
      "codigo",
    ]
    const pa = priority.findIndex((p) => a.toLowerCase().includes(p))
    const pb = priority.findIndex((p) => b.toLowerCase().includes(p))
    if (pa !== -1 || pb !== -1) return (pa === -1 ? 99 : pa) - (pb === -1 ? 99 : pb)
    return a.localeCompare(b, "es")
  })

  return sortedKeys.map((key) => {
    const values = products.map((p) => p[key] ?? "").filter((v) => v !== "")
    const distinct = [...new Set(values)].sort((a, b) => a.localeCompare(b, "es"))
    let kind: ColumnKind = "text"

    if (isBooleanColumn(distinct)) kind = "boolean"
    else if (isNumericColumn(distinct)) kind = "number"

    const options =
      kind === "text" && distinct.length > 0 && distinct.length <= 80
        ? distinct
        : kind === "boolean"
          ? ["Sí", "No"]
          : []

    return { key, label: humanizeKey(key), kind, options }
  })
}

function parseNumber(value: string) {
  const n = parseFloat(value.replace(",", "."))
  return Number.isFinite(n) ? n : null
}

export function filterProducts(
  products: StockProduct[],
  filters: ColumnFilters,
  columns: ProductColumn[],
): StockProduct[] {
  const active = Object.entries(filters).filter(([, v]) => v.trim() !== "")
  if (active.length === 0) return products

  const columnByKey = new Map(columns.map((c) => [c.key, c]))

  return products.filter((product) =>
    active.every(([key, rawFilter]) => {
      const column = columnByKey.get(key)
      const cell = (product[key] ?? "").toLowerCase()
      const filter = rawFilter.trim()

      if (!column || filter === "") return true

      if (column.kind === "number") {
        const cellNum = parseNumber(product[key] ?? "")
        if (filter.startsWith(">=")) {
          const min = parseNumber(filter.slice(2))
          return min != null && cellNum != null && cellNum >= min
        }
        if (filter.startsWith("<=")) {
          const max = parseNumber(filter.slice(2))
          return max != null && cellNum != null && cellNum <= max
        }
        if (filter.startsWith(">")) {
          const min = parseNumber(filter.slice(1))
          return min != null && cellNum != null && cellNum > min
        }
        if (filter.startsWith("<")) {
          const max = parseNumber(filter.slice(1))
          return max != null && cellNum != null && cellNum < max
        }
        const exact = parseNumber(filter)
        return exact != null && cellNum != null && cellNum === exact
      }

      if (column.kind === "boolean") {
        const wantYes = filter.toLowerCase() === "sí" || filter.toLowerCase() === "si"
        const isYes = ["sí", "si", "true", "1", "yes"].includes(cell)
        return wantYes ? isYes : !isYes
      }

      if (column.options.length > 0) {
        return cell === filter.toLowerCase()
      }

      return cell.includes(filter.toLowerCase())
    }),
  )
}
