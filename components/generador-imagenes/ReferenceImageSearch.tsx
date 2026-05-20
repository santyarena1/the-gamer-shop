"use client"

import { useEffect, useState, useTransition } from "react"
import {
  applyFlyerReferenceImage,
  getSuggestedReferenceQuery,
  searchFlyerReferenceImages,
} from "@/actions/flyer"
import type { FlyerPayload } from "@/lib/flyer/types"
import type { ReferenceImageKind } from "@/lib/flyer/build-reference-query"
import type { SerperImageResult } from "@/lib/serper-integration-types"
import type { BackgroundRemovalMethod } from "@/lib/flyer/process-case-image"

type Props = {
  payload: FlyerPayload
  flyerId: string | undefined
  serperConfigured: boolean
  removeBackground: boolean
  useOpenAi?: boolean
  onImageApplied: (dataUri: string, method?: BackgroundRemovalMethod) => void
  ensureFlyerId: () => Promise<string>
  onError: (message: string | null) => void
}

export default function ReferenceImageSearch({
  payload,
  flyerId,
  serperConfigured,
  removeBackground,
  useOpenAi = false,
  onImageApplied,
  ensureFlyerId,
  onError,
}: Props) {
  const [kind, setKind] = useState<ReferenceImageKind>("case")
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SerperImageResult[]>([])
  const [pending, startTransition] = useTransition()
  const [applyingUrl, setApplyingUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getSuggestedReferenceQuery(payload, kind)
      .then(({ query: suggested }) => {
        if (!cancelled) setQuery(suggested)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [payload, kind])

  function handleSearch() {
    onError(null)
    startTransition(async () => {
      try {
        const items = await searchFlyerReferenceImages(query, kind)
        setResults(items)
        if (items.length === 0) {
          onError("No se encontraron imágenes. Probá otro término.")
        }
      } catch (e) {
        setResults([])
        onError(e instanceof Error ? e.message : "Error al buscar")
      }
    })
  }

  function handleApply(imageUrl: string) {
    onError(null)
    setApplyingUrl(imageUrl)
    startTransition(async () => {
      try {
        const id = await ensureFlyerId()
        const { dataUri, method } = await applyFlyerReferenceImage(
          id,
          imageUrl,
          removeBackground,
          useOpenAi,
        )
        onImageApplied(dataUri, method)
        setApplyingUrl(null)
      } catch (e) {
        setApplyingUrl(null)
        onError(e instanceof Error ? e.message : "No se pudo usar la imagen")
      }
    })
  }

  if (!serperConfigured) {
    return (
      <p className="text-xs text-amber-200/80 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
        Configurá Serper en <strong>Configuración → Integración API</strong> o agregá{" "}
        <code className="text-white/60">SERPER_API_KEY</code> en .env para buscar imágenes.
      </p>
    )
  }

  return (
    <div className="space-y-3 border-t border-white/10 pt-4">
      <p className="text-xs text-white/50">
        Buscá en Google Imágenes (Serper) la foto del <strong className="text-white">gabinete o producto</strong>{" "}
        que irá a la derecha del flyer.
      </p>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["case", "Gabinete"],
            ["product", "Otro producto"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setKind(value)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              kind === value
                ? "border-brand bg-brand/10 text-brand"
                : "border-white/10 hover:bg-white/5"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
          placeholder="Ej. Thermaltake View 380 XL gabinete PNG"
          className="flex-1 bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm focus-brand min-w-0"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={pending || !query.trim()}
          className="btn-primary px-4 py-2 rounded-lg text-sm shrink-0 disabled:opacity-50"
        >
          {pending && !applyingUrl ? "Buscando…" : "Buscar"}
        </button>
      </div>

      {results.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto pr-1">
          {results.map((img) => (
            <button
              key={img.imageUrl}
              type="button"
              disabled={!!applyingUrl}
              onClick={() => handleApply(img.imageUrl)}
              title={img.title}
              className="group relative aspect-square rounded-lg overflow-hidden border border-white/10 hover:border-brand focus:border-brand disabled:opacity-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.thumbnailUrl ?? img.imageUrl}
                alt={img.title}
                className="w-full h-full object-contain bg-[#0a0a0a] p-1"
              />
              {applyingUrl === img.imageUrl && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/70 text-xs">
                  {removeBackground ? "Quitando fondo…" : "Descargando…"}
                </span>
              )}
              <span className="absolute bottom-0 left-0 right-0 bg-black/80 text-[9px] px-1 py-0.5 truncate opacity-0 group-hover:opacity-100">
                {img.domain ?? "Usar"}
              </span>
            </button>
          ))}
        </div>
      )}

      {!flyerId && results.length > 0 && (
        <p className="text-[11px] text-white/35">
          Al elegir una imagen se guardará el borrador automáticamente.
        </p>
      )}
    </div>
  )
}
