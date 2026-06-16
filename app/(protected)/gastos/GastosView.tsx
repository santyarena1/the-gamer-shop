"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useActionState, useEffect, useMemo, useState, useTransition } from "react"
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
  formatPaymentWindow,
} from "@/lib/recurring-expense-constants"
import { formatCurrency, formatDate, MONTHS } from "@/lib/utils"
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

type CategoryKey = ExpenseCategory | "ALL"

function categoryStats(vendors: Vendor[], category: CategoryKey) {
  const list =
    category === "ALL"
      ? vendors.filter((v) => v.active)
      : vendors.filter((v) => v.active && v.category === category)
  const total = list.length
  const paid = list.filter((v) => v.payments[0]?.paid).length
  const pending = total - paid
  return { total, paid, pending }
}

function paymentStatus(
  payment: Payment | undefined,
  payUntilDay: number | null,
  todayDay: number,
) {
  if (!payment) return { label: "Sin fila", tone: "muted" as const }
  if (payment.paid) {
    return {
      label: payment.paidAt ? `Pagado · ${formatDate(payment.paidAt)}` : "Pagado",
      tone: "paid" as const,
    }
  }
  if (payUntilDay != null && todayDay > payUntilDay) {
    return { label: "Fuera de plazo", tone: "overdue" as const }
  }
  return { label: "Pendiente", tone: "pending" as const }
}

