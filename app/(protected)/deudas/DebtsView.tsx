"use client"

import { useState, useActionState } from "react"
import { createDebt, markDebtPaid, deleteDebt } from "@/actions/debts"
import { formatCurrency, formatDate } from "@/lib/utils"

type Debt = {
  id: string
  description: string
  amount: any
  paid: boolean
  paidAt: Date | null
  dueDate: Date | null
  createdAt: Date
  user: { id: string; name: string }
}

type Employee = { id: string; name: string }

export default function DebtsView({ debts, employees, isAdmin }: {
  debts: Debt[]
  employees: Employee[]
  isAdmin: boolean
}) {
  const [showCreate, setShowCreate] = useState(false)
  const [filter, setFilter] = useState("pending")

  const [createError, createAction] = useActionState(async (prev: string | null, fd: FormData) => {
    const err = await createDebt(prev, fd)
    if (!err) setShowCreate(false)
    return err
  }, null)

  const filtered = filter === "pending" ? debts.filter((d) => !d.paid) : filter === "paid" ? debts.filter((d) => d.paid) : debts
  const totalPending = debts.filter((d) => !d.paid).reduce((acc, d) => acc + Number(d.amount), 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            {[["pending", "Pendientes"], ["paid", "Pagadas"], ["all", "Todas"]].map(([v, l]) => (
              <button key={v} onClick={() => setFilter(v)}
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${filter === v ? "bg-green-500/20 text-green-400" : "bg-white/5 text-white/60 hover:bg-white/10"}`}>
                {l}
              </button>
            ))}
          </div>
          {totalPending > 0 && (
            <span className="text-xs text-red-400">Total pendiente: {formatCurrency(totalPending)}</span>
          )}
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-green-500 hover:bg-green-400 text-black text-sm font-semibold rounded-lg transition-colors"
          >
            + Registrar deuda
          </button>
        )}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-white/30">No hay deudas</div>
        ) : (
          filtered.map((d) => (
            <div key={d.id} className="bg-[#141414] border border-white/10 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{d.description}</p>
                <p className="text-xs text-white/40">{d.user.name}</p>
                {d.dueDate && (
                  <p className={`text-xs mt-0.5 ${!d.paid && new Date(d.dueDate) < new Date() ? "text-red-400" : "text-white/30"}`}>
                    Vence: {formatDate(d.dueDate)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <p className={`font-semibold ${d.paid ? "text-white/30 line-through" : "text-red-400"}`}>
                  {formatCurrency(Number(d.amount))}
                </p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${d.paid ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                  {d.paid ? "Pagada" : "Pendiente"}
                </span>
                {isAdmin && !d.paid && (
                  <button
                    onClick={() => markDebtPaid(d.id)}
                    className="text-xs px-3 py-1 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                  >
                    Marcar pagada
                  </button>
                )}
                {isAdmin && (
                  <button
                    onClick={() => deleteDebt(d.id)}
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
              <h2 className="font-semibold">Registrar deuda</h2>
              <button onClick={() => setShowCreate(false)} className="text-white/40 hover:text-white text-xl">×</button>
            </div>
            <form action={createAction} className="space-y-3">
              <div>
                <label className="text-xs text-white/60 mb-1 block">Empleado *</label>
                <select name="userId" required className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500">
                  <option value="">Seleccionar</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Descripción *</label>
                <input name="description" required className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Monto *</label>
                <input name="amount" type="number" step="0.01" min="0" required className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Fecha límite</label>
                <input name="dueDate" type="date" className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500" />
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
