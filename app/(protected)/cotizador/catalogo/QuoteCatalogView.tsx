"use client"

import { useActionState, useState } from "react"
import {
  createQuoteCatalogItem,
  updateQuoteCatalogItem,
  deleteQuoteCatalogItem,
} from "@/actions/quote-catalog"
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

export default function QuoteCatalogView({
  items,
  isAdmin,
}: {
  items: Item[]
  isAdmin: boolean
}) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Item | null>(null)

  const [createError, createAction, createPending] = useActionState(
    async (prev: string | null, fd: FormData) => createQuoteCatalogItem(prev, fd),
    null,
  )
  const [updateError, updateAction, updatePending] = useActionState(
    async (prev: string | null, fd: FormData) => updateQuoteCatalogItem(prev, fd),
    null,
  )

  const activeItems = items.filter((i) => i.active)
  const inactiveItems = items.filter((i) => !i.active)

  return (
    <div className="space-y-6">
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
          }}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {activeItems.map((item) => (
          <CatalogCard
            key={item.id}
            item={item}
            isAdmin={isAdmin}
            onEdit={() => {
              setEditing(item)
              setShowForm(true)
            }}
            onDelete={() => deleteQuoteCatalogItem(item.id)}
          />
        ))}
      </div>

      {inactiveItems.length > 0 && (
        <div>
          <p className="text-xs text-white/40 mb-2">Inactivos</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 opacity-50">
            {inactiveItems.map((item) => (
              <CatalogCard key={item.id} item={item} isAdmin={isAdmin} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function CatalogCard({
  item,
  isAdmin,
  onEdit,
  onDelete,
}: {
  item: Item
  isAdmin: boolean
  onEdit?: () => void
  onDelete?: () => void
}) {
  return (
    <div className="bg-[#141414] border border-white/10 rounded-xl p-4 space-y-2">
      <p className="font-medium text-sm">{item.name}</p>
      <p className="text-green-400 font-semibold">{formatCurrency(item.unitPrice)}</p>
      <p className="text-[11px] text-white/40">
        {item.category}
        {item.sku && ` · ${item.sku}`}
      </p>
      {isAdmin && onEdit && (
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onEdit}
            className="text-xs px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10"
          >
            Editar
          </button>
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="text-xs px-2 py-1 rounded-lg text-red-300 hover:bg-red-500/10"
            >
              Desactivar
            </button>
          )}
        </div>
      )}
    </div>
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
