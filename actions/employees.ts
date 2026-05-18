"use server"

import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { getSession } from "@/lib/session"
import { revalidateEmployee } from "@/lib/revalidate"

async function requireAdmin() {
  const session = await getSession()
  if (!session || session.role !== "ADMIN") throw new Error("No autorizado")
  return session
}

export async function createEmployee(prevState: string | null, formData: FormData) {
  await requireAdmin()

  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const position = formData.get("position") as string
  const phone = formData.get("phone") as string
  const role = formData.get("role") as "ADMIN" | "EMPLOYEE"
  const baseSalaryRaw = formData.get("baseSalary") as string
  const ipcAdjusted = formData.getAll("ipcAdjusted").includes("true")
  const baseSalary = baseSalaryRaw ? parseFloat(baseSalaryRaw) : null

  if (!name || !email || !password) return "Nombre, email y contraseña son obligatorios"

  const exists = await db.user.findUnique({ where: { email } })
  if (exists) return "Ya existe un usuario con ese email"

  const hashed = await bcrypt.hash(password, 12)
  const user = await db.user.create({
    data: {
      name,
      email,
      password: hashed,
      position: position || null,
      phone: phone || null,
      role: role || "EMPLOYEE",
      baseSalary: baseSalary && !isNaN(baseSalary) ? baseSalary : null,
      ipcAdjusted,
    },
  })

  revalidateEmployee(user.id)
  return null
}

export async function updateEmployee(prevState: string | null, formData: FormData) {
  await requireAdmin()

  const id = formData.get("id") as string
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const position = formData.get("position") as string
  const phone = formData.get("phone") as string
  const role = formData.get("role") as "ADMIN" | "EMPLOYEE"
  const active = formData.get("active") === "true"
  const baseSalaryRaw = formData.get("baseSalary") as string
  const ipcAdjusted = formData.getAll("ipcAdjusted").includes("true")
  const baseSalary = baseSalaryRaw ? parseFloat(baseSalaryRaw) : null

  await db.user.update({
    where: { id },
    data: {
      name,
      email,
      position: position || null,
      phone: phone || null,
      role,
      active,
      baseSalary: baseSalary && !isNaN(baseSalary) ? baseSalary : null,
      ipcAdjusted,
    },
  })

  revalidateEmployee(id)
  return null
}

export async function resetPassword(prevState: string | null, formData: FormData) {
  await requireAdmin()

  const id = formData.get("id") as string
  const password = formData.get("password") as string

  if (!password || password.length < 6) return "La contraseña debe tener al menos 6 caracteres"

  const hashed = await bcrypt.hash(password, 12)
  await db.user.update({ where: { id }, data: { password: hashed } })

  revalidateEmployee(id)
  return null
}
