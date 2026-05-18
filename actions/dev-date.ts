"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { DEV_FAKE_DATE_COOKIE } from "@/lib/app-date-shared"
import { isDevDateBarEnabled } from "@/lib/app-date"

function assertDevOnly() {
  if (!isDevDateBarEnabled()) throw new Error("No disponible fuera de desarrollo")
}

export async function setDevFakeDate(isoDate: string) {
  assertDevOnly()

  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    return { error: "Fecha inválida" }
  }

  const cookieStore = await cookies()
  cookieStore.set(DEV_FAKE_DATE_COOKIE, isoDate, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  })

  revalidatePath("/", "layout")
  revalidatePath("/dashboard")
  revalidatePath("/empleados", "layout")
  return { ok: true }
}

export async function clearDevFakeDate() {
  assertDevOnly()

  const cookieStore = await cookies()
  cookieStore.delete(DEV_FAKE_DATE_COOKIE)

  revalidatePath("/", "layout")
  revalidatePath("/dashboard")
  revalidatePath("/empleados", "layout")
  return { ok: true }
}
