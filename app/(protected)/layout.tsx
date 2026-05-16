import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import Sidebar from "@/components/Sidebar"

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect("/login")

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role={session.role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  )
}
