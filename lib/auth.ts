import { notFound, redirect } from "next/navigation"
import { getSession } from "@/lib/session"

export async function requireSession() {
  const session = await getSession()
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
