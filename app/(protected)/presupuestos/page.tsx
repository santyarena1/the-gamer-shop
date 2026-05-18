import { db } from "@/lib/db"
import { requireSession } from "@/lib/auth"
import { ensureDefaultQuoteButtons } from "@/lib/quotes"
import Header from "@/components/Header"
import PresupuestosList from "./PresupuestosList"

export default async function PresupuestosPage() {
  const session = await requireSession()
  await ensureDefaultQuoteButtons()

  const threads = await db.quoteThread.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        author: { select: { id: true, name: true } },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
          include: { author: { select: { name: true } } },
        },
        _count: { select: { messages: true } },
      },
    })

  const allButtons = await db.quoteQuickButton.findMany({
    orderBy: { sortOrder: "asc" },
  })

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header title="Presupuestos" />
      <main className="flex-1 p-6">
        <PresupuestosList
          threads={threads}
          quickButtons={allButtons}
          isAdmin={session.role === "ADMIN"}
          currentUserId={session.userId}
        />
      </main>
    </div>
  )
}
