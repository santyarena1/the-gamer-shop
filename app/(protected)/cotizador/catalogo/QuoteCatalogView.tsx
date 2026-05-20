"use client"

import { useActionState, useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  createQuoteCatalogItem,
  updateQuoteCatalogItem,
  deleteQuoteCatalogItem,
  patchQuoteCatalogItemQuick,
} from "@/actions/quote-catalog"
import CatalogImportExport from "@/components/cotizador/CatalogImportExport"
import { PC_SLOTS, SLOT_LABELS } from "@/lib/quote-builder-constants"
import { formatCurrency } from "@/lib/utils"

type Item = {
  id: string
  name: string
  sku: string | null
  category: string
  unitPrice: number
  description: string | null
  active: boolean
}

type StatusFilter = "active" | "inactive" | "all"
type SortKey = "name" | "price-asc" | "price-desc" | "category"

export default function QuoteCatalogView({
  items: initialItems,
  isAdmin,
}: {
  items: Item[]
  isAdmin: boolean
}) {
  const router = useRouter()
  const [items, setItems] = useState(initialItems)

  useEffect(() => {
    setItems(initialItems)
  }, [initialItems])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Item | null>(null)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")
  const [status, setStatus] = useState<StatusFilter>("active")
  const [priceMin, setPriceMin] = useState("")
  const [priceMax, setPriceMax] = useState("")
  const [sort, setSort] = useState<SortKey>("name")
  const [filtersOpen, setFiltersOpen] = useState(false)

  const [createError, createAction, createPending] = useActionState(
    async (prev: string | null, fd: FormData) => createQuoteCatalogItem(prev, fd),
    null,
  )
  const [updateError, updateAction, updatePending] = useActionState(
    async (prev: string | null, fd: FormData) => updateQuoteCatalogItem(prev, fd),
    null,
  )

  const categoryCounts = useMemo(() => {
    const map = new Map<string, number>()
    for (const item of items) {
      if (status === "active" && !item.active) continue
      if (status === "inactive" && item.active) continue
      map.set(item.category, (map.get(item.category) ?? 0) + 1)
    }
    return map
  }, [items, status])

  const categoryChips = useMemo(() => {
    const slotOrder = PC_SLOTS.map((s) => SLOT_LABELS[s.slot])
    const inCatalog = [...categoryCounts.keys()]
    const ordered = [
      ...slotOrder.filter((c) => categoryCounts.has(c)),
      ...inCatalog
        .filter((c) => !slotOrder.includes(c))
        .sort((a, b) => a.localeCompare(b, "es")),
    ]
    return ordered
  }, [categoryCounts])

  const totalForStatus = useMemo(() => {
    let n = 0
    for (const count of categoryCounts.values()) n += count
    return n
  }, [categoryCounts])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const min = priceMin ? parseFloat(priceMin) : null
    const max = priceMax ? parseFloat(priceMax) : null

    let rows = items.filter((item) => {
      if (status === "active" && !item.active) return false
      if (status === "inactive" && item.active) return false
      if (category && item.category !== category) return false

      if (q) {
        const hay = [item.name, item.sku, item.category, item.description]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
        if (!hay.includes(q)) return false
      }

      if (min != null && Number.isFinite(min) && item.unitPrice < min) return false
      if (max != null && Number.isFinite(max) && item.unitPrice > max) return false

      return true
    })

    rows = [...rows].sort((a, b) => {
      switch (sort) {
        case "price-asc":
          return a.unitPrice - b.unitPrice
        case "price-desc":
          return b.unitPrice - a.unitPrice
        case "category":
          return (
            a.category.localeCompare(b.category, "es") ||
            a.name.localeCompare(b.name, "es")
          )
        default:
          return a.name.localeCompare(b.name, "es")
      }
    })

    return rows
  }, [items, search, category, status, priceMin, priceMax, sort])

  const hasActiveFilters =
    search || category || status !== "active" || priceMin || priceMax

  function clearFilters() {
    setSearch("")
    setCategory("")
    setStatus("active")
    setPriceMin("")
    setPriceMax("")
  }

  function patchItemLocal(id: string, patch: Partial<Pick<Item, "name" | "unitPrice">>) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    )
  }

  return (
    <div className="space-y-6">
      {isAdmin && <CatalogImportExport />}

      {isAdmin && (
        <button
          type="button"
          onClick={() => {
            setEditing(null)
            setShowForm(true)
          }}
          className="px-4 py-2 text-sm rounded-xl bg-green-500 hover:bg-green-400 text-black font-semibold"
        >
          + Producto interno
        </button>
      )}

      {showForm && isAdmin && (
        <CatalogForm
          editing={editing}
          error={editing ? updateError : createError}
          pending={createPending || updatePending}
          action={editing ? updateAction : createAction}
          onClose={() => {
            setShowForm(false)
            setEditing(null)
            router.refresh()
          }}
        />
      )}

      {/* Buscador y filtros */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xl">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">
              ⌕
            </span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, SKU, categoría…"
              className="w-full bg-[#141414] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-green-500/50"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setFiltersOpen((v) => !v)}
              className={`px-3 py-2.5 text-sm rounded-xl border transition-colors ${
                filtersOpen || hasActiveFilters
                  ? "border-green-500/40 bg-green-500/10 text-green-400"
                  : "border-white/10 text-white/70 hover:bg-white/5"
              }`}
            >
              Filtros {hasActiveFilters ? "•" : ""}
            </button>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="px-3 py-2.5 text-sm rounded-xl text-red-300 border border-red-500/20 hover:bg-red-500/10"
              >
                Limpiar
              </button>
            )}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="bg-[#141414] border border-white/10 rounded-xl px-3 py-2.5 text-sm"
            >
              <option value="name">Nombre A→Z</option>
              <option value="category">Categoría</option>
              <option value="price-asc">Precio ↑</option>
              <option value="price-desc">Precio ↓</option>
            </select>
          </div>
        </div>

        {/* Filtros por categoría (siempre visibles) */}
        {categoryChips.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-white/40">Categoría</p>
            <div className="flex flex-wrap gap-2">
              <CategoryChip
                label="Todas"
                count={totalForStatus}
                active={!category}
                onClick={() => setCategory("")}
              />
              {categoryChips.map((cat) => (
                <CategoryChip
                  key={cat}
                  label={cat}
                  count={categoryCounts.get(cat) ?? 0}
                  active={category === cat}
                  onClick={() => setCategory(category === cat ? "" : cat)}
                />
              ))}
            </div>
          </div>
        )}

        {filtersOpen && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4 rounded-xl bg-[#141414] border border-white/10">
            <label className="block space-y-1">
              <span className="text-xs text-white/50">Estado</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusFilter)}
                className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm"
              >
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
                <option value="all">Todos</option>
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-white/50">Precio mín.</span>
              <input
                type="number"
                min={0}
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
                className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-white/50">Precio máx.</span>
              <input
                type="number"
                min={0}
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
                className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm"
              />
            </label>
          </div>
        )}

        <p className="text-xs text-white/40">
          <strong className="text-white/70">{filtered.length}</strong> de{" "}
          {items.length} productos
          {isAdmin && filtered.length > 0 && (
            <span className="text-white/30">
              {" "}
              · editá nombre y precio directo en la tabla (Enter o al salir del campo)
            </span>
          )}
        </p>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-white/50">
          {items.length === 0
            ? "No hay productos todavía. Importá el Excel o creá uno manualmente."
            : "No hay resultados con estos filtros."}
        </p>
      ) : (
        <div className="overflow-auto rounded-xl border border-white/10">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left text-xs text-white/40 border-b border-white/10 bg-[#141414]">
                <th className="p-3 font-medium">Nombre</th>
                <th className="p-3 font-medium w-36">Precio</th>
                <th className="p-3 font-medium hidden md:table-cell">Categoría</th>
                <th className="p-3 font-medium hidden lg:table-cell">SKU</th>
                {isAdmin && <th className="p-3 font-medium w-28" />}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <CatalogTableRow
                  key={item.id}
                  item={item}
                  isAdmin={isAdmin}
                  onPatchLocal={patchItemLocal}
                  onFullEdit={() => {
                    setEditing(item)
                    setShowForm(true)
                  }}
                  onDeactivate={async () => {
                    await deleteQuoteCatalogItem(item.id)
                    setItems((prev) =>
                      prev.map((i) =>
                        i.id === item.id ? { ...i, active: false } : i,
                      ),
                    )
                    router.refresh()
                  }}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function CategoryChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors ${
        active
          ? "bg-green-500/20 border-green-500/50 text-green-300"
          : "bg-[#141414] border-white/10 text-white/60 hover:border-white/25 hover:text-white/80"
      }`}
    >
      <span className="max-w-[10rem] truncate">{label}</span>
      <span
        className={`tabular-nums px-1.5 py-0.5 rounded-md text-[10px] ${
          active ? "bg-green-500/30" : "bg-white/5"
        }`}
      >
        {count}
      </span>
    </button>
  )
}

function CatalogTableRow({
  item,
  isAdmin,
  onPatchLocal,
  onFullEdit,
  onDeactivate,
}: {
  item: Item
  isAdmin: boolean
  onPatchLocal: (id: string, patch: Partial<Pick<Item, "name" | "unitPrice">>) => void
  onFullEdit: () => void
  onDeactivate: () => void | Promise<void>
}) {
  const [name, setName] = useState(item.name)
  const [price, setPrice] = useState(String(item.unitPrice))
  const [saveHint, setSaveHint] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function saveField(field: "name" | "unitPrice") {
    if (!isAdmin) return

    if (field === "name") {
      const trimmed = name.trim()
      if (!trimmed || trimmed === item.name) return
      startTransition(async () => {
        const res = await patchQuoteCatalogItemQuick({ id: item.id, name: trimmed })
        if (res.ok) {
          onPatchLocal(item.id, { name: trimmed })
          setSaveHint("Guardado")
        } else {
          setName(item.name)
          setSaveHint(res.error)
        }
        setTimeout(() => setSaveHint(null), 2000)
      })
      return
    }

    const parsed = parseFloat(price.replace(",", "."))
    if (!Number.isFinite(parsed) || parsed < 0) {
      setPrice(String(item.unitPrice))
      setSaveHint("Precio inválido")
      setTimeout(() => setSaveHint(null), 2000)
      return
    }
    if (parsed === item.unitPrice) return

    startTransition(async () => {
      const res = await patchQuoteCatalogItemQuick({
        id: item.id,
        unitPrice: parsed,
      })
      if (res.ok) {
        onPatchLocal(item.id, { unitPrice: parsed })
        setSaveHint("Guardado")
      } else {
        setPrice(String(item.unitPrice))
        setSaveHint(res.error)
      }
      setTimeout(() => setSaveHint(null), 2000)
    })
  }

  return (
    <tr
      className={`border-b border-white/5 hover:bg-white/[0.02] ${
        !item.active ? "opacity-50" : ""
      }`}
    >
      <td className="p-2 align-top">
        {isAdmin ? (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => saveField("name")}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                ;(e.target as HTMLInputElement).blur()
              }
            }}
            disabled={pending}
            className="w-full min-w-[12rem] bg-[#0f0f0f] border border-white/10 rounded-lg px-2.5 py-1.5 text-sm focus:border-green-500/50 focus:outline-none disabled:opacity-50"
          />
        ) : (
          <span className="px-2.5 py-1.5 block">{item.name}</span>
        )}
      </td>
      <td className="p-2 align-top">
        {isAdmin ? (
          <input
            type="number"
            min={0}
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            onBlur={() => saveField("unitPrice")}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                ;(e.target as HTMLInputElement).blur()
              }
            }}
            disabled={pending}
            className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-2.5 py-1.5 text-sm text-green-400 focus:border-green-500/50 focus:outline-none disabled:opacity-50"
          />
        ) : (
          <span className="px-2.5 py-1.5 block text-green-400 font-medium">
            {formatCurrency(item.unitPrice)}
          </span>
        )}
      </td>
      <td className="p-2 align-top hidden md:table-cell">
        <span className="text-xs text-white/50 px-2">{item.category}</span>
      </td>
      <td className="p-2 align-top hidden lg:table-cell">
        <span className="text-[10px] font-mono text-white/40 px-2">
          {item.sku ?? "—"}
        </span>
      </td>
      {isAdmin && (
        <td className="p-2 align-top">
          <div className="flex flex-col items-end gap-1">
            {saveHint && (
              <span
                className={`text-[10px] ${
                  saveHint === "Guardado" ? "text-green-400" : "text-red-400"
                }`}
              >
                {saveHint}
              </span>
            )}
            <div className="flex gap-1">
              <button
                type="button"
                onClick={onFullEdit}
                className="text-[11px] px-2 py-1 rounded-md bg-white/5 hover:bg-white/10"
              >
                Más
              </button>
              {item.active && (
                <button
                  type="button"
                  onClick={onDeactivate}
                  className="text-[11px] px-2 py-1 rounded-md text-red-300 hover:bg-red-500/10"
                >
                  Off
                </button>
              )}
            </div>
          </div>
        </td>
      )}
    </tr>
  )
}

function CatalogForm({
  editing,
  error,
  pending,
  action,
  onClose,
}: {
  editing: Item | null
  error: string | null
  pending: boolean
  action: React.ComponentProps<"form">["action"]
  onClose: () => void
}) {
  return (
    <form
      action={action}
      className="bg-[#141414] border border-white/10 rounded-xl p-5 space-y-4"
    >
      {editing && <input type="hidden" name="id" value={editing.id} />}
      {editing && <input type="hidden" name="active" value={String(editing.active)} />}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block space-y-1 sm:col-span-2">
          <span className="text-xs text-white/50">Nombre *</span>
          <input
            name="name"
            required
            defaultValue={editing?.name}
            className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-white/50">SKU</span>
          <input
            name="sku"
            defaultValue={editing?.sku ?? ""}
            placeholder="Vacío = se genera automático (TGS-…)"
            className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-white/50">Categoría</span>
          <input
            name="category"
            defaultValue={editing?.category ?? "Otro"}
            className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-white/50">Precio *</span>
          <input
            name="unitPrice"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={editing?.unitPrice}
            className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm"
          />
        </label>
        <label className="block space-y-1 sm:col-span-2">
          <span className="text-xs text-white/50">Descripción</span>
          <textarea
            name="description"
            rows={2}
            defaultValue={editing?.description ?? ""}
            className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm"
          />
        </label>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 text-sm rounded-xl bg-green-500 text-black font-semibold disabled:opacity-50"
        >
          {pending ? "Guardando…" : editing ? "Actualizar" : "Crear"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm rounded-xl border border-white/10"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
