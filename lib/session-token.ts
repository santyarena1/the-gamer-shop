import { jwtVerify } from "jose"
import type { NextResponse } from "next/server"
import type { SessionPayload } from "@/lib/session"

function sessionKey() {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error("Falta NEXTAUTH_SECRET en .env")
  return new TextEncoder().encode(secret)
}

export async function verifySessionToken(
  token: string | undefined,
): Promise<SessionPayload | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, sessionKey())
    return payload as SessionPayload
  } catch {
    return null
  }
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set("session", "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  })
}
