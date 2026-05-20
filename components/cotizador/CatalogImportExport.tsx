"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  exportCatalogExcel,
  importCatalogFromExcel,
  previewCatalogImport,
  type CatalogImportPreview,
} from "@/actions/quote-catalog-import"
import {
  CATALOG_FIELD_LABELS,
  type CatalogExcelField,
  type ColumnMapping,
} from "@/lib/catalog-excel"
import { formatCurrency } from "@/lib/utils"

const MAPPING_FIELDS: CatalogExcelField[] = [
  "sku",
  "category",
  "name",
  "unitPrice",
  "description",
  "active",
]

const REQUIRED_FIELDS = new Set<CatalogExcelField>(["name", "unitPrice"])

export default function CatalogImportExport() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [preview, setPreview] = useState<CatalogImportPreview | null>(null)
  const [mapping, setMapping] = useState<ColumnMapping>({})
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function reset() {
    setPreview(null)
    setMapping({})
    setError(null)
    setResult(null)
    if (fileRef.current) fileRef.current.value = ""
  }

  function handleFileChange() {
    const file = fileRef.current?.files?.[0]
    if (!file) return

    setError(null)
    setResult(null)
    const fd = new FormData()
    fd.set("file", file)

    startTransition(async () => {
      const res = await previewCatalogImport(fd)
      if (!res.ok) {
        setPreview(null)
        setError(res.error)
        return
      }
      setPreview(res.preview)
      setMapping(res.preview.suggestedMapping)
    })
  }

  function handleExport() {
    setError(null)
    startTransition(async () => {
      const res = await exportCatalogExcel()
      if (!res.ok) {
        setError(res.error)
        return
      }
      const bytes = Uint8Array.from(atob(res.base64), (c) => c.charCodeAt(0))
      const blob = new Blob([bytes], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = res.filename
      a.click()
      URL.revokeObjectURL(url)
    })
  }

  function handleImport() {
    const file = fileRef.current?.files?.[0]
    if (!file || !preview) return

    const fd = new FormData()
    fd.set("file", file)
    for (const field of MAPPING_FIELDS) {
      const col = mapping[field]
      fd.set(`map_${field}`, col ?? "__none__")
    }

    setError(null)
    setResult(null)
    startTransition(async () => {
      const res = await importCatalogFromExcel(fd)
      if (!res.ok) {
        setError(res.error)
        return
      }
      setResult(
        `Importación lista: ${res.created} nuevos, ${res.updated} actualizados` +
          (res.skipped > 0 ? `, ${res.skipped} omitidos` : "") +
          ". Los productos ya están en el catálogo de abajo.",
      )
      setPreview(null)
      if (fileRef.current) fileRef.current.value = ""
      router.refresh()
    })
  }

  return (
    <div className="bg-[#141414] border border-white/10 rounded-xl p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Importar / Exportar Excel</h2>
          <p className="text-xs text-white/45 mt-1 max-w-xl">
            Una sola hoja con columnas SKU, Categoría, Nombre y Precio. También
            podés subir tu archivo con varias hojas (cada hoja = categoría); al
            exportar todo queda unificado. El SKU mantiene precio y código aunque
            cambie el nombre.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={pending}
            className="px-3 py-2 text-xs rounded-lg border border-white/15 hover:bg-white/5 disabled:opacity-50"
          >
            Exportar .xlsx
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen((v) => !v)
              if (open) reset()
            }}
            className="px-3 py-2 text-xs rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30"
          >
            {open ? "Cerrar importación" : "Importar .xlsx"}
          </button>
        </div>
      </div>

      {open && (
        <div className="space-y-4 pt-2 border-t border-white/10">
          <label className="block">
            <span className="text-xs text-white/50">Archivo Excel</span>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="mt-1 block w-full text-sm text-white/70 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-white/10 file:text-white/80"
            />
          </label>

          {preview && (
            <>
              <p className="text-xs text-white/45">
                {preview.totalRows} productos listos para importar
                {preview.sheetNames.length > 1 && !preview.unifiedSheet
                  ? ` (${preview.sheetNames.length} hojas del Excel)`
                  : ""}
                . La tabla muestra todos; al confirmar se cargan en el catálogo de abajo.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {MAPPING_FIELDS.map((field) => (
                  <label key={field} className="block space-y-1">
                    <span className="text-xs text-white/50">
                      {CATALOG_FIELD_LABELS[field]}
                      {REQUIRED_FIELDS.has(field) ? " *" : ""}
                    </span>
                    <select
                      value={mapping[field] ?? "__none__"}
                      onChange={(e) =>
                        setMapping((m) => ({
                          ...m,
                          [field]:
                            e.target.value === "__none__"
                              ? undefined
                              : e.target.value,
                        }))
                      }
                      className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-2 py-2 text-sm"
                    >
                      <option value="__none__">— No usar —</option>
                      {preview.headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>

              <div className="overflow-auto max-h-[min(24rem,50vh)] rounded-lg border border-white/10">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-white/40 border-b border-white/10">
                      <th className="p-2">SKU</th>
                      <th className="p-2">Categoría</th>
                      <th className="p-2">Nombre</th>
                      <th className="p-2">Precio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.previewRows.map((row, i) => (
                      <tr key={i} className="border-b border-white/5">
                        <td className="p-2 font-mono text-[10px] text-white/60">
                          {row.sku}
                        </td>
                        <td className="p-2 text-white/50">{row.category}</td>
                        <td className="p-2">{row.name}</td>
                        <td className="p-2 text-green-400">
                          {formatCurrency(row.unitPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                onClick={handleImport}
                disabled={pending || !mapping.name || !mapping.unitPrice}
                className="px-4 py-2 text-sm rounded-xl bg-green-500 text-black font-semibold disabled:opacity-50"
              >
                {pending ? "Importando…" : `Confirmar importación (${preview.totalRows})`}
              </button>
            </>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}
          {result && <p className="text-sm text-green-300">{result}</p>}
        </div>
      )}
    </div>
  )
}
