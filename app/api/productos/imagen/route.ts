import { NextRequest, NextResponse } from "next/server"

const BASE = process.env.ACUSTOCK_FEED_BASE_URL?.replace(/\/$/, "") ??
  "https://thegamershop.acustock.app"

function imageCandidates(id: string, token: string) {
  const q = `id=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}`
  return [
    `${BASE}/pages/stock/producto_imagen.php?${q}`,
    `${BASE}/pages/stock/imagen.php?${q}`,
    `${BASE}/pages/api/producto_imagen.php?${q}`,
    `${BASE}/pages/stock/foto.php?${q}`,
    `${BASE}/uploads/productos/${id}.jpg`,
    `${BASE}/uploads/productos/${id}.webp`,
  ]
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id")
  const token = process.env.ACUSTOCK_FEED_TOKEN?.trim()

  if (!id || !token) {
    return new NextResponse(null, { status: 404 })
  }

  for (const url of imageCandidates(id, token)) {
    try {
      const res = await fetch(url, {
        headers: { Accept: "image/*" },
        cache: "force-cache",
        next: { revalidate: 3600 },
      })
      if (!res.ok) continue
      const type = res.headers.get("content-type") ?? ""
      if (!type.startsWith("image/")) continue

      const buffer = await res.arrayBuffer()
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": type,
          "Cache-Control": "public, max-age=86400",
        },
      })
    } catch {
      continue
    }
  }

  return new NextResponse(null, { status: 404 })
}
