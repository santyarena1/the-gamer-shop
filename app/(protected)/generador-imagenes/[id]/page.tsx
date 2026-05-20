import Link from "next/link"
import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { requireSession } from "@/lib/auth"
import Header from "@/components/Header"
import FlyerEditor from "@/components/generador-imagenes/FlyerEditor"
import type { FlyerPayload } from "@/lib/flyer/types"
import { fileToDataUri } from "@/lib/flyer/load-image"
import { getSerperPublicSettings } from "@/lib/serper-integration"
import { getBranding } from "@/lib/branding"
import { getOpenAiFlyerDiagnostics } from "@/lib/openai-integration"

type Props = { params: Promise<{ id: string }> }

export default async function GeneradorImagenesEditPage({ params }: Props) {
  await requireSession()
  const { id } = await params

  const [row, serper, branding, openAiDiag] = await Promise.all([
    db.flyerGeneration.findUnique({ where: { id } }),
    getSerperPublicSettings(),
    getBranding(),
    getOpenAiFlyerDiagnostics(),
  ])
  if (!row) notFound()

  const payload = JSON.parse(row.payloadJson) as FlyerPayload
  if (!payload.brand.logoPath && branding.logoUrl) {
    payload.brand.logoPath = branding.logoUrl
  }
  if (row.caseImagePath && !payload.product.pcImageBase64) {
    payload.product.pcImageBase64 = await fileToDataUri(row.caseImagePath)
  }

  const styleRefPath = payload.styleReference?.path ?? null
  const styleReferencePreview = styleRefPath ? await fileToDataUri(styleRefPath) : null

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header title={row.title} />
      <main className="flex-1 p-6">
        <div className="flex flex-wrap gap-3 mb-4 text-sm">
          <Link href="/generador-imagenes" className="text-white/40 hover:text-white">
            ← Historial
          </Link>
          {row.quoteDocumentId && (
            <Link
              href={`/cotizador/${row.quoteDocumentId}`}
              className="text-brand hover:underline"
            >
              Ver cotización origen
            </Link>
          )}
        </div>
        <FlyerEditor
          flyerId={row.id}
          initialPayload={payload}
          outputPath={row.outputPath}
          caseImagePath={row.caseImagePath}
          styleReferencePath={styleRefPath}
          styleReferencePreview={styleReferencePreview}
          quoteDocumentId={row.quoteDocumentId}
          serperConfigured={serper.configured}
          openAiConfigured={openAiDiag.ready}
          openAiStatusMessage={openAiDiag.message}
        />
      </main>
    </div>
  )
}
