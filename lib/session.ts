import "server-only"
import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

const key = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!)

export type SessionPayload = {
  userId: string
  role: "ADMIN" | "EMPLOYEE"
  name: string
  email: string
}

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key)

  const cookieStore = await cookies()
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  })
}

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("session")?.value
    if (!token) return null
    const { payload } = await jwtVerify(token, key)
    return payload as SessionPayload
  } catch {
    return null
  }
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete("session")
}
