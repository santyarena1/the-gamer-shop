"use client"

import { useActionState, useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  adjustPurchaseGoalProgress,
  createMarketingBrand,
  createPurchaseGoalCategory,
  deleteMarketingBrand,
  deletePurchaseGoalCategory,
  updatePurchaseGoalCategory,
} from "@/actions/marketing-purchase-goals"

export type PurchaseGoalBrand = {
  id: string
  name: string
  categories: {
    id: string
    name: string
    targetAmount: number
    currentAmount: number
  }[]
}

function goalProgress(current: number, target: number) {
  if (target <= 0) return current > 0 ? 100 : 0
  return Math.min(100, Math.round((current / target) * 100))
}

function goalReached(current: number, target: number) {
  return target > 0 && current >= target
}

function brandStats(brand: PurchaseGoalBrand) {
  const total = brand.categories.length
  const done = brand.categories.filter((c) =>
    goalReached(c.currentAmount, c.targetAmount),
  ).length
  return { total, done }
}

export default function PurchaseGoalsView({
  brands: initialBrands,
}: {
  brands: PurchaseGoalBrand[]
}) {
  const router = useRouter()
  const [brands, setBrands] = useState(initialBrands)
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(
    initialBrands[0]?.id ?? null,
  )
  const [showNewBrand, setShowNewBrand] = useState(false)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    setBrands(initialBrands)
  }, [initialBrands])

  useEffect(() => {
    setSelectedBrandId((id) => {
      if (id && initialBrands.some((b) => b.id === id)) return id
      return initialBrands[0]?.id ?? null
    })
  }, [initialBrands])

  const [brandError, createBrandAction, brandPending] = useActionState(
    createMarketingBrand,
    null,
  )
  const [catError, createCatAction, catPending] = useActionState(
    createPurchaseGoalCategory,
    null,
  )

  const selected = brands.find((b) => b.id === selectedBrandId) ?? null

  function refresh() {
    router.refresh()
  }

  function patchCategory(
    brandId: string,
    categoryId: string,
    patch: Partial<PurchaseGoalBrand["categories"][0]>,
  ) {
    setBrands((prev) =>
      prev.map((b) =>
        b.id !== brandId
          ? b
          : {
              ...b,
              categories: b.categories.map((c) =>
                c.id === categoryId ? { ...c, ...patch } : c,
              ),
            },
      ),
    )
  }

  function handleAdjust(categoryId: string, delta: number) {
    if (!selectedBrandId) return
    startTransition(async () => {
      const res = await adjustPurchaseGoalProgress(categoryId, delta)
      if (res.ok) {
        patchCategory(selectedBrandId, categoryId, {
          currentAmount: res.currentAmount,
        })
      }
    })
  }

  function deleteBrand(brand: PurchaseGoalBrand) {
    if (!confirm(`¿Eliminar "${brand.name}" y todas sus categorías?`)) return
    startTransition(async () => {
      await deleteMarketingBrand(brand.id)
      setBrands((prev) => prev.filter((b) => b.id !== brand.id))
      setSelectedBrandId((id) =>
        id === brand.id ? brands.find((b) => b.id !== brand.id)?.id ?? null : id,
      )
      refresh()
    })
  }

  if (brands.length === 0) {
    return (
      <div className="max-w-md space-y-3">
        <p className="text-sm text-white/50">Creá tu primera marca para empezar.</p>
        <NewBrandForm
          action={createBrandAction}
          pending={brandPending}
          error={brandError}
          onSuccess={() => {
            setShowNewBrand(false)
            refresh()
          }}
          compact={false}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 min-h-[min(70vh,720px)]">
      {/* Panel marcas */}
      <aside className="lg:w-56 shrink-0 flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-medium text-white/40 uppercase tracking-wide">
            Marcas
          </span>
          <button
            type="button"
            onClick={() => setShowNewBrand((v) => !v)}
            className="text-xs px-2 py-1 rounded-md text-green-400 hover:bg-green-500/10"
          >
            {showNewBrand ? "Cerrar" : "+ Nueva"}
          </button>
        </div>

        {showNewBrand && (
          <NewBrandForm
            action={createBrandAction}
            pending={brandPending}
            error={brandError}
            onSuccess={() => {
              setShowNewBrand(false)
              refresh()
            }}
            compact
          />
        )}

        <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-y-auto lg:max-h-[calc(70vh-8rem)] pb-1 lg:pb-0">
          {brands.map((brand) => {
            const { total, done } = brandStats(brand)
            const active = selectedBrandId === brand.id
            const allDone = total > 0 && done === total
            return (
              <button
                key={brand.id}
                type="button"
                onClick={() => setSelectedBrandId(brand.id)}
                className={`group flex items-center gap-2 w-full min-w-[140px] lg:min-w-0 text-left px-3 py-2 rounded-lg text-sm transition-colors border ${
                  active
                    ? "bg-green-500/15 border-green-500/40 text-green-200"
                    : "border-transparent text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span
                  className={`w-0.5 self-stretch rounded-full shrink-0 ${
                    active ? "bg-green-500" : "bg-transparent group-hover:bg-white/20"
                  }`}
                />
                <span className="flex-1 truncate font-medium">{brand.name}</span>
                {total > 0 ? (
                  <span
                    className={`text-[10px] tabular-nums px-1.5 py-0.5 rounded shrink-0 ${
                      allDone
                        ? "bg-green-500/25 text-green-300"
                        : "bg-white/10 text-white/45"
                    }`}
                  >
                    {done}/{total}
                  </span>
                ) : (
                  <span className="text-[10px] text-white/25 shrink-0">—</span>
                )}
              </button>
            )
          })}
        </div>
      </aside>

      {/* Panel categorías */}
      {selected ? (
        <section className="flex-1 min-w-0 bg-[#141414] border border-white/10 rounded-xl flex flex-col overflow-hidden">
          <header className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-white/10 shrink-0">
            <div className="min-w-0">
              <h2 className="font-semibold text-base truncate">{selected.name}</h2>
              {(() => {
                const { total, done } = brandStats(selected)
                if (total === 0) return null
                return (
                  <p className="text-[11px] text-white/40 mt-0.5">
                    {done} de {total} objetivo{total === 1 ? "" : "s"} cumplido
                    {done === total ? " ✓" : ""}
                  </p>
                )
              })()}
            </div>
            <button
              type="button"
              onClick={() => deleteBrand(selected)}
              className="text-[11px] px-2 py-1 rounded-md text-red-300/70 hover:bg-red-500/10 shrink-0"
            >
              Eliminar marca
            </button>
          </header>

          <div className="p-3 border-b border-white/10 shrink-0">
            <form
              action={createCatAction}
              className="flex flex-wrap items-center gap-2"
              onSubmit={() => setTimeout(refresh, 100)}
            >
              <input type="hidden" name="brandId" value={selected.id} />
              <input
                name="name"
                required
                placeholder="Nueva categoría…"
                className="flex-1 min-w-[120px] bg-[#0f0f0f] border border-white/10 rounded-lg px-2.5 py-1.5 text-sm"
              />
              <input
                name="targetAmount"
                type="number"
                min={0}
                step={1}
                required
                defaultValue={10}
                title="Objetivo"
                className="w-16 bg-[#0f0f0f] border border-white/10 rounded-lg px-2 py-1.5 text-sm text-center tabular-nums"
              />
              <span className="text-[10px] text-white/30 hidden sm:inline">obj.</span>
              <button
                type="submit"
                disabled={catPending}
                className="px-3 py-1.5 text-xs rounded-lg bg-green-500 text-black font-semibold disabled:opacity-50"
              >
                Agregar
              </button>
            </form>
            {catError && <p className="text-xs text-red-400 mt-1.5">{catError}</p>}
          </div>

          <div className="flex-1 overflow-auto">
            {selected.categories.length === 0 ? (
              <p className="p-4 text-sm text-white/40 text-center">
                Sin categorías. Agregá una arriba.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[#141414] z-10">
                  <tr className="text-[10px] uppercase tracking-wide text-white/35 border-b border-white/10">
                    <th className="text-left font-medium px-4 py-2">Categoría</th>
                    <th className="text-left font-medium px-2 py-2 w-[28%]">Avance</th>
                    <th className="text-center font-medium px-2 py-2 w-28">Contador</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {selected.categories.map((cat) => (
                    <CategoryTableRow
                      key={cat.id}
                      cat={cat}
                      pending={pending}
                      onAdjust={(d) => handleAdjust(cat.id, d)}
                      onDelete={() => {
                        if (!confirm(`¿Eliminar "${cat.name}"?`)) return
                        startTransition(async () => {
                          await deletePurchaseGoalCategory(cat.id)
                          setBrands((prev) =>
                            prev.map((b) =>
                              b.id !== selected.id
                                ? b
                                : {
                                    ...b,
                                    categories: b.categories.filter(
                                      (c) => c.id !== cat.id,
                                    ),
                                  },
                            ),
                          )
                          refresh()
                        })
                      }}
                      onUpdateTarget={(targetAmount) => {
                        const fd = new FormData()
                        fd.set("id", cat.id)
                        fd.set("name", cat.name)
                        fd.set("targetAmount", String(targetAmount))
                        startTransition(async () => {
                          const err = await updatePurchaseGoalCategory(null, fd)
                          if (!err) {
                            patchCategory(selected.id, cat.id, { targetAmount })
                            refresh()
                          }
                        })
                      }}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      ) : (
        <div className="flex-1 flex items-center justify-center text-sm text-white/40 border border-dashed border-white/10 rounded-xl">
          Elegí una marca
        </div>
      )}
    </div>
  )
}

function NewBrandForm({
  action,
  pending,
  error,
  onSuccess,
  compact,
}: {
  action: React.ComponentProps<"form">["action"]
  pending: boolean
  error: string | null
  onSuccess: () => void
  compact?: boolean
}) {
  return (
    <form
      action={action}
      onSubmit={() => setTimeout(onSuccess, 100)}
      className={`bg-[#141414] border border-white/10 rounded-lg p-2 space-y-2 ${compact ? "" : "p-4 rounded-xl"}`}
    >
      <input
        name="name"
        required
        placeholder="Nombre de marca"
        className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-2.5 py-1.5 text-sm"
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full py-1.5 text-xs rounded-lg bg-green-500 text-black font-semibold disabled:opacity-50"
      >
        {pending ? "…" : "Crear marca"}
      </button>
    </form>
  )
}

function CategoryTableRow({
  cat,
  pending,
  onAdjust,
  onDelete,
  onUpdateTarget,
}: {
  cat: PurchaseGoalBrand["categories"][0]
  pending: boolean
  onAdjust: (delta: number) => void
  onDelete: () => void
  onUpdateTarget: (target: number) => void
}) {
  const pct = goalProgress(cat.currentAmount, cat.targetAmount)
  const reached = goalReached(cat.currentAmount, cat.targetAmount)
  const [editingTarget, setEditingTarget] = useState(false)
  const [targetInput, setTargetInput] = useState(String(cat.targetAmount))

  return (
    <tr
      className={`border-b border-white/5 last:border-0 ${
        reached ? "bg-green-500/[0.04]" : "hover:bg-white/[0.02]"
      }`}
    >
      <td className="px-4 py-2.5 align-middle">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-medium truncate">{cat.name}</span>
          {reached && (
            <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">
              ✓
            </span>
          )}
        </div>
      </td>
      <td className="px-2 py-2.5 align-middle">
        <div className="flex items-center gap-2 min-w-[100px]">
          <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full ${reached ? "bg-green-500" : "bg-green-500/60"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[10px] text-white/35 tabular-nums w-8 text-right">
            {pct}%
          </span>
        </div>
        <p className="text-[10px] text-white/30 mt-0.5 tabular-nums">
          {editingTarget ? (
            <input
              type="number"
              min={0}
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              onBlur={() => {
                const n = parseFloat(targetInput)
                if (Number.isFinite(n) && n >= 0) onUpdateTarget(n)
                setEditingTarget(false)
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur()
              }}
              className="w-12 bg-[#0f0f0f] border border-white/10 rounded px-1 text-[10px]"
              autoFocus
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setTargetInput(String(cat.targetAmount))
                setEditingTarget(true)
              }}
              className="hover:text-white/50"
            >
              meta {cat.targetAmount}
            </button>
          )}
        </p>
      </td>
      <td className="px-2 py-2.5 align-middle">
        <div className="flex items-center justify-center gap-0.5">
          <button
            type="button"
            disabled={pending || cat.currentAmount <= 0}
            onClick={() => onAdjust(-1)}
            className="w-7 h-7 rounded-md border border-white/10 text-sm hover:bg-white/5 disabled:opacity-25"
            aria-label="Restar"
          >
            −
          </button>
          <span className="w-9 text-center font-semibold tabular-nums text-green-400">
            {cat.currentAmount}
          </span>
          <button
            type="button"
            disabled={pending}
            onClick={() => onAdjust(1)}
            className="w-7 h-7 rounded-md border border-green-500/35 bg-green-500/10 text-sm text-green-300 hover:bg-green-500/20 disabled:opacity-25"
            aria-label="Sumar"
          >
            +
          </button>
        </div>
      </td>
      <td className="px-2 py-2.5 align-middle">
        <button
          type="button"
          onClick={onDelete}
          className="w-7 h-7 rounded-md text-white/25 hover:text-red-300 hover:bg-red-500/10 text-xs"
          title="Eliminar"
        >
          ×
        </button>
      </td>
    </tr>
  )
}
