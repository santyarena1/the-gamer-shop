"use server"

import { mkdir, writeFile } from "fs/promises"
import { join } from "path"
import { revalidatePath } from "next/cache"
import { unstable_rethrow } from "next/navigation"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"

const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "quotes")
const MAX_FILE_BYTES = 12 * 1024 * 1024

async function requireUser() {
  const session = await getSession()
  if (!session) throw new Error("No autorizado")
  return session
}

async function requireAdmin() {
  const session = await requireUser()
  if (session.role !== "ADMIN") throw new Error("No autorizado")
  return session
}

function revalidateQuotes(threadId?: string) {
  revalidatePath("/presupuestos")
  if (threadId) revalidatePath(`/presupuestos/${threadId}`)
}

function getFilesFromFormData(formData: FormData): File[] {
  const fromMulti = formData
    .getAll("files")
    .filter((f): f is File => f instanceof File && f.size > 0)
  if (fromMulti.length > 0) return fromMulti

  const single = formData.get("file")
  if (single instanceof File && single.size > 0) return [single]
  return []
}

async function saveQuoteFile(file: File) {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("El archivo no puede superar 12 MB")
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin"
  const allowed = ["pdf", "png", "jpg", "jpeg", "webp", "doc", "docx"]
  if (!allowed.includes(ext)) {
    throw new Error("Formato no permitido. Usá PDF o imagen.")
  }

  await mkdir(UPLOAD_DIR, { recursive: true })
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(join(UPLOAD_DIR, safeName), buffer)

  return {
    fileName: file.name,
    filePath: `/uploads/quotes/${safeName}`,
    mimeType: file.type || "application/octet-stream",
  }
}

export type CreateQuoteThreadResult =
  | { ok: true; threadId: string }
  | { ok: false; error: string }

export async function createQuoteThread(
  _prev: CreateQuoteThreadResult | null,
  formData: FormData,
): Promise<CreateQuoteThreadResult> {
  try {
    const session = await requireUser()

    const clientName = (formData.get("clientName") as string)?.trim()
    const clientPhone = (formData.get("clientPhone") as string)?.trim()
    const subject = (formData.get("subject") as string)?.trim()
    const body = (formData.get("body") as string)?.trim()

    const thread = await db.quoteThread.create({
      data: {
        authorId: session.userId,
        clientName: clientName || null,
        clientPhone: clientPhone || null,
        subject: subject || null,
      },
    })

    if (body) {
      await db.quoteMessage.create({
        data: {
          threadId: thread.id,
          authorId: session.userId,
          body,
        },
      })
    }

    const files = getFilesFromFormData(formData)
    for (const file of files) {
      const saved = await saveQuoteFile(file)
      await db.quoteMessage.create({
        data: {
          threadId: thread.id,
          authorId: session.userId,
          fileName: saved.fileName,
          filePath: saved.filePath,
          mimeType: saved.mimeType,
        },
      })
    }

    revalidateQuotes(thread.id)
    return { ok: true, threadId: thread.id }
  } catch (e) {
    unstable_rethrow(e)
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Error al crear el pedido",
    }
  }
}

export async function addQuoteMessage(prev: string | null, formData: FormData) {
  try {
    const session = await requireUser()
    const threadId = formData.get("threadId") as string
    const body = (formData.get("body") as string)?.trim()

    if (!threadId) return "Pedido no encontrado"

    const thread = await db.quoteThread.findUnique({ where: { id: threadId } })
    if (!thread) return "Pedido no encontrado"

    const files = getFilesFromFormData(formData)
    if (!body && files.length === 0) {
      return "Escribí un mensaje, pegá una imagen o adjuntá un archivo"
    }

    if (body) {
      await db.quoteMessage.create({
        data: { threadId, authorId: session.userId, body },
      })
    }

    for (const file of files) {
      const saved = await saveQuoteFile(file)
      await db.quoteMessage.create({
        data: {
          threadId,
          authorId: session.userId,
          fileName: saved.fileName,
          filePath: saved.filePath,
          mimeType: saved.mimeType,
        },
      })
    }

    await db.quoteThread.update({
      where: { id: threadId },
      data: { updatedAt: new Date() },
    })

    revalidateQuotes(threadId)
    return null
  } catch (e) {
    return e instanceof Error ? e.message : "Error al enviar"
  }
}

export async function applyQuoteQuickButton(threadId: string, buttonId: string) {
  try {
    const session = await requireUser()

    const button = await db.quoteQuickButton.findUnique({ where: { id: buttonId } })
    if (!button || !button.active) return "Botón no disponible"

    await db.quoteMessage.create({
      data: {
        threadId,
        authorId: session.userId,
        isAction: true,
        actionLabel: button.label,
        body: button.label,
      },
    })

    await db.quoteThread.update({
      where: { id: threadId },
      data: { statusLabel: button.label, updatedAt: new Date() },
    })

    revalidateQuotes(threadId)
    return null
  } catch (e) {
    return e instanceof Error ? e.message : "Error"
  }
}

export async function createQuoteQuickButton(prev: string | null, formData: FormData) {
  try {
    await requireAdmin()
    const label = (formData.get("label") as string)?.trim()
    const variant = (formData.get("variant") as string) || "default"
    if (!label) return "El nombre del botón es obligatorio"

    const maxOrder = await db.quoteQuickButton.aggregate({ _max: { sortOrder: true } })
    await db.quoteQuickButton.create({
      data: {
        label,
        variant,
        sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
      },
    })

    revalidateQuotes()
    return null
  } catch (e) {
    return e instanceof Error ? e.message : "Error al crear botón"
  }
}

export async function updateQuoteQuickButton(prev: string | null, formData: FormData) {
  try {
    await requireAdmin()
    const id = formData.get("id") as string
    const label = (formData.get("label") as string)?.trim()
    const variant = (formData.get("variant") as string) || "default"
    const active = formData.get("active") === "true"
    if (!id || !label) return "Datos incompletos"

    await db.quoteQuickButton.update({
      where: { id },
      data: { label, variant, active },
    })

    revalidateQuotes()
    return null
  } catch (e) {
    return e instanceof Error ? e.message : "Error al actualizar"
  }
}

export async function deleteQuoteQuickButton(buttonId: string) {
  try {
    await requireAdmin()
    await db.quoteQuickButton.delete({ where: { id: buttonId } })
    revalidateQuotes()
    return null
  } catch (e) {
    return e instanceof Error ? e.message : "Error al eliminar"
  }
}
