"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import type { PcComponentSlot, QuoteDocumentStatus } from "@/app/generated/prisma/client"
import { getSession } from "@/lib/session"
import { applyTemplateSlots, serializeTemplateSlots } from "@/lib/quote-builder"
import type { LineItemInput } from "@/lib/quote-builder-constants"

async function requireUser() {
  const session = await getSession()
  if (!session) throw new Error("No autorizado")
  return session
}

function revalidateDoc(id?: string) {
  revalidatePath("/cotizador")
  if (id) revalidatePath(`/cotizador/${id}`)
}

async function saveBuildLineItems(buildId: string, items: LineItemInput[]) {
  await db.quoteLineItem.deleteMany({ where: { buildId } })
  if (items.length === 0) return
  await db.quoteLineItem.createMany({
    data: items.map((item, i) => ({
      buildId,
      slot: item.slot,
      sourceType: item.sourceType,
      sourceRef: item.sourceRef,
      name: item.name,
      unitPrice: item.unitPrice,
      qty: item.qty,
      sortOrder: i,
    })),
  })
}

export async function createQuoteDocument(data: {
  title: string
  clientName?: string
  clientPhone?: string
  notes?: string
  lineItems: LineItemInput[]
  buildLabel?: string
}) {
  const session = await requireUser()

  const doc = await db.quoteDocument.create({
    data: {
      title: data.title.trim() || "Presupuesto sin título",
      clientName: data.clientName?.trim() || null,
      clientPhone: data.clientPhone?.trim() || null,
      notes: data.notes?.trim() || null,
      authorId: session.userId,
      builds: {
        create: {
          label: data.buildLabel ?? "Configuración principal",
          sortOrder: 0,
        },
      },
    },
    include: { builds: true },
  })

  const build = doc.builds[0]
  if (build) await saveBuildLineItems(build.id, data.lineItems)

  revalidateDoc(doc.id)
  return doc.id
}

export async function updateQuoteDocument(
  documentId: string,
  data: {
    title: string
    clientName?: string
    clientPhone?: string
    notes?: string
    status?: QuoteDocumentStatus
    lineItems: LineItemInput[]
    buildId?: string
  },
) {
  await requireUser()

  await db.quoteDocument.update({
    where: { id: documentId },
    data: {
      title: data.title.trim(),
      clientName: data.clientName?.trim() || null,
      clientPhone: data.clientPhone?.trim() || null,
      notes: data.notes?.trim() || null,
      ...(data.status ? { status: data.status } : {}),
    },
  })

  let buildId = data.buildId
  if (!buildId) {
    const build = await db.quoteBuild.findFirst({
      where: { documentId },
      orderBy: { sortOrder: "asc" },
    })
    buildId = build?.id
  }

  if (buildId) await saveBuildLineItems(buildId, data.lineItems)

  revalidateDoc(documentId)
}

export async function createDocumentWithVariants(data: {
  title: string
  clientName?: string
  clientPhone?: string
  notes?: string
  baseItems: LineItemInput[]
  slot: PcComponentSlot
  variants: LineItemInput[][]
}) {
  const session = await requireUser()

  const doc = await db.quoteDocument.create({
    data: {
      title: data.title.trim(),
      clientName: data.clientName?.trim() || null,
      clientPhone: data.clientPhone?.trim() || null,
      notes: data.notes?.trim() || null,
      status: "CONFIRMED",
      authorId: session.userId,
    },
  })

  const allBuilds: LineItemInput[][] = [
    data.baseItems,
    ...data.variants.map((v) => v),
  ]

  for (let i = 0; i < allBuilds.length; i++) {
    const items = allBuilds[i]
    const label =
      i === 0
        ? "Base"
        : `Variante ${String.fromCharCode(64 + i)}`
    const build = await db.quoteBuild.create({
      data: { documentId: doc.id, label, sortOrder: i },
    })
    await saveBuildLineItems(build.id, items)
  }

  revalidateDoc(doc.id)
  redirect(`/cotizador/${doc.id}`)
}

