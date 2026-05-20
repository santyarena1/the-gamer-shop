import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { clearSessionCookie, verifySessionToken } from "@/lib/session-token"

const publicPaths = ["/login"]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/api/cron/")) {
    return NextResponse.next()
  }

  const token = request.cookies.get("session")?.value
  const session = await verifySessionToken(token)
  const hasStaleCookie = Boolean(token) && !session

  if (publicPaths.includes(pathname)) {
    if (session) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
    const response = NextResponse.next()
    if (hasStaleCookie) clearSessionCookie(response)
    return response
  }

  if (!session) {
    const response = NextResponse.redirect(new URL("/login", request.url))
    if (hasStaleCookie) clearSessionCookie(response)
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
}
