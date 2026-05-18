import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import { toNumber } from "@/lib/serialize"
import Header from "@/components/Header"
import UsersView from "./UsersView"

export default async function UsuariosPage() {
  await requireAdmin()

  const rows = await db.user.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      position: true,
      phone: true,
      active: true,
      createdAt: true,
      baseSalary: true,
      ipcAdjusted: true,
    },
  })

  const users = rows.map((u) => ({
    ...u,
    baseSalary: u.baseSalary != null ? toNumber(u.baseSalary) : null,
  }))

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header title="Usuarios" />
      <main className="flex-1 p-6">
        <UsersView users={users} />
      </main>
    </div>
  )
}
