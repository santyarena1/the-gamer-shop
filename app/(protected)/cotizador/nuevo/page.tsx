import { requireSession } from "@/lib/auth"
import Header from "@/components/Header"
import QuoteDocumentEditor from "@/components/cotizador/QuoteDocumentEditor"

export default async function CotizadorNuevoPage() {
  await requireSession()

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header title="Nuevo presupuesto" />
      <main className="flex-1 p-6">
        <QuoteDocumentEditor mode="create" />
      </main>
    </div>
  )
}
