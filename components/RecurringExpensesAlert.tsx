import Link from "next/link"
import { formatCurrency, MONTHS } from "@/lib/utils"
import { EXPENSE_CATEGORY_LABELS } from "@/lib/recurring-expense-constants"
import {
  formatPaymentWindow,
  type RecurringExpenseAlert,
} from "@/lib/recurring-expense-constants"
import type { ExpenseCategory } from "@/app/generated/prisma/client"

export default function RecurringExpensesAlert({ alert }: { alert: RecurringExpenseAlert }) {
  if (!alert.showReminder || alert.unpaidCount === 0) return null

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-amber-300">
            Pagos recurrentes pendientes — {MONTHS[alert.month - 1]} {alert.year}
          </p>
          <p className="text-xs text-amber-200/70 mt-0.5">
            Estás en el plazo de cierre (del 1 al {alert.windowEnd}). Revisá lo que falta pagar del mes anterior.
          </p>
        </div>
        <Link
          href="/gastos"
          className="text-xs px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors shrink-0"
        >
          Ir a gastos
        </Link>
      </div>
      <ul className="space-y-1 max-h-40 overflow-y-auto">
        {alert.unpaid.map((item) => (
          <li key={item.paymentId} className="flex justify-between gap-2 text-xs text-amber-100/90">
            <span>
              {item.vendorName}
              <span className="text-amber-200/50 ml-1">
                ({EXPENSE_CATEGORY_LABELS[item.category as ExpenseCategory]}
                {item.payUntilDay != null && ` · ${formatPaymentWindow(item.payUntilDay)}`}
                {item.overdue && " · fuera de plazo"})
              </span>
            </span>
            <span className="shrink-0 font-medium">
              {item.amount > 0 ? formatCurrency(item.amount) : "Sin monto"}
            </span>
          </li>
        ))}
      </ul>
      {alert.unpaidTotal > 0 && (
        <p className="text-xs text-amber-300/80 pt-1 border-t border-amber-500/20">
          Total registrado pendiente: {formatCurrency(alert.unpaidTotal)}
        </p>
      )}
    </div>
  )
}
