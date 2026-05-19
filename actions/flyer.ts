"use server"

import { mkdir, writeFile } from "fs/promises"
import { join } from "path"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { renderFlyerPng } from "@/lib/flyer/render-png"
import { fileToDataUri } from "@/lib/flyer/load-image"
import {
  buildFlyerPayloadFromLineItems,
  flyerDisplayTitle,
} from "@/lib/flyer/map-from-quote"
import type { FlyerPayload } from "@/lib/flyer/types"
import type { LineItemInput } from "@/lib/quote-builder-constants"
import {
  buildReferenceImageQuery,
  suggestReferenceImageKind,
  type ReferenceImageKind,
} from "@/lib/flyer/build-reference-query"
import { downloadImageFromUrl } from "@/lib/flyer/download-reference-image"
import { searchSerperImages } from "@/lib/serper-integration"
import type { SerperImageResult } from "@/lib/serper-integration-types"
import { bufferToDataUri } from "@/lib/flyer/load-image"
import {
  processCaseImageBuffer,
  type BackgroundRemovalMethod,
} from "@/lib/flyer/process-case-image"

const FLYER_DIR = join(process.cwd(), "public", "uploads", "flyers")
const CASE_DIR = join(FLYER_DIR, "cases")

async function persistCaseImage(
  flyerId: string,
  rawBuffer: Buffer,
  removeBackground: boolean,
): Promise<{ caseImagePath: string; dataUri: string; method: BackgroundRemovalMethod }> {
  const { buffer, method } = await processCaseImageBuffer(rawBuffer, { removeBackground })
  await mkdir(CASE_DIR, { recursive: true })
  const rel = `/uploads/flyers/cases/${flyerId}.png`
  await writeFile(join(process.cwd(), "public", rel.replace(/^\//, "")), buffer)
  const dataUri = await bufferToDataUri(buffer, "image/png")

  const row = await db.flyerGeneration.findUnique({ where: { id: flyerId } })
  if (!row) throw new Error("Flyer no encontrado")

  const payload = JSON.parse(row.payloadJson) as FlyerPayload
  payload.product.pcImageBase64 = dataUri

  await db.flyerGeneration.update({
    where: { id: flyerId },
    data: {
      caseImagePath: rel,
      payloadJson: JSON.stringify(payload),
    },
  })

  revalidateFlyers()
  return { caseImagePath: rel, dataUri, method }
}

async function requireUser() {
  const session = await getSession()
  if (!session) throw new Error("No autorizado")
  return session
}

function revalidateFlyers() {
  revalidatePath("/generador-imagenes")
}

export async function createFlyerFromQuote(quoteDocumentId: string) {
  const session = await requireUser()

  const doc = await db.quoteDocument.findUnique({
    where: { id: quoteDocumentId },
    include: {
      builds: {
        orderBy: { sortOrder: "asc" },
        take: 1,
        include: { lineItems: { orderBy: { sortOrder: "asc" } } },
      },
    },
  })
  if (!doc) throw new Error("Presupuesto no encontrado")

  const items = (doc.builds[0]?.lineItems ?? []).map((li) => ({
    slot: li.slot,
    sourceType: li.sourceType,
    sourceRef: li.sourceRef,
    name: li.name,
    unitPrice: Number(li.unitPrice),
    qty: li.qty,
  })) satisfies LineItemInput[]

  const payload = buildFlyerPayloadFromLineItems(items)
  const title = flyerDisplayTitle(payload) || doc.title

  const record = await db.flyerGeneration.create({
    data: {
      title,
      categoryLabel: payload.product.categoryLabel,
      titleLine1: payload.product.mainTitleLine1,
      titleLine2: payload.product.mainTitleLine2,
      payloadJson: JSON.stringify(payload),
      authorId: session.userId,
      quoteDocumentId: doc.id,
    },
  })

  revalidateFlyers()
  redirect(`/generador-imagenes/${record.id}`)
}

export async function saveFlyerDraft(
  flyerId: string | null,
  data: {
    payload: FlyerPayload
    quoteDocumentId?: string | null
  },
): Promise<string> {
  const session = await requireUser()
  const title = flyerDisplayTitle(data.payload) || "Flyer PC"
  const json = JSON.stringify(data.payload)

  if (flyerId) {
    await db.flyerGeneration.update({
      where: { id: flyerId },
      data: {
        title,
        categoryLabel: data.payload.product.categoryLabel,
        titleLine1: data.payload.product.mainTitleLine1,
        titleLine2: data.payload.product.mainTitleLine2,
        payloadJson: json,
        quoteDocumentId: data.quoteDocumentId ?? undefined,
      },
    })
    revalidateFlyers()
    return flyerId
  }

  const record = await db.flyerGeneration.create({
    data: {
      title,
      categoryLabel: data.payload.product.categoryLabel,
      titleLine1: data.payload.product.mainTitleLine1,
      titleLine2: data.payload.product.mainTitleLine2,
      payloadJson: json,
      authorId: session.userId,
      quoteDocumentId: data.quoteDocumentId ?? null,
    },
  })
  revalidateFlyers()
  return record.id
}

export async function uploadFlyerCaseImage(
  flyerId: string,
  formData: FormData,
  removeBackground = true,
): Promise<{
  path: string
  dataUri: string
  method: BackgroundRemovalMethod
} | null> {
  await requireUser()
  const file = formData.get("caseImage")
  if (!file || !(file instanceof File) || file.size === 0) return null
  if (!file.type.startsWith("image/")) throw new Error("Archivo inválido")
  if (file.size > 5 * 1024 * 1024) throw new Error("Máximo 5 MB")

  const buffer = Buffer.from(await file.arrayBuffer())
  const { caseImagePath, dataUri, method } = await persistCaseImage(
    flyerId,
    buffer,
    removeBackground,
  )
  return { path: caseImagePath, dataUri, method }
}

export async function generateFlyerPng(flyerId: string): Promise<string> {
  await requireUser()

  if (!db.flyerGeneration) {
    throw new Error(
      "El cliente de base de datos está desactualizado. Reiniciá el servidor (npm run dev).",
    )
  }

  const row = await db.flyerGeneration.findUnique({ where: { id: flyerId } })
  if (!row) throw new Error("No encontrado")

  let payload = JSON.parse(row.payloadJson) as FlyerPayload

  if (row.caseImagePath && !payload.product.pcImageBase64) {
    payload.product.pcImageBase64 = await fileToDataUri(row.caseImagePath)
  }

  const png = await renderFlyerPng(payload)
  await mkdir(FLYER_DIR, { recursive: true })
  const outputPath = `/uploads/flyers/${flyerId}.png`
  await writeFile(join(process.cwd(), "public", outputPath.replace(/^\//, "")), png)

  await db.flyerGeneration.update({
    where: { id: flyerId },
    data: { outputPath },
  })

  revalidateFlyers()
  return outputPath
}

export async function deleteFlyerAction(formData: FormData) {
  await requireUser()
  const id = formData.get("id") as string
  if (id) {
    await db.flyerGeneration.delete({ where: { id } })
    revalidateFlyers()
  }
}

export async function searchFlyerReferenceImages(
  query: string,
  kind: ReferenceImageKind = "case",
): Promise<SerperImageResult[]> {
  await requireUser()
  const trimmed = query.trim()
  if (!trimmed) throw new Error("Escribí un término de búsqueda")
  const suffix =
    kind === "case" ? " gabinete PNG fondo transparente" : " producto PNG fondo blanco"
  const q = trimmed.toLowerCase().includes("png") ? trimmed : `${trimmed}${suffix}`
  return searchSerperImages(q, { num: 12, gl: "ar", hl: "es" })
}

export async function getSuggestedReferenceQuery(
  payload: FlyerPayload,
  kind?: ReferenceImageKind,
): Promise<{ query: string; kind: ReferenceImageKind }> {
  await requireUser()
  const resolvedKind = kind ?? suggestReferenceImageKind(payload)
  return {
    kind: resolvedKind,
    query: buildReferenceImageQuery(payload, resolvedKind),
  }
}

export async function applyFlyerReferenceImage(
  flyerId: string,
  imageUrl: string,
  removeBackground = true,
): Promise<{
  caseImagePath: string
  dataUri: string
  method: BackgroundRemovalMethod
}> {
  await requireUser()

  const { buffer } = await downloadImageFromUrl(imageUrl)
  return persistCaseImage(flyerId, buffer, removeBackground)
}

export async function removeFlyerCaseBackground(
  flyerId: string,
): Promise<{ dataUri: string; method: BackgroundRemovalMethod }> {
  await requireUser()

  const row = await db.flyerGeneration.findUnique({ where: { id: flyerId } })
  if (!row) throw new Error("Flyer no encontrado")

  let buffer: Buffer | null = null
  if (row.caseImagePath) {
    const dataUri = await fileToDataUri(row.caseImagePath)
    if (dataUri?.startsWith("data:")) {
      const b64 = dataUri.split(",")[1]
      if (b64) buffer = Buffer.from(b64, "base64")
    }
  }

  if (!buffer && row.payloadJson) {
    const payload = JSON.parse(row.payloadJson) as FlyerPayload
    const b64 = payload.product.pcImageBase64?.split(",")[1]
    if (b64) buffer = Buffer.from(b64, "base64")
  }

  if (!buffer) {
    throw new Error("No hay imagen cargada para procesar")
  }

  const { dataUri, method } = await persistCaseImage(flyerId, buffer, true)
  return { dataUri, method }
}

export async function duplicateFlyerAction(formData: FormData) {
  const session = await requireUser()
  const id = formData.get("id") as string
  if (!id) return

  const original = await db.flyerGeneration.findUnique({ where: { id } })
  if (!original) return

  const copy = await db.flyerGeneration.create({
    data: {
      title: `${original.title} (copia)`,
      categoryLabel: original.categoryLabel,
      titleLine1: original.titleLine1,
      titleLine2: original.titleLine2,
      payloadJson: original.payloadJson,
      caseImagePath: original.caseImagePath,
      authorId: session.userId,
      quoteDocumentId: original.quoteDocumentId,
    },
  })

  revalidateFlyers()
  redirect(`/generador-imagenes/${copy.id}`)
}
