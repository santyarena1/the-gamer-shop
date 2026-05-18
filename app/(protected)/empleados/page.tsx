import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { toNumber } from "@/lib/serialize"
import Header from "@/components/Header"
import EmployeesList from "./EmployeesList"

export default async function EmpleadosPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  if (session.role !== "ADMIN") {
    redirect(`/empleados/${session.userId}`)
  }

  const rows = await db.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true, name: true, email: true, role: true,
      position: true, phone: true, active: true, createdAt: true,
      baseSalary: true, ipcAdjusted: true,
    },
  })

  const employees = rows.map((e) => ({
    ...e,
    baseSalary: e.baseSalary != null ? toNumber(e.baseSalary) : null,
  }))

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header title="Empleados" />
      <main className="flex-1 p-6">
        <EmployeesList employees={employees} isAdmin />
      </main>
    </div>
  )
}