export async function createBatchDocuments(
  rows: {
    title: string
    clientName?: string
    clientPhone?: string
    notes?: string
    lineItems: LineItemInput[]
  }[],
) {
  const session = await requireUser()
  const ids: string[] = []

  for (const row of rows) {
    const doc = await db.quoteDocument.create({
      data: {
        title: row.title.trim() || "Presupuesto",
        clientName: row.clientName?.trim() || null,
        clientPhone: row.clientPhone?.trim() || null,
        notes: row.notes?.trim() || null,
        status: "DRAFT",
        authorId: session.userId,
        builds: { create: { label: "Configuración", sortOrder: 0 } },
      },
      include: { builds: true },
    })
    const build = doc.builds[0]
    if (build) await saveBuildLineItems(build.id, row.lineItems)
    ids.push(doc.id)
  }

  revalidatePath("/cotizador")
  return ids
}

export async function savePcBuildTemplate(name: string, description: string, items: LineItemInput[]) {
  const session = await requireUser()
  await db.pcBuildTemplate.create({
    data: {
      name: name.trim(),
      description: description.trim() || null,
      slotsJson: serializeTemplateSlots(items),
      authorId: session.userId,
    },
  })
  revalidatePath("/cotizador/masivo")
  revalidatePath("/cotizador/lote")
}

export async function duplicateQuoteDocumentAction(formData: FormData) {
  const id = formData.get("id") as string
  if (id) await duplicateQuoteDocument(id)
}

export async function duplicateQuoteDocument(documentId: string) {
  const session = await requireUser()
  const original = await db.quoteDocument.findUnique({
    where: { id: documentId },
    include: {
      builds: { include: { lineItems: true }, orderBy: { sortOrder: "asc" } },
    },
  })
  if (!original) throw new Error("No encontrado")

  const copy = await db.quoteDocument.create({
    data: {
      title: `${original.title} (copia)`,
      clientName: original.clientName,
      clientPhone: original.clientPhone,
      notes: original.notes,
      status: "DRAFT",
      authorId: session.userId,
    },
  })

  for (const build of original.builds) {
    const newBuild = await db.quoteBuild.create({
      data: {
        documentId: copy.id,
        label: build.label,
        sortOrder: build.sortOrder,
      },
    })
    await db.quoteLineItem.createMany({
      data: build.lineItems.map((li) => ({
        buildId: newBuild.id,
        slot: li.slot,
        sourceType: li.sourceType,
        sourceRef: li.sourceRef,
        name: li.name,
        unitPrice: li.unitPrice,
        qty: li.qty,
        sortOrder: li.sortOrder,
      })),
    })
  }

  revalidateDoc(copy.id)
  redirect(`/cotizador/${copy.id}`)
}

export async function archiveQuoteDocument(documentId: string) {
  await requireUser()
  await db.quoteDocument.update({
    where: { id: documentId },
    data: { status: "ARCHIVED" },
  })
  revalidateDoc(documentId)
}

export async function archiveQuoteDocumentAction(formData: FormData) {
  const id = formData.get("id") as string
  if (id) await archiveQuoteDocument(id)
}

export async function sendToQuoteForum(documentId: string) {
  const session = await requireUser()
  const doc = await db.quoteDocument.findUnique({
    where: { id: documentId },
    include: {
      builds: {
        include: { lineItems: { orderBy: { sortOrder: "asc" } } },
        orderBy: { sortOrder: "asc" },
      },
    },
  })
  if (!doc) throw new Error("No encontrado")

  let threadId = doc.threadId
  if (!threadId) {
    const thread = await db.quoteThread.create({
      data: {
        clientName: doc.clientName,
        clientPhone: doc.clientPhone,
        subject: doc.title,
        statusLabel: "Cotización generada",
        authorId: session.userId,
      },
    })
    threadId = thread.id
    await db.quoteDocument.update({
      where: { id: documentId },
      data: { threadId, status: "SENT" },
    })
  }

  const lines: string[] = []
  for (const build of doc.builds) {
    lines.push(`\n**${build.label}**`)
    let total = 0
    for (const li of build.lineItems) {
      const sub = Number(li.unitPrice) * li.qty
      total += sub
      lines.push(`• ${li.name} — $${Number(li.unitPrice).toLocaleString("es-AR")} x${li.qty}`)
    }
    lines.push(`Total: $${total.toLocaleString("es-AR")}`)
  }

  await db.quoteMessage.create({
    data: {
      threadId,
      authorId: session.userId,
      body: lines.join("\n"),
      isAction: true,
      actionLabel: "Cotización desde Cotizador",
    },
  })

  revalidatePath("/presupuestos")
  revalidatePath(`/presupuestos/${threadId}`)
  revalidateDoc(documentId)
  return threadId
}

