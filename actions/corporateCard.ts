"use server"

import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { MONTHS } from "@/lib/utils"
import { revalidateEmployee } from "@/lib/revalidate"

async function requireAdmin() {
  const session = await getSession()
  if (!session || session.role !== "ADMIN") throw new Error("No autorizado")
}

function statementDescription(month: number, year: number) {
  return `Tarjeta empresarial — ${MONTHS[month - 1]} ${year}`
}

async function ensureCard(userId: string, lastFour?: string | null) {
  const existing = await db.corporateCard.findUnique({ where: { userId } })
  if (existing) {
    if (lastFour?.trim()) {
      return db.corporateCard.update({
        where: { id: existing.id },
        data: { lastFour: lastFour.trim() },
      })
    }
    return existing
  }
  return db.corporateCard.create({
    data: {
      userId,
      lastFour: lastFour?.trim() || null,
    },
  })
}

export async function setupCorporateCard(
  prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  try {
    await requireAdmin()
    const userId = formData.get("userId") as string
    const label = (formData.get("label") as string)?.trim()
    const lastFour = (formData.get("lastFour") as string)?.trim()

    if (!userId) return "Empleado requerido"

    const existing = await db.corporateCard.findUnique({ where: { userId } })
    if (existing) {
      await db.corporateCard.update({
        where: { id: existing.id },
        data: {
          label: label || existing.label,
          lastFour: lastFour || existing.lastFour,
          active: true,
        },
      })
    } else {
      await db.corporateCard.create({
        data: {
          userId,
          label: label || "Tarjeta empresarial",
          lastFour: lastFour || null,
        },
      })
    }

    revalidateEmployee(userId)
    return null
  } catch (e) {
    return e instanceof Error ? e.message : "Error al configurar la tarjeta"
  }
}

export async function createCardStatement(
  prevState: string | null,
  formData: FormData,
): Promise<string | null> {
  try {
    await requireAdmin()

    const userId = formData.get("userId") as string
    const month = parseInt(formData.get("month") as string)
    const year = parseInt(formData.get("year") as string)
    const totalAmount = parseFloat(formData.get("totalAmount") as string)
    const closingDate = formData.get("closingDate") as string
    const dueDate = formData.get("dueDate") as string
    const notes = (formData.get("notes") as string)?.trim()
    const lastFour = (formData.get("lastFour") as string)?.trim()

    if (!userId || isNaN(month) || isNaN(year) || isNaN(totalAmount) || totalAmount <= 0) {
      return "Completá mes, año y monto del resumen"
    }

    const card = await ensureCard(userId, lastFour)

    const duplicate = await db.corporateCardStatement.findUnique({
      where: { cardId_month_year: { cardId: card.id, month, year } },
    })
    if (duplicate) return "Ya existe un resumen para ese período"

    const debt = await db.debt.create({
      data: {
        userId,
        description: statementDescription(month, year),
        amount: totalAmount,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    })

    await db.corporateCardStatement.create({
      data: {
        cardId: card.id,
        month,
        year,
        totalAmount,
        closingDate: closingDate ? new Date(closingDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes || null,
        debtId: debt.id,
      },
    })

    revalidateEmployee(userId)
    return null
  } catch (e) {
    return e instanceof Error ? e.message : "Error al cargar el resumen"
  }
}

export async function markCardStatementPaid(statementId: string) {
  await requireAdmin()

  const statement = await db.corporateCardStatement.findUnique({
    where: { id: statementId },
    include: { card: true, debt: true },
  })
  if (!statement) return

  await db.corporateCardStatement.update({
    where: { id: statementId },
    data: { paid: true, paidAt: new Date() },
  })

  if (statement.debtId) {
    await db.debt.update({
      where: { id: statement.debtId },
      data: { paid: true, paidAt: new Date() },
    })
  }

  revalidateEmployee(statement.card.userId)
}

export async function deleteCardStatement(statementId: string) {
  await requireAdmin()

  const statement = await db.corporateCardStatement.findUnique({
    where: { id: statementId },
    include: { card: true, debt: true },
  })
  if (!statement) return

  if (statement.debtId) {
    const debt = statement.debt
    if (debt && !debt.paid) {
      await db.debt.delete({ where: { id: statement.debtId } })
    }
  }

  await db.corporateCardStatement.delete({ where: { id: statementId } })
  revalidateEmployee(statement.card.userId)
}
