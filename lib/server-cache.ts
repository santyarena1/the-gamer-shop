import "server-only"

import { cache } from "react"
import { unstable_cache } from "next/cache"
import { db } from "@/lib/db"
import { fetchStockFeed, type StockFeedResult } from "@/lib/acustock-feed"
import { getStockFeedSnapshot, setStockFeedSnapshot } from "@/lib/acustock-feed-store"
import { getBranding } from "@/lib/branding"
import { getRecurringExpenseAlert } from "@/lib/recurring-expenses"
import { getSession } from "@/lib/session"

/** Una lectura de sesión por request (layout + páginas). */
export const getCachedSession = cache(getSession)

export const getCachedNavEmployees = unstable_cache(
  async () =>
    db.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, active: true },
    }),
  ["nav-employees"],
  { revalidate: 120, tags: ["users"] },
)

/** Por request: usa cookies de fecha dev, no va en unstable_cache. */
export const getCachedRecurringAlert = cache(getRecurringExpenseAlert)

export const getCachedBranding = unstable_cache(
  async () => getBranding(),
  ["app-branding"],
  { revalidate: 60, tags: ["branding"] },
)

async function loadStockFeed(): Promise<StockFeedResult> {
  const snap = getStockFeedSnapshot()
  if (snap) return snap
  const feed = await fetchStockFeed()
  setStockFeedSnapshot(feed)
  return feed
}

/** Catálogo AcuStock: snapshot en memoria (sync cada 1 h) + dedup por request. */
export const getCachedStockFeed = cache(loadStockFeed)
