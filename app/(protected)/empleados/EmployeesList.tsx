"use client"

import Link from "next/link"
import { useState, useActionState } from "react"
import { createEmployee, updateEmployee, resetPassword } from "@/actions/employees"

type Employee = {
  id: string
  name: string
  email: string
  role: string
  position: string | null
  phone: string | null
  active: boolean
  createdAt: Date
  baseSalary: unknown | null
  ipcAdjusted: boolean
}

export default function EmployeesList({ employees, isAdmin }: { employees: Employee[]; isAdmin: boolean }) {
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [resetId, setResetId] = useState<string | null>(null)

  const [createError, createAction] = useActionState(async (prev: string | null, fd: FormData) => {
    const err = await createEmployee(prev, fd)
    if (!err) setShowCreate(false)
    return err
  }, null)

  const [updateError, updateAction] = useActionState(async (prev: string | null, fd: FormData) => {
    const err = await updateEmployee(prev, fd)
    if (!err) setEditingId(null)
    return err
  }, null)

  const [resetError, resetAction] = useActionState(async (prev: string | null, fd: FormData) => {
    const err = await resetPassword(prev, fd)
    if (!err) setResetId(null)
    return err
  }, null)

  const editing = employees.find((e) => e.id === editingId)
  const resetting = employees.find((e) => e.id === resetId)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-white/60 text-sm">{employees.length} empleados registrados</p>
        {isAdmin && (
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-green-500 hover:bg-green-400 text-black text-sm font-semibold rounded-lg transition-colors"
          >
            + Nuevo empleado
          </button>
        )}
      </div>

      <div className="grid gap-3">
        {employees.map((emp) => (
          <div
            key={emp.id}
            className="bg-[#141414] border border-white/10 rounded-xl p-4 flex items-center justify-between"
          >
            <Link href={`/empleados/${emp.id}`} className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400 font-bold shrink-0">
                {emp.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-sm">{emp.name}</p>
                <p className="text-xs text-white/40">{emp.email}</p>
                {emp.position && <p className="text-xs text-white/30 mt-0.5">{emp.position}</p>}
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-0.5 rounded-full ${emp.role === "ADMIN" ? "bg-purple-500/20 text-purple-400" : "bg-blue-500/20 text-blue-400"}`}>
                {emp.role === "ADMIN" ? "Admin" : "Empleado"}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${emp.active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                {emp.active ? "Activo" : "Inactivo"}
              </span>
              {emp.ipcAdjusted && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400">IPC</span>
              )}
              {isAdmin && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingId(emp.id)}
                    className="text-xs px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => setResetId(emp.id)}
                    className="text-xs px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    Contraseña
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {showCreate && (
        <Modal title="Nuevo empleado" onClose={() => setShowCreate(false)}>
          <form action={createAction} className="space-y-3">
            <Field label="Nombre" name="name" required />
            <Field label="Email" name="email" type="email" required />
            <Field label="Contraseña" name="password" type="password" required />
            <Field label="Cargo" name="position" />
            <Field label="Teléfono" name="phone" />
            <Field label="Sueldo base" name="baseSalary" type="number" step="0.01" />
            <label className="flex items-center gap-2 text-sm text-white/70">
              <input type="hidden" name="ipcAdjusted" value="false" />
              <input type="checkbox" name="ipcAdjusted" value="true" className="rounded" />
              Ajuste por IPC mensual
            </label>
            <div>
              <label className="text-xs text-white/60 mb-1 block">Rol</label>
              <select name="role" className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500">
                <option value="EMPLOYEE">Empleado</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
            {createError && <p className="text-red-400 text-xs">{createError}</p>}
            <SubmitBtn label="Crear empleado" />
          </form>
        </Modal>
      )}

      {editing && (
        <Modal title="Editar empleado" onClose={() => setEditingId(null)}>
          <form action={updateAction} className="space-y-3">
            <input type="hidden" name="id" value={editing.id} />
            <Field label="Nombre" name="name" defaultValue={editing.name} required />
            <Field label="Email" name="email" type="email" defaultValue={editing.email} required />
            <Field label="Cargo" name="position" defaultValue={editing.position ?? ""} />
            <Field label="Teléfono" name="phone" defaultValue={editing.phone ?? ""} />
            <Field
              label="Sueldo base"
              name="baseSalary"
              type="number"
              step="0.01"
              defaultValue={editing.baseSalary != null ? String(editing.baseSalary) : ""}
            />
            <label className="flex items-center gap-2 text-sm text-white/70">
              <input type="hidden" name="ipcAdjusted" value="false" />
              <input
                type="checkbox"
                name="ipcAdjusted"
                value="true"
                defaultChecked={editing.ipcAdjusted}
                className="rounded"
              />
              Ajuste por IPC mensual
            </label>
            <div>
              <label className="text-xs text-white/60 mb-1 block">Rol</label>
              <select name="role" defaultValue={editing.role} className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500">
                <option value="EMPLOYEE">Empleado</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-white/60 mb-1 block">Estado</label>
              <select name="active" defaultValue={String(editing.active)} className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500">
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </div>
            {updateError && <p className="text-red-400 text-xs">{updateError}</p>}
            <SubmitBtn label="Guardar cambios" />
          </form>
        </Modal>
      )}

      {resetting && (
        <Modal title={`Resetear contraseña: ${resetting.name}`} onClose={() => setResetId(null)}>
          <form action={resetAction} className="space-y-3">
            <input type="hidden" name="id" value={resetting.id} />
            <Field label="Nueva contraseña" name="password" type="password" required />
            {resetError && <p className="text-red-400 text-xs">{resetError}</p>}
            <SubmitBtn label="Cambiar contraseña" />
          </form>
        </Modal>
      )}
    </div>
  )
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl w-full max-w-md p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">{title}</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white text-xl">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({ label, name, type = "text", defaultValue = "", required = false, step }: {
  label: string; name: string; type?: string; defaultValue?: string; required?: boolean; step?: string
}) {
  return (
    <div>
      <label className="text-xs text-white/60 mb-1 block">{label}{required && " *"}</label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        step={step}
        className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
      />
    </div>
  )
}

function SubmitBtn({ label }: { label: string }) {
  return (
    <button
      type="submit"
      className="w-full py-2 bg-green-500 hover:bg-green-400 text-black text-sm font-semibold rounded-lg transition-colors mt-2"
    >
      {label}
    </button>
  )
}
