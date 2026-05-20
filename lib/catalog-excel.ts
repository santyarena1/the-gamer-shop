import { createHash } from "crypto"
import * as XLSX from "xlsx"
import { SLOT_LABELS } from "@/lib/quote-builder-constants"

/** Columnas del Excel unificado (una sola hoja). */
export const CATALOG_EXCEL_HEADERS = [
  "SKU",
  "Categoría",
  "Nombre",
  "Precio",
  "Descripción",
  "Activo",
] as const

export type CatalogExcelField =
  | "sku"
  | "category"
  | "name"
  | "unitPrice"
  | "description"
  | "active"

export const CATALOG_FIELD_LABELS: Record<CatalogExcelField, string> = {
  sku: "SKU / Código",
  category: "Categoría",
  name: "Nombre / Modelo",
  unitPrice: "Precio / Costo",
  description: "Descripción",
  active: "Activo",
}

/** Nombres de hoja del Excel del usuario → categoría del cotizador. */
export const EXCEL_SHEET_TO_CATEGORY: Record<string, string> = {
  PROCESADORES: SLOT_LABELS.CPU,
  MOTHERBOARDS: SLOT_LABELS.MOTHER,
  "MEMORIAS RAM": SLOT_LABELS.RAM,
  ALMACENAMIENTO: SLOT_LABELS.SSD_NVME,
  "FUENTE DE PODER": SLOT_LABELS.PSU,
  "PLACA DE VIDEO": SLOT_LABELS.GPU,
  GABINETE: SLOT_LABELS.CASE,
  REFRIGERACION: SLOT_LABELS.COOLER,
  REFRIGERACIÓN: SLOT_LABELS.COOLER,
  MONITORES: SLOT_LABELS.MONITOR,
  ACCESORIOS: SLOT_LABELS.OTHER,
  PERIFERICOS: SLOT_LABELS.OTHER,
  PERIFÉRICOS: SLOT_LABELS.OTHER,
}

const HEADER_ALIASES: Record<CatalogExcelField, string[]> = {
  sku: ["sku", "codigo", "código", "code", "id producto"],
  category: ["categoria", "categoría", "category", "rubro", "tipo"],
  name: ["nombre", "name", "modelo", "producto", "descripcion producto", "item"],
  unitPrice: ["precio", "costo", "price", "unit price", "valor", "importe"],
  description: ["descripcion", "descripción", "notas", "observaciones"],
  active: ["activo", "active", "habilitado"],
}

const CATEGORY_CODES: Record<string, string> = {
  [SLOT_LABELS.CPU]: "CPU",
  [SLOT_LABELS.COOLER]: "CLR",
  [SLOT_LABELS.MOTHER]: "MB",
  [SLOT_LABELS.RAM]: "RAM",
  [SLOT_LABELS.GPU]: "GPU",
  [SLOT_LABELS.SSD_NVME]: "SSD",
  [SLOT_LABELS.HDD]: "HDD",
  [SLOT_LABELS.CASE]: "CS",
  [SLOT_LABELS.PSU]: "PSU",
  [SLOT_LABELS.MONITOR]: "MON",
  [SLOT_LABELS.KEYBOARD]: "KB",
  [SLOT_LABELS.MOUSE]: "MS",
  [SLOT_LABELS.HEADPHONES]: "HP",
  [SLOT_LABELS.OTHER]: "OTR",
}

export type ParsedCatalogRow = {
  sku: string
  category: string
  name: string
  unitPrice: number
  description: string | null
  active: boolean
  /** Hoja de origen si vino de un libro multi-hoja */
  sourceSheet?: string
}

export type ColumnMapping = Partial<Record<CatalogExcelField, string>>

function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
}

function parsePrice(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null
  if (typeof value === "number" && Number.isFinite(value)) return value

  let s = String(value).trim().replace(/[^\d.,-]/g, "")
  if (!s) return null

  const hasComma = s.includes(",")
  const hasDot = s.includes(".")

  if (hasComma && hasDot) {
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
      s = s.replace(/\./g, "").replace(",", ".")
    } else {
      s = s.replace(/,/g, "")
    }
  } else if (hasComma) {
    const parts = s.split(",")
    if (parts.length === 2 && parts[1].length === 3 && parts[0].length <= 4) {
      s = parts.join("")
    } else {
      s = s.replace(",", ".")
    }
  } else if (hasDot) {
    const parts = s.split(".")
    if (parts.length === 2 && parts[1].length === 3 && parts[0].length <= 4) {
      s = parts.join("")
    }
  }

  const n = parseFloat(s)
  return Number.isFinite(n) && n >= 0 ? n : null
}

function parseActive(value: unknown): boolean {
  if (value === null || value === undefined || value === "") return true
  const s = String(value).trim().toLowerCase()
  if (["0", "no", "false", "inactivo", "n"].includes(s)) return false
  return true
}

export function categoryFromSheetName(sheetName: string): string {
  const key = sheetName.trim().toUpperCase()
  return EXCEL_SHEET_TO_CATEGORY[key] ?? sheetName.trim()
}

/** SKU estable: mismo nombre+categoría → mismo código aunque cambie el texto menor. */
export function generateStableSku(category: string, name: string): string {
  const norm = `${category}|${name}`
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
  const hash = createHash("sha256").update(norm).digest("hex").slice(0, 8).toUpperCase()
  const code =
    CATEGORY_CODES[category] ??
    (category.slice(0, 6).toUpperCase().replace(/[^A-Z0-9]/g, "") || "OTR")
  return `TGS-${code}-${hash}`
}

