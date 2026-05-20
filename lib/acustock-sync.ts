import "server-only"

import { fetchStockFeed, StockFeedError } from "@/lib/acustock-feed"
import { setStockFeedSnapshot } from "@/lib/acustock-feed-store"

export {
  ACUSTOCK_FEED_CACHE_SECONDS,
  ACUSTOCK_FEED_SYNC_INTERVAL_MS,
} from "@/lib/acustock-feed-constants"

export type AcustockSyncResult =
  | { ok: true; productCount: number; fetchedAt: string }
  | { ok: false; error: string; code?: string }

/** Descarga el feed XML de AcuStock y actualiza el snapshot en memoria. */
export async function runAcustockFeedSync(): Promise<AcustockSyncResult> {
  try {
    const feed = await fetchStockFeed()
    setStockFeedSnapshot(feed)
    return {
      ok: true,
      productCount: feed.products.length,
      fetchedAt: feed.fetchedAt,
    }
  } catch (e) {
    if (e instanceof StockFeedError) {
      return { ok: false, error: e.message, code: e.code }
    }
    const message = e instanceof Error ? e.message : "Error desconocido al sincronizar"
    return { ok: false, error: message }
  }
}
