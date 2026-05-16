import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import Header from "@/components/Header"
import TasksView from "./TasksView"

export default async function TareasPage() {
  const session = await getSession()

  const [tasks, employees] = await Promise.all([
    db.task.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        assignedTo: { select: { id: true, name: true } },
        createdBy: { select: { name: true } },
      },
      ...(session?.role !== "ADMIN" ? { where: { assignedToId: session?.userId } } : {}),
    }),
    db.user.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header title="Tareas" />
      <main className="flex-1 p-6">
        <TasksView tasks={tasks} employees={employees} isAdmin={session?.role === "ADMIN"} />
      </main>
    </div>
  )
}
