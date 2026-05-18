import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import { getAppDate } from "@/lib/app-date"
import { ensureRecurringPaymentsForPeriod } from "@/lib/recurring-expenses"
import { toNumber } from "@/lib/serialize"
import { Suspense } from "react"
import Header from "@/components/Header"
import GastosView from "./GastosView"

type Props = { searchParams: Promise<{ month?: string; year?: string }> }

export default async function GastosPage({ searchParams }: Props) {
  await requireAdmin()
  const params = await searchParams
  const appDate = await getAppDate()
  const month = params.month ? parseInt(params.month) : appDate.getMonth() + 1
  const year = params.year ? parseInt(params.year) : appDate.getFullYear()

  await ensureRecurringPaymentsForPeriod(month, year)

  const vendorsRaw = await db.recurringVendor.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
    include: {
      payments: {
        where: { month, year },
        take: 1,
      },
    },
  })

  const vendors = vendorsRaw.map((v) => ({
    id: v.id,
    name: v.name,
    category: v.category,
    description: v.description,
    payUntilDay: v.payUntilDay,
    active: v.active,
    payments: v.payments.map((p) => ({
      id: p.id,
      month: p.month,
      year: p.year,
      amount: toNumber(p.amount),
      paid: p.paid,
      paidAt: p.paidAt,
      notes: p.notes,
    })),
  }))

  const allPayments = await db.recurringPayment.groupBy({
    by: ["month", "year"],
    _sum: { amount: true },
    _count: { id: true },
    where: { paid: true },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    take: 24,
  })

  const pendingByPeriod = await db.recurringPayment.groupBy({
    by: ["month", "year"],
    where: { paid: false },
    _count: { id: true },
  })

  const pendingMap = new Map(
    pendingByPeriod.map((p) => [`${p.year}-${p.month}`, p._count.id]),
  )

  const history = allPayments.map((p) => ({
    month: p.month,
    year: p.year,
    paidTotal: Number(p._sum.amount ?? 0),
    pendingCount: pendingMap.get(`${p.year}-${p.month}`) ?? 0,
  }))

  const periodsWithPending = pendingByPeriod
    .filter((p) => !history.some((h) => h.month === p.month && h.year === p.year))
    .map((p) => ({
      month: p.month,
      year: p.year,
      paidTotal: 0,
      pendingCount: p._count.id,
    }))

  const fullHistory = [...history, ...periodsWithPending].sort(
    (a, b) => b.year - a.year || b.month - a.month,
  )

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header title="Gastos recurrentes" />
      <main className="flex-1 p-6">
        <p className="text-sm text-white/50 mb-6 max-w-2xl">
          Proveedores y pagos fijos de la empresa (servicios, cargas sociales, cheques, etc.).
          Cada proveedor tiene un plazo del 1 al día que definas. Durante ese período te avisamos lo pendiente del mes anterior.
        </p>
        <Suspense fallback={<p className="text-white/40 text-sm">Cargando…</p>}>
          <GastosView vendors={vendors} month={month} year={year} history={fullHistory} />
        </Suspense>
      </main>
    </div>
  )
}
