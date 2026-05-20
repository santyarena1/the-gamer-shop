"use client"

import { useMemo, useState } from "react"
import type { StockProduct } from "@/lib/acustock-feed"
import {
  distinctValues,
  productMatchesQuickFilters,
  sortProducts,
  type ProductSort,
} from "@/lib/product-catalog"
import ProductCard from "@/components/productos/ProductCard"
import ProductDetailModal from "@/components/productos/ProductDetailModal"

const PAGE_SIZES = [24, 48, 96] as const

type Props = {
  products: StockProduct[]
  fetchedAt: string
  sourceUrl: string
  internalCount?: number
  feedUnavailable?: boolean
}

export default function ProductosView({
  products,
  fetchedAt,
  sourceUrl,
  internalCount = 0,
  feedUnavailable = false,
}: Props) {
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

  const categorias = useMemo(() => distinctValues(products, "categoria"), [products])
  const marcas = useMemo(() => distinctValues(products, "marca"), [products])

  const filtered = useMemo(() => {
    const rows = products.filter((p) =>
      productMatchesQuickFilters(p, { search, categoria, marca, stockMode, priceMin, priceMax }),
    )
    return sortProducts(rows, sort)
  }, [products, search, categoria, marca, stockMode, priceMin, priceMax, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const hasActiveFilters =
    search || categoria || marca || stockMode !== "all" || priceMin || priceMax

  function clearFilters() {
    setSearch("")
    setCategoria("")
    setMarca("")
    setStockMode("all")
    setPriceMin("")
    setPriceMax("")
    setPage(1)
  }

  function updateFilter<T>(setter: (v: T) => void, value: T) {
    setter(value)
    setPage(1)
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="relative flex-1 max-w-xl">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">⌕</span>
          <input
            type="search"
            value={search}
            onChange={(e) => updateFilter(setSearch, e.target.value)}
            placeholder="Buscar por nombre, SKU, marca, categoría…"
            className="w-full bg-[#141414] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-green-500/60 focus:ring-1 focus:ring-green-500/30 transition-shadow"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value as ProductSort)
              setPage(1)
            }}
            className="bg-[#141414] border border-white/10 rounded-xl px-3 py-2.5 text-sm"
          >
            <option value="nombre-asc">Nombre A → Z</option>
            <option value="nombre-desc">Nombre Z → A</option>
            <option value="precio-asc">Precio menor</option>
            <option value="precio-desc">Precio mayor</option>
            <option value="stock-desc">Más stock</option>
          </select>
          <button
            type="button"
            onClick={() => setFiltersOpen((v) => !v)}
            className={`px-4 py-2.5 text-sm rounded-xl border transition-colors ${
              filtersOpen || hasActiveFilters
                ? "border-green-500/40 bg-green-500/10 text-green-400"
                : "border-white/10 bg-[#141414] text-white/70 hover:bg-white/5"
            }`}
          >
            Filtros {hasActiveFilters && "•"}
          </button>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="px-3 py-2.5 text-sm rounded-xl text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/45">
        <span>
          <strong className="text-white/80">{filtered.length.toLocaleString("es-AR")}</strong> de{" "}
          {products.length.toLocaleString("es-AR")} productos
        </span>
        {internalCount > 0 && (
          <>
            <span className="text-white/20">·</span>
            <span>
              <strong className="text-sky-300/90">{internalCount}</strong> del catálogo interno
            </span>
          </>
        )}
        {!feedUnavailable && sourceUrl && (
          <>
            <span className="text-white/20">·</span>
            <span>
              Actualizado {new Date(fetchedAt).toLocaleString("es-AR")} · sync automático cada 1 h
            </span>
          </>
        )}
      </div>

      {/* Filters panel */}
      {filtersOpen && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3 p-4 rounded-2xl bg-[#141414] border border-white/10">
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
              { value: "low", label: "Stock bajo (≤5)" },
            ]}
          />
          <FilterInput
            label="Precio mín."
            value={priceMin}
            onChange={(v) => updateFilter(setPriceMin, v)}
            placeholder="0"
            type="number"
          />
          <FilterInput
            label="Precio máx."
            value={priceMax}
            onChange={(v) => updateFilter(setPriceMax, v)}
            placeholder="999999"
            type="number"
          />
          <div className="flex items-end">
            <label className="block w-full space-y-1">
              <span className="text-[11px] text-white/50">Por página</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value) as (typeof PAGE_SIZES)[number])
                  setPage(1)
                }}
                className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-2.5 py-2 text-sm"
              >
                {PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      )}

      {/* Grid */}
      {pageItems.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-white/10 bg-[#141414]/50">
          <p className="text-4xl mb-3 opacity-30">📦</p>
          <p className="text-white/50">No hay productos con estos filtros</p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 text-sm text-green-400 hover:underline"
            >
              Quitar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {pageItems.map((product, i) => (
            <ProductCard
              key={`${getProductKey(product)}-${i}`}
              product={product}
              onClick={() => setSelected(product)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {filtered.length > pageSize && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <p className="text-xs text-white/40">
            Página {currentPage} de {totalPages}
          </p>
          <div className="flex items-center gap-2">
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

      <p className="text-[11px] text-white/25">
        Catálogo desde{" "}
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-green-500/60 hover:underline"
        >
          AcuStock
        </a>
        . Las fotos se muestran si el feed las incluye o si AcuStock expone imagen por ID.
      </p>

      {selected && (
        <ProductDetailModal product={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}

function getProductKey(product: StockProduct) {
  return product.id ?? product.sku ?? product.nombre ?? ""
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
      <span className="text-[11px] text-white/50">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:border-green-500"
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
  placeholder,
  type = "text",
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] text-white/50">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:border-green-500"
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
      className="px-3 py-1.5 text-xs rounded-lg border border-white/10 bg-[#141414] hover:bg-white/5 disabled:opacity-40 disabled:pointer-events-none transition-colors"
    >
      {children}
    </button>
  )
}

