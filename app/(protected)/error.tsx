"use client"

import Link from "next/link"

function isDatabaseError(message: string) {
  return (
    message.includes("Can't reach database") ||
    message.includes("P1001") ||
    message.includes("DatabaseNotReachable") ||
    message.includes("ECONNREFUSED") ||
    message.includes("5432")
  )
}

export default function ProtectedError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const dbDown = isDatabaseError(error.message)

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-md w-full rounded-2xl border border-red-500/30 bg-red-500/10 p-6 space-y-4">
        <h2 className="font-semibold text-red-300">
          {dbDown ? "Base de datos no disponible" : "Algo salió mal"}
        </h2>
        {dbDown ? (
          <div className="text-sm text-red-200/80 space-y-3">
            <p>
              PostgreSQL no está corriendo en <code className="text-white/70">127.0.0.1:5432</code>.
              Por eso el dashboard y otras pantallas fallan.
            </p>
            <ol className="list-decimal list-inside space-y-1 text-white/60">
              <li>
                En PowerShell, desde la carpeta del proyecto:
                <pre className="mt-1 p-2 rounded bg-black/30 text-xs overflow-x-auto">
                  .\scripts\start-postgres.ps1
                </pre>
              </li>
              <li>
                O en <strong>services.msc</strong> iniciá{" "}
                <strong>postgresql-x64-16</strong> (como Administrador).
              </li>
              <li>Recargá esta página.</li>
            </ol>
          </div>
        ) : (
          <p className="text-sm text-red-200/80">{error.message}</p>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={reset}
            className="px-4 py-2 text-sm rounded-xl bg-white/10 hover:bg-white/15"
          >
            Reintentar
          </button>
          <Link
            href="/login"
            className="px-4 py-2 text-sm rounded-xl border border-white/10 hover:bg-white/5"
          >
            Ir al login
          </Link>
        </div>
      </div>
    </div>
  )
}
