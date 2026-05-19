import Sidebar from "@/components/Sidebar"
import { getCachedBranding, getCachedNavEmployees } from "@/lib/server-cache"
import type { SessionPayload } from "@/lib/session"

export default async function SidebarData({ session }: { session: SessionPayload }) {
  const [employees, branding] = await Promise.all([
    session.role === "ADMIN" ? getCachedNavEmployees() : Promise.resolve([]),
    getCachedBranding(),
  ])

  return (
    <Sidebar
      role={session.role}
      userId={session.userId}
      employees={employees}
      branding={branding}
    />
  )
}
