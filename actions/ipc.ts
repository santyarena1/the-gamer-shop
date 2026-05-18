"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { getAppDate } from "@/lib/app-date"
import { generateSalariesForMonth } from "@/lib/generate-salaries"
import { getSession } from "@/lib/session"
import { getCurrentPeriod } from "@/lib/salary"

async function requireAdmin() {
  const session = await getSession()
  if (!session || session.role !== "ADMIN") throw new Error("No autorizado")
  return session
}

export async function saveMonthlyIpc(prevState: string | null, formData: FormData) {
  await requireAdmin()

  const month = parseInt(formData.get("month") as string)
  const year = parseInt(formData.get("year") as string)
  const percentage = parseFloat(formData.get("percentage") as string)

  if (isNaN(month) || isNaN(year) || isNaN(percentage) || percentage < 0) {
    return "Ingresá un porcentaje de IPC válido"
  }

  await db.monthlyIpc.upsert({
    where: { month_year: { month, year } },
    create: { month, year, percentage },
    update: { percentage },
  })

  const cookieStore = await cookies()
  cookieStore.delete("payroll-skip-auto")

  await generateSalariesForMonth(month, year)

  revalidatePath("/dashboard")
  revalidatePath("/empleados", "layout")
  return null
}

export async function generateSalariesForCurrentPeriod() {
  await requireAdmin()
  const { month, year } = getCurrentPeriod(await getAppDate())
  await generateSalariesForMonth(month, year)
  revalidatePath("/dashboard")
  revalidatePath("/empleados", "layout")
}

export { generateSalariesForMonth }
