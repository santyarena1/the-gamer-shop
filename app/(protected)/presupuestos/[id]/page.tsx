import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { requireSession } from "@/lib/auth"
import { ensureDefaultQuoteButtons } from "@/lib/quotes"
import Header from "@/components/Header"
import PresupuestosThread from "../PresupuestosThread"

type Props = { params: Promise<{ id: string }> }

export default async function PresupuestoThreadPage({ params }: Props) {
  const session = await requireSession()
  const { id } = await params
  await ensureDefaultQuoteButtons()

  const thread = await db.quoteThread.findUnique({
    where: { id },
    include: {
      author: { select: { name: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true } } },
      },
    },
  })

  if (!thread) notFound()

  const quickButtons = await db.quoteQuickButton.findMany({
    where: { active: true },
    orderBy: { sortOrder: "asc" },
  })

  const title =
    thread.clientName ||
    thread.clientPhone ||
    thread.subject ||
    "Presupuesto"

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <Header title={title} />
      <main className="flex-1 p-6 flex flex-col min-h-0">
        <PresupuestosThread
          thread={thread}
          quickButtons={quickButtons}
          currentUserId={session.userId}
        />
      </main>
    </div>
  )
}