const STATUS_STYLES = {
  paid: "bg-green-500/20 text-green-400",
  pending: "bg-red-500/20 text-red-400",
  overdue: "bg-orange-500/20 text-orange-400",
  muted: "bg-white/10 text-white/40",
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
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>("ALL")
  const [showNewVendor, setShowNewVendor] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [editingVendorId, setEditingVendorId] = useState<string | null>(null)
  const [payingId, setPayingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const [vendorError, vendorAction, vendorPending] = useActionState(
    async (prev: string | null, fd: FormData) => {
      const err = editingVendorId
        ? await updateRecurringVendor(prev, fd)
        : await createRecurringVendor(prev, fd)
      if (!err) {
        setShowNewVendor(false)
        setEditingVendorId(null)
        router.refresh()
      }
      return err
    },
    null,
  )

  const [payError, payAction] = useActionState(async (prev: string | null, fd: FormData) => {
    const err = await markRecurringPaymentPaid(prev, fd)
    if (!err) {
      setPayingId(null)
      router.refresh()
    }
    return err
  }, null)

  const editingVendor = vendors.find((v) => v.id === editingVendorId)
  const payingVendor = vendors.find((v) => v.payments[0]?.id === payingId)
  const payingPayment = payingVendor?.payments[0]

  const pendingCount = vendors.filter(
    (v) => v.active && v.payments[0] && !v.payments[0].paid,
  ).length
  const paidTotal = vendors.reduce(
    (acc, v) => acc + (v.payments[0]?.paid ? v.payments[0].amount : 0),
    0,
  )

  const filteredVendors = useMemo(() => {
    const list =
      selectedCategory === "ALL"
        ? vendors
        : vendors.filter((v) => v.category === selectedCategory)
    return [...list].sort((a, b) => {
      const aPaid = a.payments[0]?.paid ? 1 : 0
      const bPaid = b.payments[0]?.paid ? 1 : 0
      if (aPaid !== bPaid) return aPaid - bPaid
      return a.name.localeCompare(b.name, "es")
    })
  }, [vendors, selectedCategory])

  useEffect(() => {
    if (
      selectedCategory !== "ALL" &&
      !vendors.some((v) => v.category === selectedCategory)
    ) {
      setSelectedCategory("ALL")
    }
  }, [vendors, selectedCategory])

  function setPeriod(m: number, y: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("month", String(m))
    params.set("year", String(y))
    router.push(`/gastos?${params.toString()}`)
  }

  const periodLabel = `${MONTHS[month - 1]} ${year}`
  const selectedLabel =
    selectedCategory === "ALL"
      ? "Todos los proveedores"
      : EXPENSE_CATEGORY_LABELS[selectedCategory]

  return (
    <div className="space-y-4">
      {/* Barra período + resumen */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={month}
          onChange={(e) => setPeriod(parseInt(e.target.value), year)}
          className="bg-[#141414] border border-white/10 rounded-lg px-2.5 py-1.5 text-sm"
        >
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={year}
          onChange={(e) => setPeriod(month, parseInt(e.target.value))}
          className="w-20 bg-[#141414] border border-white/10 rounded-lg px-2.5 py-1.5 text-sm tabular-nums"
        />
        <button
          type="button"
          onClick={() =>
            startTransition(() => {
              void syncRecurringPeriod(month, year).then(() => router.refresh())
            })
          }
          className="text-xs px-2.5 py-1.5 rounded-lg border border-white/10 hover:bg-white/5"
        >
          Generar mes
        </button>
        <span className="text-white/20">|</span>
        <span className="text-xs text-green-400 tabular-nums">
          Pagado {formatCurrency(paidTotal)}
        </span>
        <span className="text-xs text-red-400/90 tabular-nums">
          {pendingCount} pend.
        </span>
        <button
          type="button"
          onClick={() => setShowHistory((v) => !v)}
          className="text-xs px-2 py-1 rounded-md text-white/50 hover:bg-white/5 ml-auto"
        >
          {showHistory ? "Ocultar historial" : "Historial"}
        </button>
      </div>

      {showHistory && (
        <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-[#141414] border border-white/10 max-h-32 overflow-y-auto">
          {history.map((h) => (
            <button
              key={`${h.year}-${h.month}`}
              type="button"
              onClick={() => setPeriod(h.month, h.year)}
              className={`text-left px-2.5 py-1.5 rounded-md text-xs border transition-colors ${
                h.month === month && h.year === year
                  ? "border-green-500/40 bg-green-500/10 text-green-300"
                  : "border-white/10 hover:bg-white/5 text-white/60"
              }`}
            >
              {MONTHS[h.month - 1]} {h.year}
              <span className="text-white/35 ml-1">
                {formatCurrency(h.paidTotal)}
                {h.pendingCount > 0 && (
                  <span className="text-red-400"> ·{h.pendingCount}p</span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4 min-h-[min(65vh,680px)]">
        {/* Categorías */}
        <aside className="lg:w-56 shrink-0 flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-medium text-white/40 uppercase tracking-wide">
              Categorías
            </span>
            <button
              type="button"
              onClick={() => {
                setEditingVendorId(null)
                setShowNewVendor((v) => !v)
              }}
              className="text-xs px-2 py-1 rounded-md text-green-400 hover:bg-green-500/10"
            >
              {showNewVendor ? "Cerrar" : "+ Proveedor"}
            </button>
          </div>

          {showNewVendor && (
            <VendorForm
              action={vendorAction}
              pending={vendorPending}
              error={vendorError}
              editing={editingVendor}
              defaultCategory={
                selectedCategory === "ALL" ? undefined : selectedCategory
              }
              onCancel={() => {
                setShowNewVendor(false)
                setEditingVendorId(null)
              }}
              compact
            />
          )}

          <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-y-auto lg:max-h-[calc(65vh-6rem)] pb-1 lg:pb-0">
            <CategoryNavItem
              label="Todas"
              active={selectedCategory === "ALL"}
              stats={categoryStats(vendors, "ALL")}
              onClick={() => setSelectedCategory("ALL")}
            />
            {EXPENSE_CATEGORY_ORDER.map((cat) => (
              <CategoryNavItem
                key={cat}
                label={EXPENSE_CATEGORY_LABELS[cat]}
                shortLabel={shortCategoryLabel(cat)}
                active={selectedCategory === cat}
                stats={categoryStats(vendors, cat)}
                onClick={() => setSelectedCategory(cat)}
              />
            ))}
          </div>
        </aside>

        {/* Proveedores */}
        <section className="flex-1 min-w-0 bg-[#141414] border border-white/10 rounded-xl flex flex-col overflow-hidden">
          <header className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-white/10 shrink-0">
            <div className="min-w-0">
              <h2 className="font-semibold text-base truncate">{selectedLabel}</h2>
              <p className="text-[11px] text-white/40 mt-0.5">{periodLabel}</p>
            </div>
            {(() => {
              const s = categoryStats(vendors, selectedCategory)
              if (s.total === 0) return null
              return (
                <p className="text-[11px] text-white/45 tabular-nums shrink-0">
                  <span className="text-green-400">{s.paid}</span> pagados ·{" "}
                  <span className={s.pending > 0 ? "text-red-400" : "text-white/40"}>
                    {s.pending}
                  </span>{" "}
                  pendientes
                </p>
              )
            })()}
          </header>

          <div className="flex-1 overflow-auto">
            {filteredVendors.length === 0 ? (
              <p className="p-6 text-sm text-white/40 text-center">
                {vendors.length === 0
                  ? "No hay proveedores. Usá + Proveedor en la barra lateral."
                  : "No hay proveedores en esta categoría."}
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[#141414] z-10">
                  <tr className="text-[10px] uppercase tracking-wide text-white/35 border-b border-white/10">
                    <th className="text-left font-medium px-4 py-2">Proveedor</th>
                    <th className="text-left font-medium px-2 py-2 w-28">Monto</th>
                    <th className="text-left font-medium px-2 py-2 w-32">Estado</th>
                    <th className="text-left font-medium px-2 py-2 hidden md:table-cell">
                      Plazo
                    </th>
                    <th className="w-24" />
                  </tr>
                </thead>
                <tbody>
                  {filteredVendors.map((vendor) => {
                    const payment = vendor.payments[0]
                    const status = paymentStatus(
                      payment,
                      vendor.payUntilDay,
                      todayDay,
                    )
                    const isPaid = payment?.paid
                    return (
                      <tr
                        key={vendor.id}
                        className={`border-b border-white/5 last:border-0 ${
                          !vendor.active
                            ? "opacity-50"
                            : isPaid
                              ? "bg-green-500/[0.03]"
                              : "hover:bg-white/[0.02]"
                        }`}
                      >
                        <td className="px-4 py-2.5 align-middle">
                          <p className="font-medium truncate">{vendor.name}</p>
                          {vendor.description && (
                            <p className="text-[10px] text-white/35 truncate max-w-[200px]">
                              {vendor.description}
                            </p>
                          )}
                          {selectedCategory === "ALL" && (
                            <p className="text-[10px] text-white/30 mt-0.5">
                              {EXPENSE_CATEGORY_LABELS[vendor.category]}
                            </p>
                          )}
                        </td>
                        <td className="px-2 py-2.5 align-middle">
                          <span
                            className={`font-semibold tabular-nums ${
                              isPaid ? "text-green-400" : "text-white/80"
                            }`}
                          >
                            {payment && payment.amount > 0
                              ? formatCurrency(payment.amount)
                              : "—"}
                          </span>
                        </td>
                        <td className="px-2 py-2.5 align-middle">
                          <span
                            className={`inline-block text-[10px] px-2 py-0.5 rounded-full ${STATUS_STYLES[status.tone]}`}
                          >
                            {status.label}
                          </span>
                        </td>
                        <td className="px-2 py-2.5 align-middle hidden md:table-cell">
                          <span className="text-[11px] text-white/40">
                            {vendor.payUntilDay != null
                              ? formatPaymentWindow(vendor.payUntilDay)
                              : "—"}
                          </span>
                        </td>
                        <td className="px-2 py-2.5 align-middle">
                          <div className="flex items-center justify-end gap-1">
                            {payment && !payment.paid && (
                              <button
                                type="button"
                                onClick={() => setPayingId(payment.id)}
                                className="text-[10px] px-2 py-1 rounded-md bg-green-500/15 text-green-400 hover:bg-green-500/25"
                              >
                                Pagar
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingVendorId(vendor.id)
                                setShowNewVendor(true)
                              }}
                              className="w-7 h-7 rounded-md text-white/30 hover:bg-white/10 text-[10px]"
                              title="Editar"
                            >
                              ✎
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  confirm(
                                    `¿Eliminar ${vendor.name} y su historial?`,
                                  )
                                ) {
                                  startTransition(() => {
                                    void deleteRecurringVendor(vendor.id).then(
                                      () => router.refresh(),
                                    )
                                  })
                                }
                              }}
                              className="w-7 h-7 rounded-md text-white/25 hover:text-red-300 hover:bg-red-500/10 text-xs"
                              title="Eliminar"
                            >
                              ×
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>

      {payingId && payingPayment && (
        <Modal title={`Pagar — ${payingVendor?.name}`} onClose={() => setPayingId(null)}>
          <form action={payAction} className="space-y-3">
            <input type="hidden" name="paymentId" value={payingId} />
            <Field label="Monto pagado *" name="amount" type="number" step="0.01" min="0" required />
            <Field label="Fecha de pago" name="paidAt" type="date" />
            <Field label="Notas" name="notes" />
            {payError && <p className="text-red-400 text-xs">{payError}</p>}
            <button
              type="submit"
              className="w-full py-2 bg-green-500 text-black font-semibold rounded-lg text-sm"
            >
              Confirmar pago
            </button>
          </form>
        </Modal>
      )}
    </div>
  )
}

function shortCategoryLabel(cat: ExpenseCategory): string {
  const short: Partial<Record<ExpenseCategory, string>> = {
    UTILITIES: "Servicios",
    INTERNET: "Internet",
    PROFESSIONAL: "Honorarios",
    PAYROLL_TAXES: "Cargas soc.",
    CHECKS: "Cheques",
    RENT: "Alquiler",
    INSURANCE: "Seguros",
    OTHER: "Otros",
  }
  return short[cat] ?? EXPENSE_CATEGORY_LABELS[cat]
}

function CategoryNavItem({
  label,
  shortLabel,
  active,
  stats,
  onClick,
}: {
  label: string
  shortLabel?: string
  active: boolean
  stats: { total: number; paid: number; pending: number }
  onClick: () => void
}) {
  const display = shortLabel ?? label
  const allPaid = stats.total > 0 && stats.pending === 0

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex items-center gap-2 w-full min-w-[130px] lg:min-w-0 text-left px-3 py-2 rounded-lg text-sm transition-colors border ${
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
      <span className="flex-1 truncate text-xs lg:text-sm" title={label}>
        {display}
      </span>
      {stats.total > 0 ? (
        <span
          className={`text-[10px] tabular-nums px-1.5 py-0.5 rounded shrink-0 ${
            allPaid ? "bg-green-500/25 text-green-300" : "bg-white/10 text-white/45"
          }`}
        >
          {stats.paid}/{stats.total}
        </span>
      ) : (
        <span className="text-[10px] text-white/25 shrink-0">—</span>
      )}
    </button>
  )
}

function VendorForm({
  action,
  pending,
  error,
  editing,
  defaultCategory,
  onCancel,
  compact,
}: {
  action: React.ComponentProps<"form">["action"]
  pending: boolean
  error: string | null
  editing?: Vendor
  defaultCategory?: ExpenseCategory
  onCancel: () => void
  compact?: boolean
}) {
  return (
    <form
      action={action}
      className={`bg-[#141414] border border-white/10 rounded-lg space-y-2 ${
        compact ? "p-2" : "p-4 rounded-xl"
      }`}
    >
      {editing && <input type="hidden" name="id" value={editing.id} />}
      <input
        name="name"
        required
        placeholder="Nombre"
        defaultValue={editing?.name}
        className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-2.5 py-1.5 text-sm"
      />
      <select
        name="category"
        defaultValue={editing?.category ?? defaultCategory ?? "OTHER"}
        className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs"
      >
        {EXPENSE_CATEGORY_ORDER.map((c) => (
          <option key={c} value={c}>
            {EXPENSE_CATEGORY_LABELS[c]}
          </option>
        ))}
      </select>
      <input
        name="payUntilDay"
        type="number"
        min={1}
        max={28}
        placeholder="Pagar hasta día"
        defaultValue={editing?.payUntilDay ? String(editing.payUntilDay) : "10"}
        className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-2.5 py-1.5 text-sm"
      />
      {editing && (
        <label className="flex items-center gap-2 text-xs text-white/60">
          <input type="hidden" name="active" value="false" />
          <input
            type="checkbox"
            name="active"
            value="true"
            defaultChecked={editing.active}
            className="rounded"
          />
          Activo
        </label>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-1">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 py-1.5 text-xs rounded-lg bg-green-500 text-black font-semibold disabled:opacity-50"
        >
          {pending ? "…" : editing ? "Guardar" : "Crear"}
        </button>
        {compact && (
          <button
            type="button"
            onClick={onCancel}
            className="px-2 py-1.5 text-xs rounded-lg border border-white/10"
          >
            ×
          </button>
        )}
      </div>
    </form>
  )
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl w-full max-w-md p-5">
        <div className="flex justify-between mb-4">
          <h2 className="font-semibold text-sm">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-white/40 hover:text-white w-8 h-8 rounded-lg hover:bg-white/5"
          >
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
        className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500/50"
      />
    </div>
  )
}
