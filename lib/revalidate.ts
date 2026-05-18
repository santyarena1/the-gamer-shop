import { revalidatePath } from "next/cache"

export function revalidateEmployee(userId: string) {
  try {
    revalidatePath(`/empleados/${userId}`)
    revalidatePath("/empleados")
    revalidatePath("/dashboard")
    revalidatePath("/tareas")
  } catch {
    // Fuera de un request de Next (scripts/tests): ignorar
  }
}