export function suggestColumnMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {}
  const normalized = headers.map((h) => ({ raw: h, norm: normalizeHeader(h) }))

  for (const field of Object.keys(HEADER_ALIASES) as CatalogExcelField[]) {
    const aliases = HEADER_ALIASES[field]
    const exact = normalized.find((h) =>
      aliases.some((a) => h.norm === a || h.norm.includes(a)),
    )
    if (exact) mapping[field] = exact.raw
  }

  return mapping
}

function cellByField(
  raw: Record<string, unknown>,
  mapping: ColumnMapping,
  field: CatalogExcelField,
): unknown {
  const col = mapping[field]
  if (col && raw[col] !== undefined && raw[col] !== "") return raw[col]

  for (const key of Object.keys(raw)) {
    const norm = normalizeHeader(key)
    if (HEADER_ALIASES[field].some((a) => norm === a || norm.includes(a))) {
      return raw[key]
    }
  }
  return undefined
}

function rowFromMapped(
  raw: Record<string, unknown>,
  mapping: ColumnMapping,
  defaultCategory: string,
): Omit<ParsedCatalogRow, "sku"> & { sku?: string } | null {
  if (!mapping.name && !mapping.unitPrice) return null

  const name = String(cellByField(raw, mapping, "name") ?? "").trim()
  if (!name) return null

  const unitPrice = parsePrice(cellByField(raw, mapping, "unitPrice"))
  if (unitPrice === null) return null

  const categoryRaw = String(cellByField(raw, mapping, "category") ?? "").trim()
  const category = categoryRaw || defaultCategory

  const skuRaw = String(cellByField(raw, mapping, "sku") ?? "").trim()
  const sku = skuRaw || undefined

  const description =
    String(cellByField(raw, mapping, "description") ?? "").trim() || null

  const activeVal = cellByField(raw, mapping, "active")
  const active = activeVal !== undefined ? parseActive(activeVal) : true

  return { sku, category, name, unitPrice, description, active }
}

function isUnifiedCatalogSheet(sheetName: string, headers: string[]): boolean {
  const norm = normalizeHeader(sheetName)
  if (["catalogo", "catálogo", "catalog", "productos", "items"].includes(norm)) {
    return true
  }
  const h = headers.map(normalizeHeader)
  return h.includes("sku") && (h.includes("nombre") || h.includes("name"))
}

export function parseWorkbookBuffer(
  buffer: Buffer,
  mappingOverride?: ColumnMapping,
): {
  headers: string[]
  suggestedMapping: ColumnMapping
  rows: ParsedCatalogRow[]
  sheetNames: string[]
  unifiedSheet: boolean
} {
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: true })
  const sheetNames = wb.SheetNames
  const allRows: ParsedCatalogRow[] = []
  let detectedHeaders: string[] = []
  let suggestedMapping: ColumnMapping = {}
  let unifiedSheet = false

  for (const sheetName of sheetNames) {
    const sheet = wb.Sheets[sheetName]
    if (!sheet) continue

    const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      defval: "",
      raw: true,
    }) as unknown[][]

    if (matrix.length === 0) continue

    const headerRow = (matrix[0] as unknown[]).map((c) => String(c ?? "").trim())
    const nonEmptyHeaders = headerRow.filter(Boolean)
    if (nonEmptyHeaders.length === 0) continue

    const defaultCategory = categoryFromSheetName(sheetName)
    const unified = isUnifiedCatalogSheet(sheetName, nonEmptyHeaders)
    if (unified) unifiedSheet = true

    const mapping =
      mappingOverride && Object.keys(mappingOverride).length > 0
        ? mappingOverride
        : suggestColumnMapping(nonEmptyHeaders)

    if (detectedHeaders.length === 0) {
      detectedHeaders = nonEmptyHeaders
      suggestedMapping = { ...mapping }
    }

    for (let i = 1; i < matrix.length; i++) {
      const line = matrix[i] as unknown[]
      if (!line || line.every((c) => c === "" || c === null || c === undefined)) {
        continue
      }

      const raw: Record<string, unknown> = {}
      for (let c = 0; c < nonEmptyHeaders.length; c++) {
        raw[nonEmptyHeaders[c]] = line[c]
      }

      const parsed = rowFromMapped(raw, mapping, defaultCategory)
      if (!parsed) continue

      const sku = parsed.sku ?? generateStableSku(parsed.category, parsed.name)
      allRows.push({
        sku,
        category: parsed.category,
        name: parsed.name,
        unitPrice: parsed.unitPrice,
        description: parsed.description,
        active: parsed.active,
        sourceSheet: unified ? undefined : sheetName,
      })
    }
  }

  return {
    headers: detectedHeaders,
    suggestedMapping,
    rows: allRows,
    sheetNames,
    unifiedSheet,
  }
}

export type CatalogExportRow = {
  sku: string | null
  category: string
  name: string
  unitPrice: number
  description: string | null
  active: boolean
}

export function buildCatalogWorkbook(items: CatalogExportRow[]): Buffer {
  const data: (string | number | boolean)[][] = [
    [...CATALOG_EXCEL_HEADERS],
    ...items.map((i) => [
      i.sku ?? generateStableSku(i.category, i.name),
      i.category,
      i.name,
      i.unitPrice,
      i.description ?? "",
      i.active ? "Sí" : "No",
    ]),
  ]

  const ws = XLSX.utils.aoa_to_sheet(data)
  ws["!cols"] = [
    { wch: 18 },
    { wch: 22 },
    { wch: 48 },
    { wch: 12 },
    { wch: 30 },
    { wch: 8 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Catálogo")
  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }))
}
