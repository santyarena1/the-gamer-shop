import Link from "next/link"
import { requireSession } from "@/lib/auth"
import { StockFeedError } from "@/lib/acustock-feed"
import { getCachedStockFeed } from "@/lib/server-cache"
import Header from "@/components/Header"
import ProductosView from "./ProductosView"

export default async function ProductosPage() {
  await requireSession()

  try {
    const feed = await getCachedStockFeed()

    return (
      <div className="flex flex-col flex-1 overflow-auto">
        <Header title="Productos" />
        <main className="flex-1 p-6">
          <ProductosView
            products={feed.products}
            fetchedAt={feed.fetchedAt}
            sourceUrl={feed.sourceUrl}
          />
        </main>
      </div>
    )
  } catch (error) {
    const message =
      error instanceof StockFeedError
        ? error.message
        : "No se pudo cargar el catálogo de productos."

    const isAuth = error instanceof StockFeedError && error.code === "AUTH"

    return (
      <div className="flex flex-col flex-1 overflow-auto">
        <Header title="Productos" />
        <main className="flex-1 p-6 max-w-lg">
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 space-y-4">
            <h2 className="font-semibold text-red-300">No se pudo cargar el feed</h2>
            <p className="text-sm text-red-200/80">{message}</p>
            {isAuth && (
              <div className="text-xs text-white/50 space-y-2 bg-black/20 rounded-lg p-4 font-mono">
                <p>Agregá en tu archivo <code className="text-white/70">.env</code>:</p>
                <pre className="whitespace-pre-wrap text-[11px] text-white/60">
{`ACUSTOCK_FEED_TOKEN=feed_...
ACUSTOCK_FEED_SOLO_WEB=0`}
                </pre>
              </div>
            )}
            <Link
              href="https://thegamershop.acustock.app/pages/feed.php"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-sm text-green-400 hover:underline"
            >
              AcuStock feed →
            </Link>
          </div>
        </main>
      </div>
    )
  }
}
