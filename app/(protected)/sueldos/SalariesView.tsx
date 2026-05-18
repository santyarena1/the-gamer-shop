"use client"

import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, useActionState } from "react"
import type { FormEvent } from "react"
import {
  createSalary,
  confirmSalaryLiquidation,
  deleteSalary,
  addSalaryPayment,
  deleteSalaryPayment,
} from "@/actions/salaries"
import {
  formatCurrency,
  formatDate,
  MONTHS,
} from "@/lib/utils"
import {
  CURRENCY_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_TYPE_LABELS,
  sumPaymentsArs,
} from "@/lib/salary-constants"
import { useAppDate } from "@/hooks/useAppDate"
import type { PayrollStatus } from "@/lib/payroll"

type Payment = {
  id: string
  amount: unknown
  currency: string
  exchangeRate: unknown
  amountArs: unknown
  type: string
  paidAt: Date
  notes: string | null
}

type SalaryDebt = {
  debtId: string
  amount: unknown
  debt: { description: string }
}

type Salary = {
  id: string
  month: number
  year: number
  previousBase: unknown
  ipcPercentage: unknown | null
  ipcIncrease: unknown
  grossAmount: unknown
  debtDeduction: unknown
  amount: unknown
  paid: boolean
  status: string
  notes: string | null
  payments: Payment[]
  debts: SalaryDebt[]
  user: { id: string; name: string }
}

type Employee = { id: string; name: string; ipcAdjusted?: boolean; baseSalary?: unknown | null }

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Borrador",
  CONFIRMED: "Confirmada · sin pagar",
  PARTIAL: "Pago parcial",
  PAID: "Pagada",
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-500/20 text-yellow-400",
  CONFIRMED: "bg-purple-500/20 text-purple-400",
  PARTIAL: "bg-blue-500/20 text-blue-400",
  PAID: "bg-green-500/20 text-green-400",
}

