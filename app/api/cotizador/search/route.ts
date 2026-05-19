import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import { searchQuoteProducts } from "@/lib/quote-product-search"

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const q = request.nextUrl.searchParams.get("q") ?? ""
  const limit = Math.min(parseInt(request.nextUrl.searchParams.get("limit") ?? "25", 10), 50)

  const results = await searchQuoteProducts(q, limit)
  return NextResponse.json({ results })
}
