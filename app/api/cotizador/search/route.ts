import { NextRequest, NextResponse } from "next/server"
import type { PcComponentSlot } from "@/lib/quote-builder-constants"
import { searchQuoteProducts } from "@/lib/quote-product-search"
import { getSession } from "@/lib/session"

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const q = request.nextUrl.searchParams.get("q") ?? ""
  const slot = request.nextUrl.searchParams.get("slot") as PcComponentSlot | null
  const limit = Math.min(parseInt(request.nextUrl.searchParams.get("limit") ?? "25", 10), 50)

  const data = await searchQuoteProducts(q, {
    userId: session.userId,
    slot: slot ?? undefined,
    limit,
  })

  return NextResponse.json(data)
}
