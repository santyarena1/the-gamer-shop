"use client"

import { useState, useActionState } from "react"
import {
  setupCorporateCard,
  createCardStatement,
  markCardStatementPaid,
  deleteCardStatement,
} from "@/actions/corporateCard"
import { formatCurrency, formatDate, MONTHS } from "@/lib/utils"
import { isPastDue } from "@/lib/app-date-shared"
import { useAppDate } from "@/hooks/useAppDate"

export type CardStatement = {
  id: string
  month: number
  year: number
  totalAmount: number
  closingDate: Date | null
  dueDate: Date | null
  paid: boolean
  paidAt: Date | null
  notes: string | null
}

export type CorporateCardData = {
  id: string
  label: string
  lastFour: string | null
  active: boolean
  statements: CardStatement[]
}

export default function CorporateCardSection({
  card,
  userId,
  isAdmin,
  currentMonth,
  currentYear,
}: {
  card: CorporateCardData | null
  userId: string
  isAdmin: boolean
  currentMonth: number
  currentYear: number
}) {
  const { date: today } = useAppDate()
  const [expanded, setExpanded] = useState(true)
  const [showSetup, setShowSetup] = useState(false)
  const [showStatement, setShowStatement] = useState(false)

  const [setupError, setupAction] = useActionState(async (prev: string | null, fd: FormData) => {
    const err = await setupCorporateCard(prev, fd)
    if (!err) setShowSetup(false)
    return err
  }, null)

  const [statementError, statementAction] = useActionState(async (prev: string | null, fd: FormData) => {
    const err = await createCardStatement(prev, fd)
    if (!err) setShowStatement(false)
    return err
  }, null)

  const pendingTotal = (card?.statements ?? [])
    .filter((s) => !s.paid)
    .reduce((acc, s) => acc + s.totalAmount, 0)

  if (!card && !isAdmin) return null

  return (
    <div className="bg-[#141414] border border-white/10 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
      >
        <span className="text-lg">💳</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">
            {card?.label ?? "Tarjeta empresarial"}
            {card?.lastFour && (
              <span className="text-white/40 font-normal"> ·••• {card.lastFour}</span>
            )}
          </p>
          <p className="text-xs text-white/40">
            Resúmenes de tarjeta
            {pendingTotal > 0 && (
              <span className="text-red-400 ml-2">
                Pendiente: {formatCurrency(pendingTotal)}
              </span>
            )}
          </p>
        </div>
        <span className="text-white/30 text-xs">{expanded ? "▴" : "▾"}</span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-white/10 space-y-3">
          {!card && isAdmin && (
            <div className="pt-3">
              <p className="text-xs text-white/40 mb-2">
                Activá la tarjeta empresarial de este empleado para cargar resúmenes mensuales.
              </p>
              <button
                type="button"
                onClick={() => setShowSetup(true)}
                className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                + Configurar tarjeta
              </button>
            </div>
          )}

          {card && (
            <>
              {card.statements.length === 0 ? (
                <p className="text-xs text-white/30 pt-3">Sin resúmenes cargados</p>
              ) : (
                <div className="space-y-2 pt-2">
                  {card.statements.map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg bg-[#0f0f0f] border border-white/5"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {MONTHS[s.month - 1]} {s.year}
                        </p>
                        {s.closingDate && (
                          <p className="text-xs text-white/30">
                            Cierre: {formatDate(s.closingDate)}
                          </p>
                        )}
                        {s.dueDate && (
                          <p
                            className={`text-xs ${
                              !s.paid && isPastDue(s.dueDate, today)
                                ? "text-red-400"
                                : "text-white/30"
                            }`}
                          >
                            Vence: {formatDate(s.dueDate)}
                          </p>
                        )}
                        {s.notes && (
                          <p className="text-xs text-white/25 truncate">{s.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <p
                          className={`font-semibold text-sm ${
                            s.paid ? "text-white/30 line-through" : "text-red-400"
                          }`}
                        >
                          {formatCurrency(s.totalAmount)}
                        </p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            s.paid
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {s.paid ? "Pagado" : "Pendiente"}
                        </span>
                        {isAdmin && !s.paid && (
                          <button
                            type="button"
                            onClick={() => void markCardStatementPaid(s.id)}
                            className="text-xs px-2 py-1 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20"
                          >
                            Pagado
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm("¿Eliminar este resumen?")) {
                                void deleteCardStatement(s.id)
                              }
                            }}
                            className="text-xs px-2 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {isAdmin && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowStatement(true)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                  >
                    + Cargar resumen
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSetup(true)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    Editar tarjeta
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {showSetup && isAdmin && (
        <ModalShell title={card ? "Editar tarjeta" : "Configurar tarjeta empresarial"} onClose={() => setShowSetup(false)}>
          <form action={setupAction} className="space-y-3">
            <input type="hidden" name="userId" value={userId} />
            <Field label="Nombre" name="label" defaultValue={card?.label ?? "Tarjeta empresarial"} />
            <Field label="Últimos 4 dígitos" name="lastFour" defaultValue={card?.lastFour ?? ""} placeholder="1234" maxLength={4} />
            {setupError && <p className="text-red-400 text-xs">{setupError}</p>}
            <Submit label={card ? "Guardar" : "Activar tarjeta"} />
          </form>
        </ModalShell>
      )}

      {showStatement && isAdmin && (
        <ModalShell title="Cargar resumen de tarjeta" onClose={() => setShowStatement(false)}>
          <form action={statementAction} className="space-y-3">
            <input type="hidden" name="userId" value={userId} />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/60 mb-1 block">Mes *</label>
                <select
                  name="month"
                  required
                  defaultValue={String(currentMonth)}
                  className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Año *</label>
                <input
                  name="year"
                  type="number"
                  required
                  defaultValue={String(currentYear)}
                  className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                />
              </div>
            </div>
            <Field label="Total del resumen (ARS) *" name="totalAmount" type="number" step="0.01" min="0" required />
            <Field label="Fecha de cierre" name="closingDate" type="date" />
            <Field label="Vencimiento de pago" name="dueDate" type="date" />
            <Field label="Notas" name="notes" />
            <p className="text-xs text-white/35">
              Se registra como deuda y se descuenta en la próxima liquidación confirmada.
            </p>
            {statementError && <p className="text-red-400 text-xs">{statementError}</p>}
            <Submit label="Cargar resumen" />
          </form>
        </ModalShell>
      )}
    </div>
  )
}

function ModalShell({
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
        <div className="flex items-center justify-between mb-4">
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
  placeholder,
  maxLength,
  step,
  min,
  required,
}: {
  label: string
  name: string
  type?: string
  defaultValue?: string
  placeholder?: string
  maxLength?: number
  step?: string
  min?: string
  required?: boolean
}) {
  return (
    <div>
      <label className="text-xs text-white/60 mb-1 block">{label}</label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        maxLength={maxLength}
        step={step}
        min={min}
        required={required}
        className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
      />
    </div>
  )
}

function Submit({ label }: { label: string }) {
  return (
    <button
      type="submit"
      className="w-full py-2 bg-green-500 hover:bg-green-400 text-black text-sm font-semibold rounded-lg transition-colors mt-2"
    >
      {label}
    </button>
  )
}
