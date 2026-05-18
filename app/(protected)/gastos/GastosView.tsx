"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useActionState, useState } from "react"
import {
  createRecurringVendor,
  updateRecurringVendor,
  markRecurringPaymentPaid,
  deleteRecurringVendor,
  syncRecurringPeriod,
} from "@/actions/recurring-expenses"
import {
  EXPENSE_CATEGORY_LABELS,
  EXPENSE_CATEGORY_ORDER,
} from "@/lib/recurring-expense-constants"
import { formatCurrency, formatDate, MONTHS } from "@/lib/utils"
import { formatPaymentWindow } from "@/lib/recurring-expense-constants"
import { useAppDate } from "@/hooks/useAppDate"
import type { ExpenseCategory } from "@/app/generated/prisma/client"

type Payment = {
  id: string
  month: number
  year: number
  amount: number
  paid: boolean
  paidAt: Date | null
  notes: string | null
}

type Vendor = {
  id: string
  name: string
  category: ExpenseCategory
  description: string | null
  payUntilDay: number | null
  active: boolean
  payments: Payment[]
}

export default function GastosView({
  vendors,
  month,
  year,
  history,
}: {
  vendors: Vendor[]
  month: number
  year: number
  history: { month: number; year: number; paidTotal: number; pendingCount: number }[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { date: today } = useAppDate()
  const todayDay = today.getDate()
  const [showVendor, setShowVendor] = useState(false)
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null)
  const [payingId, setPayingId] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  const [vendorError, vendorAction] = useActionState(async (prev: string | null, fd: FormData) => {
    const err = editingVendorId
      ? await updateRecurringVendor(prev, fd)
      : await createRecurringVendor(prev, fd)
    if (!err) {
      setShowVendor(false)
      setEditingVendorId(null)
    }
    return err
  }, null)

  const [payError, payAction] = useActionState(async (prev: string | null, fd: FormData) => {
    const err = await markRecurringPaymentPaid(prev, fd)
    if (!err) setPayingId(null)
    return err
  }, null)

  const editingVendor = vendors.find((v) => v.id === editingVendorId)
  const payingVendor = vendors.find((v) => v.payments[0]?.id === payingId)
  const payingPayment = payingVendor?.payments[0]

  const pendingCount = vendors.filter((v) => v.active && v.payments[0] && !v.payments[0].paid).length
  const paidTotal = vendors.reduce(
    (acc, v) => acc + (v.payments[0]?.paid ? v.payments[0].amount : 0),
    0,
  )
  const pendingTotal = vendors.reduce(
    (acc, v) => acc + (v.payments[0] && !v.payments[0].paid ? v.payments[0].amount : 0),
    0,
  )

  function setPeriod(m: number, y: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("month", String(m))
    params.set("year", String(y))
    router.push(`/gastos?${params.toString()}`)
  }

  const grouped = EXPENSE_CATEGORY_ORDER.map((cat) => ({
    category: cat,
    vendors: vendors.filter((v) => v.category === cat),
  })).filter((g) => g.vendors.length > 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <select
            value={month}
            onChange={(e) => setPeriod(parseInt(e.target.value), year)}
            className="bg-[#141414] border border-white/10 rounded-lg px-3 py-2 text-sm"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
          <input
            type="number"
            value={year}
            onChange={(e) => setPeriod(month, parseInt(e.target.value))}
            className="w-24 bg-[#141414] border border-white/10 rounded-lg px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => void syncRecurringPeriod(month, year).then(() => router.refresh())}
            className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10"
          >
            Generar filas del mes
          </button>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10"
          >
            {showHistory ? "Ocultar historial" : "Ver historial"}
          </button>
          <button
            type="button"
            onClick={() => {
              setEditingVendorId(null)
              setShowVendor(true)
            }}
            className="px-4 py-2 bg-green-500 hover:bg-green-400 text-black text-sm font-semibold rounded-lg"
          >
            + Proveedor / entidad
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Stat label="Pagados este mes" value={formatCurrency(paidTotal)} tone="green" />
        <Stat label="Pendientes" value={String(pendingCount)} tone="red" />
        <Stat
          label="Monto pendiente registrado"
          value={formatCurrency(pendingTotal)}
          tone="amber"
        />
      </div>

      {showHistory && (
        <div className="bg-[#141414] border border-white/10 rounded-xl p-4">
          <p className="text-sm font-medium mb-3">Historial por período</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {history.map((h) => (
              <button
                key={`${h.year}-${h.month}`}
                type="button"
                onClick={() => setPeriod(h.month, h.year)}
                className={`text-left px-3 py-2 rounded-lg border transition-colors ${
                  h.month === month && h.year === year
                    ? "border-green-500/40 bg-green-500/10"
                    : "border-white/10 hover:bg-white/5"
                }`}
              >
                <p className="text-sm">{MONTHS[h.month - 1]} {h.year}</p>
                <p className="text-xs text-white/40">
                  Pagado: {formatCurrency(h.paidTotal)}
                  {h.pendingCount > 0 && (
                    <span className="text-red-400 ml-2">· {h.pendingCount} pend.</span>
                  )}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {grouped.length === 0 ? (
        <p className="text-center py-12 text-white/30">
          No hay proveedores cargados. Agregá agua, luz, contador, cargas sociales, etc.
        </p>
      ) : (
        grouped.map(({ category, vendors: list }) => (
          <section key={category} className="space-y-2">
            <h2 className="text-sm font-medium text-white/70">
              {EXPENSE_CATEGORY_LABELS[category]}
            </h2>
            <div className="space-y-2">
              {list.map((vendor) => {
                const payment = vendor.payments[0]
                return (
                  <div
                    key={vendor.id}
                    className={`bg-[#141414] border rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 ${
                      vendor.active ? "border-white/10" : "border-white/5 opacity-60"
                    }`}
                  >
                    <div>
                      <p className="font-medium text-sm">{vendor.name}</p>
                      {vendor.description && (
                        <p className="text-xs text-white/40">{vendor.description}</p>
                      )}
                      {vendor.payUntilDay != null && (
                        <p className="text-xs text-white/30">
                          Plazo de pago: {formatPaymentWindow(vendor.payUntilDay)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {payment ? (
                        <>
                          <p
                            className={`font-semibold ${
                              payment.paid ? "text-green-400" : "text-red-400"
                            }`}
                          >
                            {payment.amount > 0
                              ? formatCurrency(payment.amount)
                              : "—"}
                          </p>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              payment.paid
                                ? "bg-green-500/20 text-green-400"
                                : !payment.paid &&
                                    vendor.payUntilDay != null &&
                                    todayDay > vendor.payUntilDay
                                  ? "bg-orange-500/20 text-orange-400"
                                  : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {payment.paid
                              ? `Pagado${payment.paidAt ? ` · ${formatDate(payment.paidAt)}` : ""}`
                              : vendor.payUntilDay != null && todayDay > vendor.payUntilDay
                                ? "Fuera de plazo"
                                : "Pendiente"}
                          </span>
                          {!payment.paid && (
                            <button
                              type="button"
                              onClick={() => setPayingId(payment.id)}
                              className="text-xs px-3 py-1 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20"
                            >
                              Registrar pago
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-white/30">Sin fila este mes</span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingVendorId(vendor.id)
                          setShowVendor(true)
                        }}
                        className="text-xs px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`¿Eliminar ${vendor.name} y su historial?`)) {
                            void deleteRecurringVendor(vendor.id).then(() => router.refresh())
                          }
                        }}
                        className="text-xs px-2 py-1 rounded-lg bg-red-500/10 text-red-400"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        ))
      )}

      {showVendor && (
        <Modal title={editingVendor ? "Editar proveedor" : "Nuevo proveedor"} onClose={() => { setShowVendor(false); setEditingVendorId(null) }}>
          <form action={vendorAction} className="space-y-3">
            {editingVendor && <input type="hidden" name="id" value={editingVendor.id} />}
            <Field label="Nombre *" name="name" defaultValue={editingVendor?.name} required />
            <div>
              <label className="text-xs text-white/60 mb-1 block">Categoría</label>
              <select
                name="category"
                defaultValue={editingVendor?.category ?? "OTHER"}
                className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm"
              >
                {EXPENSE_CATEGORY_ORDER.map((c) => (
                  <option key={c} value={c}>{EXPENSE_CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>
            <Field label="Descripción" name="description" defaultValue={editingVendor?.description ?? ""} />
            <Field
              label="Pagar hasta el día del mes (1-28)"
              name="payUntilDay"
              type="number"
              min="1"
              max="28"
              defaultValue={editingVendor?.payUntilDay ? String(editingVendor.payUntilDay) : "10"}
            />
            <p className="text-xs text-white/35 -mt-1">
              Plazo habitual: del día 1 al día que indiques (ej. 10 = pagar entre el 1 y el 10).
            </p>
            {editingVendor && (
              <label className="flex items-center gap-2 text-sm">
                <input type="hidden" name="active" value="false" />
                <input
                  type="checkbox"
                  name="active"
                  value="true"
                  defaultChecked={editingVendor.active}
                  className="rounded"
                />
                Activo
              </label>
            )}
            {vendorError && <p className="text-red-400 text-xs">{vendorError}</p>}
            <button type="submit" className="w-full py-2 bg-green-500 text-black font-semibold rounded-lg text-sm">
              Guardar
            </button>
          </form>
        </Modal>
      )}

      {payingId && payingPayment && (
        <Modal title={`Pagar — ${payingVendor?.name}`} onClose={() => setPayingId(null)}>
          <form action={payAction} className="space-y-3">
            <input type="hidden" name="paymentId" value={payingId} />
            <Field label="Monto pagado *" name="amount" type="number" step="0.01" min="0" required />
            <Field label="Fecha de pago" name="paidAt" type="date" />
            <Field label="Notas" name="notes" />
            {payError && <p className="text-red-400 text-xs">{payError}</p>}
            <button type="submit" className="w-full py-2 bg-green-500 text-black font-semibold rounded-lg text-sm">
              Confirmar pago
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "green" | "red" | "amber" }) {
  const colors = {
    green: "text-green-400 bg-green-500/10",
    red: "text-red-400 bg-red-500/10",
    amber: "text-amber-400 bg-amber-500/10",
  }
  return (
    <div className={`rounded-xl border border-white/10 p-4 ${colors[tone]}`}>
      <p className="text-xs opacity-70 mb-1">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl w-full max-w-md p-5">
        <div className="flex justify-between mb-4">
          <h2 className="font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="text-white/40 hover:text-white text-xl">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  min,
  max,
  step,
}: {
  label: string
  name: string
  type?: string
  defaultValue?: string
  required?: boolean
  min?: string
  max?: string
  step?: string
}) {
  return (
    <div>
      <label className="text-xs text-white/60 mb-1 block">{label}</label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        min={min}
        max={max}
        step={step}
        className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
      />
    </div>
  )
}
