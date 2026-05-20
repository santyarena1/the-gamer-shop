import Link from "next/link"
import Image from "next/image"
import { db } from "@/lib/db"
import { requireSession } from "@/lib/auth"
import Header from "@/components/Header"
import { formatDate } from "@/lib/utils"
import {
  deleteFlyerAction,
  duplicateFlyerAction,
} from "@/actions/flyer"

export default async function GeneradorImagenesPage() {
  await requireSession()

  type FlyerRow = {
    id: string
    title: string
    outputPath: string | null
    updatedAt: Date
    author: { name: string }
  }

  let flyers: FlyerRow[] = []
  let loadError: string | null = null

  try {
    flyers = await db.flyerGeneration.findMany({
      orderBy: { updatedAt: "desc" },
      take: 50,
      include: { author: { select: { name: true } } },
    })
  } catch (e) {
    console.error(e)
    loadError =
      e instanceof Error
        ? e.message
        : "No se pudo leer el historial. Ejecutá: npx prisma migrate deploy"
  }

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <Header title="Generador de imágenes" />
      <main className="flex-1 p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-white/50">
            Subí una imagen de referencia, completá los textos y generá el flyer 1080×1080.
          </p>
          <Link
            href="/generador-imagenes/nuevo"
            className="btn-primary px-4 py-2 rounded-xl text-sm"
          >
            + Nueva imagen
          </Link>
        </div>

        {loadError && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {loadError}
          </div>
        )}

        {!loadError && flyers.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-white/10">
            <p className="text-white/40 mb-4">No hay imágenes generadas</p>
            <Link href="/generador-imagenes/nuevo" className="text-brand hover:underline text-sm">
              Crear la primera →
            </Link>
          </div>
        ) : (
          !loadError && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {flyers.map((f) => (
                <article
                  key={f.id}
                  className="rounded-xl border border-white/10 bg-[#141414] overflow-hidden hover:border-white/20 transition-colors"
                >
                  <Link
                    href={`/generador-imagenes/${f.id}`}
                    className="block aspect-square bg-[#050505] relative"
                  >
                    {f.outputPath ? (
                      <Image
                        src={f.outputPath}
                        alt={f.title}
                        fill
                        className="object-contain p-2"
                        unoptimized
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-white/30 text-xs">
                        Sin render
                      </div>
                    )}
                  </Link>
                  <div className="p-4 space-y-2">
                    <Link
                      href={`/generador-imagenes/${f.id}`}
                      className="font-medium truncate block"
                    >
                      {f.title}
                    </Link>
                    <p className="text-xs text-white/40">
                      {f.author.name} · {formatDate(f.updatedAt)}
                    </p>
                    <div className="flex gap-2 pt-1 flex-wrap">
                      {f.outputPath && (
                        <a
                          href={f.outputPath}
                          download
                          className="text-xs px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10"
                        >
                          Descargar
                        </a>
                      )}
                      <form action={duplicateFlyerAction}>
                        <input type="hidden" name="id" value={f.id} />
                        <button
                          type="submit"
                          className="text-xs px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10"
                        >
                          Duplicar
                        </button>
                      </form>
                      <form action={deleteFlyerAction}>
                        <input type="hidden" name="id" value={f.id} />
                        <button
                          type="submit"
                          className="text-xs px-2 py-1 rounded-lg text-red-300/80 hover:bg-red-500/10"
                        >
                          Eliminar
                        </button>
                      </form>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )
        )}
      </main>
    </div>
  )
}
