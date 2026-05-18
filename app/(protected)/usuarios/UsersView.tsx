"use client"

import Link from "next/link"
import { useState, useActionState } from "react"
import { createEmployee, updateEmployee, resetPassword } from "@/actions/employees"

type UserRow = {
  id: string
  name: string
  email: string
  role: string
  position: string | null
  phone: string | null
  active: boolean
  createdAt: Date
  baseSalary: number | null
  ipcAdjusted: boolean
}

export default function UsersView({ users }: { users: UserRow[] }) {
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

  const editing = users.find((u) => u.id === editingId)
  const resetting = users.find((u) => u.id === resetId)

  return (
    <div className="space-y-4">
      <p className="text-sm text-white/50 max-w-2xl">
        Todos los usuarios tienen perfil de empleado (sueldos, deudas, compras). Activá{" "}
        <strong className="text-white/70">acceso administrador</strong> para quien deba ver gastos,
        IPC, gestionar a otros y el panel completo.
      </p>

      <div className="flex items-center justify-between">
        <p className="text-white/60 text-sm">{users.length} usuarios</p>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-green-500 hover:bg-green-400 text-black text-sm font-semibold rounded-lg"
        >
          + Nuevo usuario
        </button>
      </div>

      <div className="grid gap-3">
        {users.map((user) => (
          <div
            key={user.id}
            className="bg-[#141414] border border-white/10 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-green-400 font-bold shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-sm">{user.name}</p>
                <p className="text-xs text-white/40">{user.email}</p>
                {user.position && <p className="text-xs text-white/30">{user.position}</p>}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {user.role === "ADMIN" ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                  Administrador
                </span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                  Solo empleado
                </span>
              )}
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  user.active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                }`}
              >
                {user.active ? "Activo" : "Inactivo"}
              </span>
              <Link
                href={`/empleados/${user.id}`}
                className="text-xs px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10"
              >
                Ver perfil
              </Link>
              <button
                type="button"
                onClick={() => setEditingId(user.id)}
                className="text-xs px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => setResetId(user.id)}
                className="text-xs px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10"
              >
                Contraseña
              </button>
            </div>
          </div>
        ))}
      </div>

      {showCreate && (
        <UserModal title="Nuevo usuario" onClose={() => setShowCreate(false)}>
          <form action={createAction} className="space-y-3">
            <UserFields />
            <RoleField defaultAdmin={false} />
            <p className="text-xs text-white/35">Contraseña inicial para el primer ingreso.</p>
            <Field label="Contraseña *" name="password" type="password" required />
            {createError && <p className="text-red-400 text-xs">{createError}</p>}
            <Submit />
          </form>
        </UserModal>
      )}

      {editing && (
        <UserModal title="Editar usuario" onClose={() => setEditingId(null)}>
          <form action={updateAction} className="space-y-3">
            <input type="hidden" name="id" value={editing.id} />
            <UserFields
              defaults={{
                name: editing.name,
                email: editing.email,
                position: editing.position ?? "",
                phone: editing.phone ?? "",
                baseSalary: editing.baseSalary != null ? String(editing.baseSalary) : "",
                ipcAdjusted: editing.ipcAdjusted,
              }}
            />
            <RoleField defaultAdmin={editing.role === "ADMIN"} />
            <label className="flex items-center gap-2 text-sm">
              <input type="hidden" name="active" value="false" />
              <input
                type="checkbox"
                name="active"
                value="true"
                defaultChecked={editing.active}
                className="rounded"
              />
              Usuario activo
            </label>
            {updateError && <p className="text-red-400 text-xs">{updateError}</p>}
            <Submit label="Guardar cambios" />
          </form>
        </UserModal>
      )}

      {resetting && (
        <UserModal title={`Contraseña — ${resetting.name}`} onClose={() => setResetId(null)}>
          <form action={resetAction} className="space-y-3">
            <input type="hidden" name="id" value={resetting.id} />
            <Field label="Nueva contraseña *" name="password" type="password" required />
            {resetError && <p className="text-red-400 text-xs">{resetError}</p>}
            <Submit label="Actualizar contraseña" />
          </form>
        </UserModal>
      )}
    </div>
  )
}

function RoleField({ defaultAdmin }: { defaultAdmin: boolean }) {
  return (
    <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3 space-y-2">
      <p className="text-xs font-medium text-purple-300">Rol en el sistema</p>
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="radio"
          name="role"
          value="EMPLOYEE"
          defaultChecked={!defaultAdmin}
          className="accent-green-500"
        />
        Solo empleado — ve su perfil y tareas asignadas
      </label>
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="radio"
          name="role"
          value="ADMIN"
          defaultChecked={defaultAdmin}
          className="accent-green-500"
        />
        Administrador — panel completo, gastos, IPC, usuarios
      </label>
      <p className="text-xs text-white/35">
        En ambos casos tiene ficha de empleado con sueldos y deudas.
      </p>
    </div>
  )
}

function UserFields({
  defaults,
}: {
  defaults?: {
    name: string
    email: string
    position: string
    phone: string
    baseSalary: string
    ipcAdjusted: boolean
  }
}) {
  return (
    <>
      <Field label="Nombre *" name="name" defaultValue={defaults?.name} required />
      <Field label="Email *" name="email" type="email" defaultValue={defaults?.email} required />
      <Field label="Puesto" name="position" defaultValue={defaults?.position} />
      <Field label="Teléfono" name="phone" defaultValue={defaults?.phone} />
      <Field
        label="Sueldo base (opcional)"
        name="baseSalary"
        type="number"
        step="0.01"
        defaultValue={defaults?.baseSalary}
      />
      <label className="flex items-center gap-2 text-sm">
        <input type="hidden" name="ipcAdjusted" value="false" />
        <input
          type="checkbox"
          name="ipcAdjusted"
          value="true"
          defaultChecked={defaults?.ipcAdjusted}
          className="rounded"
        />
        Ajuste por IPC en liquidaciones
      </label>
    </>
  )
}

function UserModal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-xl w-full max-w-md p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between mb-4">
          <h2 className="font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="text-white/40 hover:text-white text-xl">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  step,
}: {
  label: string
  name: string
  type?: string
  defaultValue?: string
  required?: boolean
  step?: string
}) {
  return (
    <div>
      <label className="text-xs text-white/60 mb-1 block">{label}</label>
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

function Submit({ label = "Crear usuario" }: { label?: string }) {
  return (
    <button type="submit" className="w-full py-2 bg-green-500 text-black font-semibold rounded-lg text-sm mt-2">
      {label}
    </button>
  )
}
