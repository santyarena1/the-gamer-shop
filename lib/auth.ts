import { notFound, redirect } from "next/navigation"
import { getCachedSession } from "@/lib/server-cache"

export async function requireSession() {
  const session = await getCachedSession()
  if (!session) redirect("/login")
  return session
}

export async function requireAdmin() {
  const session = await requireSession()
  if (session.role !== "ADMIN") notFound()
  return session
}

export async function assertEmployeeAccess(employeeId: string) {
  const session = await requireSession()
  if (session.role !== "ADMIN" && session.userId !== employeeId) notFound()
  return session
}
