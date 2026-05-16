import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import Header from "@/components/Header"
import EmployeesList from "./EmployeesList"

export default async function EmpleadosPage() {
  const session = await getSession()
  const employees = await db.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true, name: true, email: true, role: true,
      position: true, phone: true, active: true, createdAt: true,
    },
  })

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header title="Empleados" />
      <main className="flex-1 p-6">
        <EmployeesList employees={employees} isAdmin={session?.role === "ADMIN"} />
      </main>
    </div>
  )
}