export default function SalariesView({
  salaries,
  employees,
  isAdmin,
  employeeId,
  payroll,
}: {
  salaries: Salary[]
  employees: Employee[]
  isAdmin: boolean
  employeeId?: string
  payroll?: PayrollStatus | null
}) {
  const router = useRouter()
  const [actionPending, setActionPending] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)

  async function handleConfirm(salaryId: string) {
    setActionError(null)
    setActionPending(true)
    try {
      const err = await confirmSalaryLiquidation(salaryId)
      if (err) {
        setActionError(err)
        return
      }
      setDetailId(null)
      router.refresh()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Error inesperado")
    } finally {
      setActionPending(false)
    }
  }

  async function handleDelete(salaryId: string) {
    if (!window.confirm("¿Eliminar esta liquidación?")) return
    setActionError(null)
    setActionPending(true)
    try {
      const err = await deleteSalary(salaryId)
      if (err) {
        setActionError(err)
        return
      }
      setDetailId(null)
      router.refresh()
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Error inesperado")
    } finally {
      setActionPending(false)
    }
  }

  const [createError, createAction, isCreatePending] = useActionState(createSalary, null)
  const createSubmitted = useRef(false)

  useEffect(() => {
    if (createSubmitted.current && !isCreatePending && !createError) {
      setShowCreate(false)
      createSubmitted.current = false
      router.refresh()
    }
  }, [isCreatePending, createError, router])

  const { date: appDate } = useAppDate()
  const currentYear = payroll?.year ?? appDate.getFullYear()
  const currentMonth = payroll?.month ?? appDate.getMonth() + 1
  const detail = salaries.find((s) => s.id === detailId)
  const missingCurrentMonth =
    employeeId &&
    payroll &&
    !salaries.some((s) => s.month === payroll.month && s.year === payroll.year)

  return (
    <div className="space-y-4">
      {actionError && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          {actionError}
        </p>
      )}
      {missingCurrentMonth && isAdmin && (
        <p className="text-sm text-yellow-400/90 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
          Sin liquidación de {MONTHS[payroll.month - 1]} {payroll.year} para este empleado.
          {!payroll.hasIpc
            ? " Cargá el IPC del mes en la barra superior."
            : " Necesita sueldo base, ajuste IPC activado, o una liquidación del mes anterior (ej. Mayo)."}
        </p>
      )}
      <div className="flex items-center justify-between">
        <p className="text-white/60 text-sm">{salaries.length} liquidaciones</p>
        {isAdmin && (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-green-500 hover:bg-green-400 text-black text-sm font-semibold rounded-lg transition-colors"
          >
            + Nueva liquidación
          </button>
        )}
      </div>

      <div className="space-y-3">
        {salaries.length === 0 ? (
          <div className="text-center py-12 text-white/30">
            No hay sueldos registrados. Cargá el IPC del mes o creá una liquidación manual.
          </div>
        ) : (
          salaries.map((s) => {
            const paidTotal = sumPaymentsArs(s.payments)
            const net = Number(s.amount)
            const remaining = Math.max(0, net - paidTotal)
            const progress = net > 0 ? Math.min(100, (paidTotal / net) * 100) : 0

            return (
              <div
                key={s.id}
                className="bg-[#141414] border border-white/10 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    {!employeeId && <p className="font-medium text-sm">{s.user.name}</p>}
                    <p className={`${employeeId ? "font-medium" : "text-xs text-white/40"}`}>
                      {MONTHS[s.month - 1]} {s.year}
                    </p>
                    <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[s.status] ?? STATUS_COLORS.PENDING}`}>
                      {STATUS_LABELS[s.status] ?? s.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-400">{formatCurrency(net)}</p>
                    <p className="text-xs text-white/40">neto a pagar</p>
                    {!s.paid && paidTotal > 0 && (
                      <p className="text-xs text-blue-400 mt-0.5">
                        Pagado: {formatCurrency(paidTotal)} · Falta: {formatCurrency(remaining)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <BreakdownItem label="Base anterior" value={formatCurrency(Number(s.previousBase))} />
                  {s.ipcPercentage != null && Number(s.ipcIncrease) > 0 && (
                    <BreakdownItem
                      label={`IPC (${s.ipcPercentage}%)`}
                      value={`+${formatCurrency(Number(s.ipcIncrease))}`}
                      highlight
                    />
                  )}
                  <BreakdownItem label="Bruto" value={formatCurrency(Number(s.grossAmount))} />
                  {Number(s.debtDeduction) > 0 && (
                    <BreakdownItem
                      label="Deudas"
                      value={`-${formatCurrency(Number(s.debtDeduction))}`}
                      negative
                    />
                  )}
                </div>

                {(s.status === "CONFIRMED" || s.status === "PARTIAL") && !s.paid && (
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}

                {isAdmin && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {s.status === "PENDING" && (
                      <>
                        <button
                          type="button"
                          disabled={actionPending}
                          onClick={() => void handleConfirm(s.id)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 disabled:opacity-50 transition-colors"
                        >
                          Confirmar liquidación
                        </button>
                        <button
                          type="button"
                          disabled={actionPending}
                          onClick={() => void handleDelete(s.id)}
                          className="text-xs px-2 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-50"
                          title="Eliminar borrador"
                        >
                          Eliminar
                        </button>
                      </>
                    )}
                    {(s.status === "CONFIRMED" || s.status === "PARTIAL") && !s.paid && (
                      <button
                        type="button"
                        onClick={() => setDetailId(s.id)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        {s.payments.length > 0 ? `Pagos (${s.payments.length})` : "+ Registrar pago"}
                      </button>
                    )}
                    {s.status === "PAID" && s.payments.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setDetailId(s.id)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        Ver pagos ({s.payments.length})
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {showCreate && (
        <Modal title="Nueva liquidación" onClose={() => setShowCreate(false)}>
          <form
            action={createAction}
            className="space-y-3"
            onSubmit={() => {
              createSubmitted.current = true
            }}
          >
            {employeeId ? (
              <input type="hidden" name="userId" value={employeeId} />
            ) : (
              <Field label="Empleado" name="userId" type="select" required options={employees} />
            )}
            <p className="text-xs text-white/40">
              Si dejás el monto vacío, se calcula automático con IPC y deudas pendientes.
            </p>
            <Field label="Monto manual (opcional)" name="amount" type="number" step="0.01" />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Mes" name="month" type="select-month" defaultValue={String(currentMonth)} />
              <Field label="Año" name="year" type="number" defaultValue={String(currentYear)} />
            </div>
            <Field label="Notas" name="notes" />
            {createError && <p className="text-red-400 text-xs">{createError}</p>}
            <SubmitBtn label="Crear liquidación" />
          </form>
        </Modal>
      )}

      {detail && (
        <SalaryDetailModal salary={detail} onClose={() => setDetailId(null)} />
      )}
    </div>
  )
}

function SalaryDetailModal({ salary, onClose }: { salary: Salary; onClose: () => void }) {
  const router = useRouter()
  const { iso: today } = useAppDate()
  const [payMode, setPayMode] = useState<"full" | "partial">("full")
  const [payError, payAction, payPending] = useActionState(addSalaryPayment, null)
  const paySubmitted = useRef(false)

  useEffect(() => {
    if (paySubmitted.current && !payPending && !payError) {
      paySubmitted.current = false
      router.refresh()
    }
  }, [payPending, payError, router])

  const paidTotal = sumPaymentsArs(salary.payments)
  const net = Number(salary.amount)
  const remaining = Math.round(Math.max(0, net - paidTotal) * 100) / 100

  function handlePaySubmit(e: FormEvent<HTMLFormElement>) {
    if (payMode === "full" && remaining <= 0) {
      e.preventDefault()
      return
    }
  }

  return (
    <Modal
      title={`Pagos — ${MONTHS[salary.month - 1]} ${salary.year}`}
      onClose={onClose}
      wide
    >
      <div className="space-y-4">
        <div className="bg-[#0f0f0f] rounded-lg p-3 text-sm space-y-1">
          <Row label="Neto a pagar" value={formatCurrency(net)} bold />
          <Row label="Total pagado" value={formatCurrency(paidTotal)} />
          <Row label="Restante" value={formatCurrency(Math.max(0, net - paidTotal))} />
        </div>

        {salary.debts.length > 0 && (
          <div>
            <p className="text-xs text-white/50 mb-2">Deudas descontadas</p>
            {salary.debts.map((d) => (
              <p key={d.debtId} className="text-xs text-red-400/80">
                {d.debt.description}: -{formatCurrency(Number(d.amount))}
              </p>
            ))}
          </div>
        )}

        {salary.payments.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-white/50">Historial de pagos</p>
            {salary.payments.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between bg-[#0f0f0f] rounded-lg px-3 py-2 text-xs"
              >
                <div>
                  <p className="font-medium">
                    {formatCurrency(Number(p.amount))} {p.currency}
                    {p.currency !== "ARS" && (
                      <span className="text-white/40"> → {formatCurrency(Number(p.amountArs))}</span>
                    )}
                  </p>
                  <p className="text-white/40">
                    {PAYMENT_TYPE_LABELS[p.type]} · {formatDate(p.paidAt)}
                    {p.notes && ` · ${p.notes}`}
                  </p>
                </div>
                {!salary.paid && (
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await deleteSalaryPayment(p.id)
                        router.refresh()
                      } catch {
                        /* error del servidor */
                      }
                    }}
                    className="text-red-400 hover:text-red-300"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {salary.status === "PENDING" && (
          <p className="text-sm text-yellow-400/90 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2">
            Confirmá la liquidación para fijar los montos. Después podés registrar los pagos.
          </p>
        )}

        {(salary.status === "CONFIRMED" || salary.status === "PARTIAL") && !salary.paid && (
          <form
            action={payAction}
            onSubmit={(e) => {
              handlePaySubmit(e)
              paySubmitted.current = true
            }}
            className="space-y-3 border-t border-white/10 pt-4"
          >
            <input type="hidden" name="salaryId" value={salary.id} />
            <p className="text-sm font-medium">Registrar pago</p>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPayMode("full")}
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                  payMode === "full"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-white/5 text-white/60 hover:bg-white/10"
                }`}
              >
                Pago total
              </button>
              <button
                type="button"
                onClick={() => setPayMode("partial")}
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                  payMode === "partial"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-white/5 text-white/60 hover:bg-white/10"
                }`}
              >
                Pago parcial
              </button>
            </div>

            {payMode === "full" ? (
              <>
                <input type="hidden" name="amount" value={remaining} />
                <input type="hidden" name="currency" value="ARS" />
                <input type="hidden" name="exchangeRate" value="1" />
                <input type="hidden" name="type" value="FINAL" />
                <input type="hidden" name="paidAt" value={today} />
                <div>
                  <label className="text-xs text-white/60 mb-1 block">Monto</label>
                  <p className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm font-semibold text-green-400">
                    {formatCurrency(remaining)}
                  </p>
                  <p className="text-xs text-white/40 mt-1">Saldo restante de la liquidación</p>
                </div>
                <div>
                  <label className="text-xs text-white/60 mb-1 block">Forma de pago *</label>
                  <select
                    name="paymentMethod"
                    required
                    defaultValue=""
                    className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                  >
                    <option value="" disabled>
                      Seleccionar
                    </option>
                    {Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => (
                      <option key={k} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            ) : (
            <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/60 mb-1 block">Monto *</label>
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Moneda</label>
                <select
                  name="currency"
                  className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                >
                  {Object.entries(CURRENCY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/60 mb-1 block">Tipo de cambio (a ARS)</label>
                <input
                  name="exchangeRate"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue="1"
                  className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Tipo</label>
                <select
                  name="type"
                  className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                >
                  {Object.entries(PAYMENT_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/60 mb-1 block">Fecha</label>
                <input
                  name="paidAt"
                  type="date"
                  defaultValue={today}
                  className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Notas</label>
                <input
                  name="notes"
                  placeholder="Ej: adelanto en USD"
                  className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                />
              </div>
            </div>
            </>
            )}

            {payError && <p className="text-red-400 text-xs">{payError}</p>}
            <button
              type="submit"
              disabled={payPending || (payMode === "full" && remaining <= 0)}
              className="w-full py-2 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black text-sm font-semibold rounded-lg"
            >
              {payPending
                ? "Guardando..."
                : payMode === "full"
                  ? "Registrar pago total"
                  : "Agregar pago"}
            </button>
          </form>
        )}
      </div>
    </Modal>
  )
}

function BreakdownItem({
  label,
  value,
  highlight,
  negative,
}: {
  label: string
  value: string
  highlight?: boolean
  negative?: boolean
}) {
  return (
    <div className="bg-white/5 rounded-lg px-2 py-1.5">
      <p className="text-white/40">{label}</p>
      <p className={negative ? "text-red-400" : highlight ? "text-green-400" : "text-white/80"}>
        {value}
      </p>
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-white/50">{label}</span>
      <span className={bold ? "font-semibold text-green-400" : ""}>{value}</span>
    </div>
  )
}

function Modal({
  title,
  children,
  onClose,
  wide,
}: {
  title: string
  children: React.ReactNode
  onClose: () => void
  wide?: boolean
}) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div
        className={`bg-[#1a1a1a] border border-white/10 rounded-xl w-full p-5 max-h-[90vh] overflow-y-auto ${wide ? "max-w-lg" : "max-w-md"}`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="text-white/40 hover:text-white text-xl">
            ×
          </button>
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
  defaultValue = "",
  required = false,
  step,
  options,
}: {
  label: string
  name: string
  type?: string
  defaultValue?: string
  required?: boolean
  step?: string
  options?: Employee[]
}) {
  if (type === "select") {
    return (
      <div>
        <label className="text-xs text-white/60 mb-1 block">{label} *</label>
        <select
          name={name}
          required={required}
          className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
        >
          <option value="">Seleccionar</option>
          {options?.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
      </div>
    )
  }
  if (type === "select-month") {
    return (
      <div>
        <label className="text-xs text-white/60 mb-1 block">{label} *</label>
        <select
          name={name}
          required
          defaultValue={defaultValue}
          className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
        >
          {MONTHS.map((m, i) => (
            <option key={i} value={i + 1}>{m}</option>
          ))}
        </select>
      </div>
    )
  }
  return (
    <div>
      <label className="text-xs text-white/60 mb-1 block">{label}{required && " *"}</label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        step={step}
        className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
      />
    </div>
  )
}

function SubmitBtn({ label }: { label: string }) {
  return (
    <button
      type="submit"
      className="w-full py-2 bg-green-500 hover:bg-green-400 text-black text-sm font-semibold rounded-lg transition-colors mt-2"
    >
      {label}
    </button>
  )
}
