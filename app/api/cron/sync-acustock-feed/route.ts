import { NextResponse } from "next/server"
import { runAcustockFeedSync } from "@/lib/acustock-sync"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET no configurado en el servidor" },
      { status: 503 },
    )
  }

  const auth = request.headers.get("authorization")
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 401 })
  }

  const result = await runAcustockFeedSync()
  return NextResponse.json(result, { status: result.ok ? 200 : 502 })
}
