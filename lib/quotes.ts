import "server-only"

import { db } from "@/lib/db"

const DEFAULT_BUTTONS = [
  { label: "Enviado", variant: "green", sortOrder: 0 },
  { label: "Revisar", variant: "amber", sortOrder: 1 },
  { label: "Pendiente cliente", variant: "blue", sortOrder: 2 },
  { label: "Cerrado", variant: "default", sortOrder: 3 },
]

export async function ensureDefaultQuoteButtons() {
  if (!db.quoteQuickButton?.count) return

  const count = await db.quoteQuickButton.count()
  if (count > 0) return

  await db.quoteQuickButton.createMany({ data: DEFAULT_BUTTONS })
}
