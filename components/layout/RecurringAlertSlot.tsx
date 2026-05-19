import RecurringExpensesAlert from "@/components/RecurringExpensesAlert"
import { getCachedRecurringAlert } from "@/lib/server-cache"

export default async function RecurringAlertSlot({ role }: { role: string }) {
  if (role !== "ADMIN") return null

  const alert = await getCachedRecurringAlert()
  if (!alert.showReminder) return null

  return (
    <div className="shrink-0 px-4 py-3 border-b border-white/10 bg-[#0a0a0a]">
      <RecurringExpensesAlert alert={alert} />
    </div>
  )
}
