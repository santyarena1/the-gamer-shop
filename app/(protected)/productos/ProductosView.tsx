"use client"

import { useMemo, useState } from "react"
import type { StockProduct } from "@/lib/acustock-feed"
import {
  distinctValues,
  PRODUCT_SORT_OPTIONS,
  productMatchesQuickFilters,
  sortProducts,
  type ProductSort,
} from "@/lib/product-catalog"
import {
  getProductDistributor,
  listDistributorsFromProducts,
  type DistributorOption,
} from "@/lib/product-sources"
import ProductCard from "@/components/productos/ProductCard"
import ProductDetailModal from "@/components/productos/ProductDetailModal"

const PAGE_SIZES = [24, 48, 96] as const

type Props = {
  products: StockProduct[]
  fetchedAt: string
  sourceUrl: string
  feedUnavailable?: boolean
}

export default function ProductosView({
  products,
  fetchedAt,
  sourceUrl,
  feedUnavailable = false,
}: Props) {
  const distributorOptions = useMemo(
    () => listDistributorsFromProducts(products),
    [products],
  )

  /** `null` = todos los distribuidores; si no, solo los códigos del set. */
  const [distributorFilter, setDistributorFilter] = useState<Set<string> | null>(null)
  const [hideOutOfStock, setHideOutOfStock] = useState(false)
  const [search, setSearch] = useState("")
  const [categoria, setCategoria] = useState("")
  const [marca, setMarca] = useState("")
  const [stockMode, setStockMode] = useState<"all" | "in" | "out" | "low">("all")
  const [priceMin, setPriceMin] = useState("")
  const [priceMax, setPriceMax] = useState("")
  const [sort, setSort] = useState<ProductSort>("nombre-asc")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(48)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [selected, setSelected] = useState<StockProduct | null>(null)

  const pool = useMemo(() => {
    if (distributorFilter === null) return products
    return products.filter((p) => distributorFilter.has(getProductDistributor(p)))
  }, [products, distributorFilter])

  const categorias = useMemo(() => distinctValues(pool, "categoria"), [pool])
  const marcas = useMemo(() => distinctValues(pool, "marca"), [pool])

  const filtered = useMemo(() => {
    const rows = pool.filter((p) =>
      productMatchesQuickFilters(p, {
        search,
        categoria,
        marca,
        stockMode,
        priceMin,
        priceMax,
        hideOutOfStock,
      }),
    )
    return sortProducts(rows, sort)
  }, [pool, search, categoria, marca, stockMode, priceMin, priceMax, hideOutOfStock, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const hasActiveFilters =
    search ||
    categoria ||
    marca ||
    stockMode !== "all" ||
    priceMin ||
    priceMax ||
    distributorFilter !== null ||
    hideOutOfStock

  function clearFilters() {
    setSearch("")
    setCategoria("")
    setMarca("")
    setStockMode("all")
    setPriceMin("")
    setPriceMax("")
    setDistributorFilter(null)
    setHideOutOfStock(false)
    setPage(1)
  }

  function toggleDistributor(code: string) {
    setDistributorFilter((prev) => {
      const allCodes = distributorOptions.map((d) => d.code)
      const isAll = prev === null
      const isSelected = isAll || (prev?.has(code) ?? false)

      if (isSelected) {
        if (isAll) {
          const next = new Set(allCodes)
          next.delete(code)
          return next
        }
        const next = new Set(prev!)
        next.delete(code)
        return next
      }

      const next = new Set(isAll ? [] : prev!)
      next.add(code)
      if (next.size >= allCodes.length) return null
      return next
    })
    setPage(1)
  }

  function selectAllDistributors() {
    setDistributorFilter(null)
    setPage(1)
  }

  function updateFilter<T>(setter: (v: T) => void, value: T) {
    setter(value)
    setPage(1)
  }

  return (
    <div className="space-y-4">
      <div className="bg-[#141414] border border-white/10 rounded-xl p-3 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">
              ⌕
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => updateFilter(setSearch, e.target.value)}
              placeholder="Buscar nombre, SKU, marca…"
              className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm focus:border-green-500/50 focus:outline-none"
            />
          </div>
          <DistributorFilterDropdown
            options={distributorOptions}
            filter={distributorFilter}
            onToggle={toggleDistributor}
            onSelectAll={selectAllDistributors}
          />
          <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-[#0f0f0f] text-sm shrink-0 cursor-pointer hover:bg-white/5">
            <input
              type="checkbox"
              checked={hideOutOfStock}
              onChange={(e) => updateFilter(setHideOutOfStock, e.target.checked)}
              className="rounded border-white/20"
            />
            <span className="text-white/70 whitespace-nowrap">Ocultar sin stock</span>
          </label>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as ProductSort)
              setPage(1)
            }}
            className="sm:w-40 bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm"
            aria-label="Ordenar productos"
          >
            {PRODUCT_SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className={`px-3 py-2 text-sm rounded-lg border shrink-0 ${
              filtersOpen || hasActiveFilters
                ? "border-green-500/40 bg-green-500/10 text-green-400"
                : "border-white/10 text-white/60 hover:bg-white/5"
            }`}
          >
            Filtros {hasActiveFilters ? "•" : ""}
          </button>
        </div>

        <p className="text-xs text-white/40">
          <strong className="text-white/70">{filtered.length.toLocaleString("es-AR")}</strong>{" "}
          de {pool.length.toLocaleString("es-AR")} visibles
          {feedUnavailable && (
            <span className="text-amber-400/80"> · feed AcuStock no disponible</span>
          )}
          {!feedUnavailable && sourceUrl && (
            <span className="text-white/25">
              {" "}
              · actualizado{" "}
              {new Date(fetchedAt).toLocaleString("es-AR", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </span>
          )}
        </p>

        {filtersOpen && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-1 border-t border-white/10">
            <FilterSelect
              label="Categoría"
              value={categoria}
              onChange={(v) => updateFilter(setCategoria, v)}
              options={categorias}
            />
            <FilterSelect
              label="Marca"
              value={marca}
              onChange={(v) => updateFilter(setMarca, v)}
              options={marcas}
            />
            <FilterSelect
              label="Stock"
              value={stockMode}
              onChange={(v) => updateFilter(setStockMode, v as typeof stockMode)}
              options={[
                { value: "all", label: "Todos" },
                { value: "in", label: "Con stock" },
                { value: "out", label: "Sin stock" },
                { value: "low", label: "Stock bajo" },
              ]}
            />
            <FilterInput
              label="Precio mín."
              value={priceMin}
              onChange={(v) => updateFilter(setPriceMin, v)}
              type="number"
            />
            <FilterInput
              label="Precio máx."
              value={priceMax}
              onChange={(v) => updateFilter(setPriceMax, v)}
              type="number"
            />
            <label className="block space-y-1">
              <span className="text-[10px] text-white/50">Por página</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value) as (typeof PAGE_SIZES)[number])
                  setPage(1)
                }}
                className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-2 py-1.5 text-sm"
              >
                {PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            {hasActiveFilters && (
              <div className="flex items-end col-span-2 sm:col-span-1">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs px-2 py-1.5 rounded-lg text-red-300 border border-red-500/20 hover:bg-red-500/10"
                >
                  Limpiar
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {pageItems.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-white/10 bg-[#141414]/50">
          <p className="text-white/50 text-sm">No hay productos con estos filtros</p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-3 text-sm text-green-400 hover:underline"
            >
              Quitar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
          {pageItems.map((product, i) => (
            <ProductCard
              key={`${getProductKey(product)}-${i}`}
              product={product}
              onClick={() => setSelected(product)}
            />
          ))}
        </div>
      )}

      {filtered.length > pageSize && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-white/40">
          <span>
            Página {currentPage} de {totalPages}
          </span>
          <div className="flex gap-2">
            <PaginationBtn
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ← Anterior
            </PaginationBtn>
            <PaginationBtn
              disabled={currentPage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Siguiente →
            </PaginationBtn>
          </div>
        </div>
      )}

      {selected && (
        <ProductDetailModal product={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}

function DistributorFilterDropdown({
  options,
  filter,
  onToggle,
  onSelectAll,
}: {
  options: DistributorOption[]
  filter: Set<string> | null
  onToggle: (code: string) => void
  onSelectAll: () => void
}) {
  const allSelected = filter === null
  const selectedCount = allSelected ? options.length : filter.size
  const summary =
    allSelected || selectedCount === options.length
      ? "Distribuidores"
      : `${selectedCount} distrib.`

  return (
    <details className="relative sm:w-44 shrink-0 group">
      <summary
        className={`list-none cursor-pointer bg-[#0f0f0f] border rounded-lg px-3 py-2 text-sm flex items-center justify-between gap-2 ${
          !allSelected && selectedCount < options.length
            ? "border-green-500/40 text-green-300"
            : "border-white/10 text-white/80"
        }`}
      >
        <span className="truncate">{summary}</span>
        <span className="text-white/40 text-xs">▾</span>
      </summary>
      <div className="absolute z-20 mt-1 w-56 max-h-64 overflow-y-auto rounded-lg border border-white/10 bg-[#141414] shadow-xl py-1">
        <button
          type="button"
          onClick={onSelectAll}
          className="w-full text-left px-3 py-1.5 text-xs text-green-400 hover:bg-white/5"
        >
          Todos
        </button>
        {options.map((d) => {
          const checked = allSelected || filter.has(d.code)
          return (
            <label
              key={d.code}
              className="flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-white/5 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(d.code)}
                className="rounded border-white/20 shrink-0"
              />
              <span className="flex-1 truncate">{d.label}</span>
              <span className="text-[10px] text-white/35 tabular-nums">{d.count}</span>
            </label>
          )
        })}
      </div>
    </details>
  )
}

function getProductKey(product: StockProduct) {
  return product._catalogId ?? product.id ?? product.sku ?? product.nombre ?? ""
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[] | { value: string; label: string }[]
}) {
  const opts = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o))
  return (
    <label className="block space-y-1">
      <span className="text-[10px] text-white/50">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-2 py-1.5 text-sm"
      >
        <option value="">Todos</option>
        {opts.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function FilterInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
}) {
  return (
    <label className="block space-y-1">
      <span className="text-[10px] text-white/50">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-2 py-1.5 text-sm"
      />
    </label>
  )
}

function PaginationBtn({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="px-3 py-1.5 rounded-lg border border-white/10 bg-[#141414] hover:bg-white/5 disabled:opacity-40"
    >
      {children}
    </button>
  )
}
