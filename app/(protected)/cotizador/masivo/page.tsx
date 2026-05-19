import { db } from "@/lib/db"
import { requireSession } from "@/lib/auth"
import Header from "@/components/Header"
import VariantMatrixWizard from "@/components/cotizador/VariantMatrixWizard"
import Link from "next/link"

export default async function CotizadorMasivoPage() {
  await requireSession()

  const templates = await db.pcBuildTemplate.findMany({
    orderBy: { updatedAt: "desc" },
    take: 20,
  })

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header title="Variantes masivas" />
      <main className="flex-1 p-6">
        <Link href="/cotizador" className="text-sm text-white/40 hover:text-white mb-4 inline-block">
          ← Volver al cotizador
        </Link>
        <p className="text-sm text-white/50 mb-6">
          Armá una PC base y generá varias configuraciones cambiando un componente (ej. distintas
          GPUs).
        </p>
        <VariantMatrixWizard templates={templates} />
      </main>
    </div>
  )
}
