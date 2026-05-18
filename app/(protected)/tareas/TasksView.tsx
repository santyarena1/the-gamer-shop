"use client"

import { useState, useActionState } from "react"
import { createTask, updateTaskStatus, deleteTask } from "@/actions/tasks"
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS, formatDate } from "@/lib/utils"
import { isPastDue } from "@/lib/app-date-shared"
import { useAppDate } from "@/hooks/useAppDate"

type Task = {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  dueDate: Date | null
  createdAt: Date
  assignedTo: { id: string; name: string }
  createdBy: { name: string }
}

type Employee = { id: string; name: string }

export default function TasksView({ tasks, employees, isAdmin, employeeId }: {
  tasks: Task[]
  employees: Employee[]
  isAdmin: boolean
  employeeId?: string
}) {
  const { date: today } = useAppDate()
  const [showCreate, setShowCreate] = useState(false)
  const [filter, setFilter] = useState("ALL")

  const [createError, createAction] = useActionState(async (prev: string | null, fd: FormData) => {
    const err = await createTask(prev, fd)
    if (!err) setShowCreate(false)
    return err
  }, null)

  const filtered = filter === "ALL" ? tasks : tasks.filter((t) => t.status === filter)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {["ALL", "PENDING", "IN_PROGRESS", "DONE", "CANCELLED"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${filter === s ? "bg-green-500/20 text-green-400" : "bg-white/5 text-white/60 hover:bg-white/10"}`}
            >
              {s === "ALL" ? "Todas" : TASK_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-green-500 hover:bg-green-400 text-black text-sm font-semibold rounded-lg transition-colors"
          >
            + Nueva tarea
          </button>
        )}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-white/30">No hay tareas</div>
        ) : (
          filtered.map((task) => (
            <div key={task.id} className="bg-[#141414] border border-white/10 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${TASK_STATUS_COLORS[task.status]}`}>
                      {TASK_STATUS_LABELS[task.status]}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_COLORS[task.priority]}`}>
                      {PRIORITY_LABELS[task.priority]}
                    </span>
                  </div>
                  <p className="font-medium text-sm">{task.title}</p>
                  {task.description && <p className="text-xs text-white/40 mt-1">{task.description}</p>}
                  <div className="flex items-center gap-3 mt-2 text-xs text-white/30">
                    {!employeeId && <span>→ {task.assignedTo.name}</span>}
                    {task.dueDate && (
                      <span className={task.status !== "DONE" && task.status !== "CANCELLED" && isPastDue(task.dueDate, today) ? "text-red-400" : undefined}>
                        Vence: {formatDate(task.dueDate)}
                        {task.status !== "DONE" && task.status !== "CANCELLED" && isPastDue(task.dueDate, today) ? " · vencida" : ""}
                      </span>
                    )}
                    <span>Por: {task.createdBy.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {task.status !== "DONE" && task.status !== "CANCELLED" && (
                    <select
                      defaultValue={task.status}
                      onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                      className="text-xs bg-[#1a1a1a] border border-white/10 rounded-lg px-2 py-1 focus:outline-none focus:border-green-500"
                    >
                      <option value="PENDING">Pendiente</option>
                      <option value="IN_PROGRESS">En progreso</option>
                      <option value="DONE">Completada</option>
                      <option value="CANCELLED">Cancelada</option>
                    </select>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-xs px-2 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-xl w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Nueva tarea</h2>
              <button onClick={() => setShowCreate(false)} className="text-white/40 hover:text-white text-xl">×</button>
            </div>
            <form action={createAction} className="space-y-3">
              <div>
                <label className="text-xs text-white/60 mb-1 block">Título *</label>
                <input name="title" required className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500" />
              </div>
              <div>
                <label className="text-xs text-white/60 mb-1 block">Descripción</label>
                <textarea name="description" rows={2} className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500 resize-none" />
              </div>
              {employeeId ? (
                <input type="hidden" name="assignedToId" value={employeeId} />
              ) : (
                <div>
                  <label className="text-xs text-white/60 mb-1 block">Asignar a *</label>
                  <select name="assignedToId" required className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500">
                    <option value="">Seleccionar empleado</option>
                    {employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/60 mb-1 block">Prioridad</label>
                  <select name="priority" className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500">
                    <option value="LOW">Baja</option>
                    <option value="MEDIUM" selected>Media</option>
                    <option value="HIGH">Alta</option>
                    <option value="URGENT">Urgente</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/60 mb-1 block">Fecha límite</label>
                  <input name="dueDate" type="date" className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500" />
                </div>
              </div>
              {createError && <p className="text-red-400 text-xs">{createError}</p>}
              <button type="submit" className="w-full py-2 bg-green-500 hover:bg-green-400 text-black text-sm font-semibold rounded-lg transition-colors mt-2">
                Crear tarea
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
