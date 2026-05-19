import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getAppDateIso, isDevDateBarEnabled, isFakeDateActive } from "@/lib/app-date"
import { getCachedSession } from "@/lib/server-cache"
import DevDateBar from "@/components/DevDateBar"
import SidebarData from "@/components/layout/SidebarData"
import SidebarSkeleton from "@/components/layout/SidebarSkeleton"
import RecurringAlertSlot from "@/components/layout/RecurringAlertSlot"

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getCachedSession()
  if (!session) redirect("/login")

  const showDevDateBar = isDevDateBarEnabled()

  return (
    <div className="flex h-screen overflow-hidden">
      <Suspense fallback={<SidebarSkeleton />}>
        <SidebarData session={session} />
      </Suspense>
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {showDevDateBar && (
          <DevDateBar
            currentIso={await getAppDateIso()}
            isFake={await isFakeDateActive()}
          />
        )}
        <Suspense fallback={null}>
          <RecurringAlertSlot role={session.role} />
        </Suspense>
        {children}
      </div>
    </div>
  )
}
