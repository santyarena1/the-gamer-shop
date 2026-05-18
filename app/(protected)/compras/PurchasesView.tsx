"use client"

import { useState, useActionState } from "react"
import { createPurchase, deletePurchase } from "@/actions/purchases"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useAppDate } from "@/hooks/useAppDate"

type Purchase = {
  id: string
  item: string
  description: string | null
  amount: any
  category: string
  date: Date
  user: { id: string; name: string }
}

type Employee = { id: string; name: string }

const CATEGORIES = ["Componente", "Periférico", "Herramienta", "Software", "Otro"]

export default function PurchasesView({ purchases, employees, isAdmin, employeeId }: {
  purchases: Purchase[]
  employees: Employee[]
  isAdmin: boolean
  employeeId?: string
}) {
  const { iso: appDateIso } = useAppDate()
  const [showCreate, setShowCreate] = useState(false)

  const [createError, createAction] = useActionState(async (prev: string | null, fd: FormData) => {
    const err = await createPurchase(prev, fd)
    if (!err) setShowCreate(false)
    return err
  }, null)

  const total = purchases.reduce((acc, p) => acc + Number(p.amount), 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <p className="text-white/60 text-sm">{purchases.length} compras</p>
          {purchases.length > 0 && (
            <span className="text-xs text-green-400">Total: {formatCurrency(total)}</span>
          )}
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-green-500 hover:bg-green-400 text-black text-sm font-semibold rounded-lg transition-colors"
          >
            + Registrar compra
          </button>
        )}
      </div>

      <div className="space-y-3">
        {purchases.length === 0 ? (
          <div className="text-center py-12 text-white/30">No hay compras registradas</div>
        ) : (
          purchases.map((p) => (
            <div key={p.id} className="bg-[#141414] border border-white/10 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{p.item}</p>
                <p className="text-xs text-white/40">{employeeId ? `${p.category} · ${formatDate(p.date)}` : `${p.user.name} · ${p.category} · ${formatDate(p.date)}`}</p>
                {p.description && <p className="text-xs text-white/30 mt-0.5">{p.description}</p>}
              </div>
              <div className="flex items-center gap-3">
                <p className="font-semibold text-green-400">{formatCurrency(Number(p.amount))}</p>
                {isAdmin && (
                  <button
                    onClick={() => deletePurchase(p.id)}
                    className="text-xs px-2 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Registrar compra</h2>
              <button onClick={() => setShowCreate(false)} className="text-white/40 hover:text-white text-xl">×</button>
            </div>
            <form action={createAction} className="space-y-3">
              {employeeId ? (
                <input type="hidden" name="userId" value={employeeId} />
              ) : (
                <div>
                  <label className="text-xs text-white/60 mb-1 block">Empleado *</label>
                  <select name="userId" required className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500">
                    <option value="">Seleccionar</option>
                    {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="text-xs text-white/60 mb-1 block">Item *</label>
                <input name="item" required placeholder="Ej: RTX 4070, Teclado mecánico..." className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Descripción</label>
                <input name="description" className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/60 mb-1 block">Monto *</label>
                  <input name="amount" type="number" step="0.01" min="0" required className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500" />
                </div>
                <div>
                  <label className="text-xs text-white/60 mb-1 block">Categoría</label>
                  <select name="category" className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Fecha</label>
                <input name="date" type="date" defaultValue={appDateIso} key={appDateIso} className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500" />
              </div>
              {createError && <p className="text-red-400 text-xs">{createError}</p>}
              <button type="submit" className="w-full py-2 bg-green-500 hover:bg-green-400 text-black text-sm font-semibold rounded-lg transition-colors mt-2">
                Registrar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
