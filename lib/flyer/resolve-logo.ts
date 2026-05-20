import "server-only"

import { getBranding } from "@/lib/branding"
import { getDefaultTgsLogoDataUri } from "@/lib/flyer/default-logo"
import { resolveImageDataUri } from "@/lib/flyer/resolve-image"
import type { FlyerPayload } from "@/lib/flyer/types"

export async function resolveFlyerLogoDataUri(payload: FlyerPayload): Promise<string> {
  const branding = await getBranding()
  // Logo oficial primero (Configuración → Apariencia), luego el del payload del flyer.
  const candidates = [branding.logoUrl, payload.brand.logoPath].filter(Boolean) as string[]

  for (const ref of candidates) {
    const uri = await resolveImageDataUri(ref)
    if (uri) return uri
  }

  if (candidates.length > 0) {
    throw new Error(
      "No se pudo cargar el logo de la tienda. Revisá Configuración → Apariencia (subí el PNG de nuevo).",
    )
  }

  return getDefaultTgsLogoDataUri(branding.shopName)
}
