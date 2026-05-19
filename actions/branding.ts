"use server"

import { mkdir, writeFile } from "fs/promises"
import { join } from "path"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { requireAdmin } from "@/lib/auth"
import { DEFAULT_BRANDING, normalizeAccentColor } from "@/lib/branding"

const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "branding")

function revalidateBranding() {
  revalidatePath("/", "layout")
  revalidatePath("/configuracion")
  revalidatePath("/login")
}

export async function updateBrandingAction(
  _prev: string | null,
  formData: FormData,
): Promise<string | null> {
  try {
    await requireAdmin()

    const shopName = (formData.get("shopName") as string)?.trim()
    const tagline = (formData.get("tagline") as string)?.trim()
    const accentColor = normalizeAccentColor(formData.get("accentColor") as string)
    const logoUrlRaw = (formData.get("logoUrl") as string)?.trim()

    if (!shopName) return "El nombre del negocio es obligatorio"
    if (!tagline) return "El subtítulo es obligatorio"
    if (!accentColor) return "Color de acento inválido (usá formato #RRGGBB)"

    const logoUrl = logoUrlRaw || null

    await db.appSettings.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        shopName,
        tagline,
        accentColor,
        logoUrl,
      },
      update: { shopName, tagline, accentColor, logoUrl },
    })

    revalidateBranding()
    return null
  } catch (e) {
    return e instanceof Error ? e.message : "Error al guardar"
  }
}

export async function uploadBrandingLogoAction(
  _prev: string | null,
  formData: FormData,
): Promise<string | null> {
  try {
    await requireAdmin()

    const file = formData.get("logo")
    if (!file || !(file instanceof File) || file.size === 0) {
      return "Seleccioná una imagen"
    }

    if (!file.type.startsWith("image/")) {
      return "El archivo debe ser una imagen"
    }

    if (file.size > 2 * 1024 * 1024) {
      return "La imagen no puede superar 2 MB"
    }

    const ext =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : file.type === "image/svg+xml"
            ? "svg"
            : "jpg"

    await mkdir(UPLOAD_DIR, { recursive: true })
    const buffer = Buffer.from(await file.arrayBuffer())
    const filename = `logo.${ext}`
    await writeFile(join(UPLOAD_DIR, filename), buffer)

    const logoUrl = `/uploads/branding/${filename}?v=${Date.now()}`

    await db.appSettings.upsert({
      where: { id: "default" },
      create: { id: "default", ...DEFAULT_BRANDING, logoUrl },
      update: { logoUrl },
    })

    revalidateBranding()
    return null
  } catch (e) {
    return e instanceof Error ? e.message : "Error al subir el logo"
  }
}

export async function resetBrandingAction(): Promise<void> {
  await requireAdmin()
  await db.appSettings.upsert({
    where: { id: "default" },
    create: { id: "default", ...DEFAULT_BRANDING },
    update: { ...DEFAULT_BRANDING, logoUrl: null },
  })
  revalidateBranding()
}
