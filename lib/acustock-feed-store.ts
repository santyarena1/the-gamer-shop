import type { StockFeedResult } from "@/lib/acustock-feed"
import { ACUSTOCK_FEED_CACHE_SECONDS } from "@/lib/acustock-feed-constants"

let snapshot: StockFeedResult | null = null

function snapshotAgeMs(feed: StockFeedResult): number {
  return Date.now() - new Date(feed.fetchedAt).getTime()
}

export function getStockFeedSnapshot(): StockFeedResult | null {
  if (!snapshot) return null
  if (snapshotAgeMs(snapshot) > ACUSTOCK_FEED_CACHE_SECONDS * 1000) return null
  return snapshot
}

export function setStockFeedSnapshot(feed: StockFeedResult): void {
  snapshot = feed
}
