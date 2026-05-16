"use client"

import { useState, useActionState } from "react"
import { createSalary, markSalaryPaid, deleteSalary } from "@/actions/salaries"
import { formatCurrency, MONTHS } from "@/lib/utils"

type Salary = {
  id: string
  amount: any
  month: number
  year: number
  paid: boolean
  paidAt: Date | null
  notes: string | null
  user: { id: string; name: string }
}

type Employee = { id: string; name: string }

export default function SalariesView({ salaries, employees, isAdmin }: {
  salaries: Salary[]
  employees: Employee[]
  isAdmin: boolean
}) {
  const [showCreate, setShowCreate] = useState(false)

  const [createError, createAction] = useActionState(async (prev: string | null, fd: FormData) => {
    const err = await createSalary(prev, fd)
    if (!err) setShowCreate(false)
    return err
  }, null)

  const currentYear = new Date().getFullYear()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-white/60 text-sm">{salaries.length} registros</p>
        {isAdmin && (
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-green-500 hover:bg-green-400 text-black text-sm font-semibold rounded-lg transition-colors"
          >
            + Registrar sueldo
          </button>
        )}
      </div>

      <div className="space-y-3">
        {salaries.length === 0 ? (
          <div className="text-center py-12 text-white/30">No hay sueldos registrados</div>
        ) : (
          salaries.map((s) => (
            <div key={s.id} className="bg-[#141414] border border-white/10 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{s.user.name}</p>
                <p className="text-xs text-white/40">{MONTHS[s.month - 1]} {s.year}</p>
                {s.notes && <p className="text-xs text-white/30 mt-0.5">{s.notes}</p>}
              </div>
              <div className="flex items-center gap-3">
                <p className="font-semibold text-green-400">{formatCurrency(Number(s.amount))}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${s.paid ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                  {s.paid ? "Pagado" : "Pendiente"}
                </span>
                {isAdmin && !s.paid && (
                  <button
                    onClick={() => markSalaryPaid(s.id)}
                    className="text-xs px-3 py-1 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                  >
                    Marcar pagado
                  </button>
                )}
                {isAdmin && (
                  <button
                    onClick={() => deleteSalary(s.id)}
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
              <h2 className="font-semibold">Registrar sueldo</h2>
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
                <label className="text-xs text-white/60 mb-1 block">Monto *</label>
                <input name="amount" type="number" step="0.01" min="0" required className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/60 mb-1 block">Mes *</label>
                  <select name="month" required className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500">
                    {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/60 mb-1 block">Año *</label>
                  <input name="year" type="number" defaultValue={currentYear} required className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500" />
                </div>
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Notas</label>
                <input name="notes" className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500" />
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
