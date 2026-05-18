"use server"

import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"
import { createSession, deleteSession } from "@/lib/session"

export async function login(prevState: string | null, formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) return "Completá todos los campos"

  const user = await db.user.findUnique({ where: { email } })
  if (!user || !user.active) return "Credenciales incorrectas"

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return "Credenciales incorrectas"

  await createSession({
    userId: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
  })

  redirect("/dashboard")
}

export async function logout() {
  await deleteSession()
  redirect("/login")
}

export async function registerFirstAdmin(prevState: string | null, formData: FormData) {
  const count = await db.user.count()
  if (count > 0) return "Ya existe al menos un usuario registrado"

  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!name || !email || !password) return "Completá todos los campos"

  const hashed = await bcrypt.hash(password, 12)
  await db.user.create({
    data: { name, email, password: hashed, role: "ADMIN" },
  })

  redirect("/login")
}

export async function resetPassword(prevState: string | null, formData: FormData) {
  const secret = process.env.PASSWORD_RESET_SECRET
  if (!secret) return "El restablecimiento de contraseña no está habilitado"

  const email = (formData.get("email") as string)?.trim().toLowerCase()
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string
  const resetSecret = formData.get("resetSecret") as string

  if (!email || !password || !confirmPassword || !resetSecret) {
    return "Completá todos los campos"
  }

  if (resetSecret !== secret) return "Código de restablecimiento incorrecto"

  if (password.length < 6) return "La contraseña debe tener al menos 6 caracteres"

  if (password !== confirmPassword) return "Las contraseñas no coinciden"

  const user = await db.user.findUnique({ where: { email } })
  if (!user || !user.active) return "No existe un usuario activo con ese email"

  const hashed = await bcrypt.hash(password, 12)
  await db.user.update({ where: { id: user.id }, data: { password: hashed } })

  return "ok"
}
