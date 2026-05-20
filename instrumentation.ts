export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return

  const { scheduleAcustockFeedSync } = await import("@/lib/acustock-sync-scheduler")
  scheduleAcustockFeedSync()
}
