import { ACUSTOCK_FEED_SYNC_INTERVAL_MS } from "@/lib/acustock-feed-constants"

let started = false

function syncIntervalMs(): number {
  const raw = process.env.ACUSTOCK_FEED_SYNC_INTERVAL_MS?.trim()
  if (!raw) return ACUSTOCK_FEED_SYNC_INTERVAL_MS
  const n = Number(raw)
  return Number.isFinite(n) && n >= 60_000 ? n : ACUSTOCK_FEED_SYNC_INTERVAL_MS
}

/** Programa sync periódico del feed (dev y servidor Node persistente). */
export function scheduleAcustockFeedSync(): void {
  if (started) return
  if (process.env.ACUSTOCK_FEED_SYNC_ENABLED === "false") return
  started = true

  const intervalMs = syncIntervalMs()

  const tick = async () => {
    try {
      const { runAcustockFeedSync } = await import("@/lib/acustock-sync")
      const result = await runAcustockFeedSync()
      if (result.ok) {
        console.info(
          `[AcuStock] Sincronizado: ${result.productCount} productos (${result.fetchedAt})`,
        )
      } else {
        console.error(`[AcuStock] Sync falló [${result.code ?? "?"}]: ${result.error}`)
      }
    } catch (e) {
      console.error("[AcuStock] Sync error:", e)
    }
  }

  const bootDelay = Number(process.env.ACUSTOCK_FEED_SYNC_BOOT_DELAY_MS) || 10_000
  setTimeout(() => void tick(), bootDelay)
  setInterval(() => void tick(), intervalMs)

  console.info(
    `[AcuStock] Sync automático cada ${Math.round(intervalMs / 60_000)} min (primer run en ${bootDelay / 1000}s)`,
  )
}
