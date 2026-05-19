import Link from "next/link"
import { db } from "@/lib/db"
import { requireSession } from "@/lib/auth"
import Header from "@/components/Header"
import FlyerEditor from "@/components/generador-imagenes/FlyerEditor"
import { buildFlyerPayloadFromLineItems } from "@/lib/flyer/map-from-quote"
import { getSerperPublicSettings } from "@/lib/serper-integration"
import { getOpenAiPublicSettings } from "@/lib/openai-integration"

type Props = {
  searchParams: Promise<{ quoteId?: string }>
}

export default async function GeneradorImagenesNuevoPage({ searchParams }: Props) {
  await requireSession()
  const { quoteId } = await searchParams
  const [serper, openAi] = await Promise.all([
    getSerperPublicSettings(),
    getOpenAiPublicSettings(),
  ])

  let initialPayload = buildFlyerPayloadFromLineItems([])
  let quoteDocumentId: string | null = null

  if (quoteId) {
    const doc = await db.quoteDocument.findUnique({
      where: { id: quoteId },
      include: {
        builds: {
          take: 1,
          orderBy: { sortOrder: "asc" },
          include: { lineItems: { orderBy: { sortOrder: "asc" } } },
        },
      },
    })
    if (doc?.builds[0]) {
      const items = doc.builds[0].lineItems.map((li) => ({
        slot: li.slot,
        sourceType: li.sourceType,
        sourceRef: li.sourceRef,
        name: li.name,
        unitPrice: Number(li.unitPrice),
        qty: li.qty,
      }))
      initialPayload = buildFlyerPayloadFromLineItems(items)
      quoteDocumentId = doc.id
    }
  }

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header title="Nueva imagen PC" />
      <main className="flex-1 p-6">
        <Link href="/generador-imagenes" className="text-sm text-white/40 hover:text-white mb-4 inline-block">
          ← Volver al historial
        </Link>
        <FlyerEditor
          initialPayload={initialPayload}
          quoteDocumentId={quoteDocumentId}
          serperConfigured={serper.configured}
          openAiConfigured={openAi.configured}
        />
      </main>
    </div>
  )
}
