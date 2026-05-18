"use server"

import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { revalidateEmployee } from "@/lib/revalidate"

export async function createTask(prevState: string | null, formData: FormData) {
  const session = await getSession()
  if (!session || session.role !== "ADMIN") return "No autorizado"

  const title = formData.get("title") as string
  const description = formData.get("description") as string
  const assignedToId = formData.get("assignedToId") as string
  const priority = formData.get("priority") as string
  const dueDate = formData.get("dueDate") as string

  if (!title || !assignedToId) return "Título y empleado son obligatorios"

  await db.task.create({
    data: {
      title,
      description: description || null,
      assignedToId,
      createdById: session.userId,
      priority: priority as any || "MEDIUM",
      dueDate: dueDate ? new Date(dueDate) : null,
    },
  })

  revalidateEmployee(assignedToId)
  return null
}

export async function updateTaskStatus(taskId: string, status: string) {
  const session = await getSession()
  if (!session) throw new Error("No autorizado")

  const task = await db.task.findUnique({ where: { id: taskId } })
  if (!task) throw new Error("Tarea no encontrada")

  if (session.role !== "ADMIN" && task.assignedToId !== session.userId) {
    throw new Error("No autorizado")
  }

  const updated = await db.task.update({ where: { id: taskId }, data: { status: status as any } })
  revalidateEmployee(updated.assignedToId)
}

export async function deleteTask(taskId: string) {
  const session = await getSession()
  if (!session || session.role !== "ADMIN") throw new Error("No autorizado")

  const task = await db.task.delete({ where: { id: taskId } })
  revalidateEmployee(task.assignedToId)
}
