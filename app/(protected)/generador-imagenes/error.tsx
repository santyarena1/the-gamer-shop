"use client"

import Link from "next/link"
import { useEffect } from "react"

export default function GeneradorImagenesError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[generador-imagenes]", error)
  }, [error])

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <h2 className="text-lg font-semibold text-red-300 mb-2">Error en Generador de imágenes</h2>
      <p className="text-sm text-white/50 max-w-md mb-4">
        {error.message || "No se pudo cargar el módulo. Si acabás de actualizar el sistema, reiniciá el servidor de desarrollo."}
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="btn-primary px-4 py-2 rounded-lg text-sm"
        >
          Reintentar
        </button>
        <Link href="/dashboard" className="px-4 py-2 rounded-lg border border-white/10 text-sm hover:bg-white/5">
          Ir al inicio
        </Link>
      </div>
    </div>
  )
}
