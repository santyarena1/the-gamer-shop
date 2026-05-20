"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  generateFlyerPng,
  removeFlyerCaseBackground,
  saveFlyerDraft,
  uploadFlyerCaseImage,
  uploadFlyerStyleReference,
} from "@/actions/flyer"
import ReferenceImageSearch from "@/components/generador-imagenes/ReferenceImageSearch"
import {
  DEFAULT_BENEFITS,
  FLYER_TEMPLATE_ID,
  type FlyerComponent,
  type FlyerComponentIcon,
  type FlyerPayload,
} from "@/lib/flyer/types"
import { slimFlyerPayload } from "@/lib/flyer/slim-payload"

const ICON_OPTIONS: FlyerComponentIcon[] = [
  "cpu",
  "motherboard",
  "ram_storage",
  "gpu",
  "psu",
  "cooler",
  "monitor",
  "other",
]

type Props = {
  flyerId?: string
  initialPayload: FlyerPayload
  outputPath?: string | null
  caseImagePath?: string | null
  styleReferencePath?: string | null
  styleReferencePreview?: string | null
  quoteDocumentId?: string | null
  serperConfigured?: boolean
  openAiConfigured?: boolean
  openAiStatusMessage?: string
}

export default function FlyerEditor({
  flyerId: initialFlyerId,
  initialPayload,
  outputPath: initialOutput,
  caseImagePath,
  styleReferencePath: initialStylePath,
  styleReferencePreview: initialStylePreview,
  quoteDocumentId,
  serperConfigured = false,
  openAiConfigured = false,
  openAiStatusMessage,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [removeBackgroundOnPick, setRemoveBackgroundOnPick] = useState(false)
  const [useOpenAiOnPick, setUseOpenAiOnPick] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [flyerId, setFlyerId] = useState(initialFlyerId)
  const [payload, setPayload] = useState<FlyerPayload>(initialPayload)
  const [outputPath, setOutputPath] = useState(initialOutput ?? null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialOutput ?? null)
  const [lastRenderMethod, setLastRenderMethod] = useState<"openai" | "template" | null>(
    null,
  )
  const [styleRefPath, setStyleRefPath] = useState(initialStylePath ?? null)
  const [styleRefPreview, setStyleRefPreview] = useState<string | null>(
    initialStylePreview ?? null,
  )

  function updateProduct<K extends keyof FlyerPayload["product"]>(
    key: K,
    value: FlyerPayload["product"][K],
  ) {
    setPayload((p) => ({ ...p, product: { ...p.product, [key]: value } }))
  }

  function updateComponent(index: number, patch: Partial<FlyerComponent>) {
    setPayload((p) => {
      const components = [...p.components]
      components[index] = { ...components[index]!, ...patch }
      return { ...p, components }
    })
  }

  function addComponent() {
    setPayload((p) => ({
      ...p,
      components: [...p.components, { icon: "other", label: "COMPONENTE", value: "" }],
    }))
  }

  function removeComponent(index: number) {
    setPayload((p) => ({
      ...p,
      components: p.components.filter((_, i) => i !== index),
    }))
  }

  const hasProductImage = Boolean(payload.product.pcImageBase64 || caseImagePath)

  async function ensureFlyerId(): Promise<string> {
    if (flyerId) return flyerId
    const id = await saveFlyerDraft(null, {
      payload: slimFlyerPayload(payload),
      quoteDocumentId,
    })
    setFlyerId(id)
    router.replace(`/generador-imagenes/${id}`)
    return id
  }

  function handleStyleReferenceUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    startTransition(async () => {
      try {
        const id = await ensureFlyerId()
        const fd = new FormData()
        fd.set("styleReference", file)
        const result = await uploadFlyerStyleReference(id, fd)
        if (result) {
          setStyleRefPath(result.path)
          const reader = new FileReader()
          reader.onload = () => setStyleRefPreview(reader.result as string)
          reader.readAsDataURL(file)
          setPayload((p) => ({
            ...p,
            styleReference: { path: result.path },
          }))
        }
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al subir referencia de diseño")
      }
    })
  }

  function handleProductUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    startTransition(async () => {
      try {
        const id = await ensureFlyerId()
        const fd = new FormData()
        fd.set("caseImage", file)
        const result = await uploadFlyerCaseImage(
          id,
          fd,
          removeBackgroundOnPick,
          useOpenAiOnPick,
        )
        if (result) {
          updateProduct("pcImageBase64", result.dataUri)
        }
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al subir imagen del producto")
      }
    })
  }

  function handleRemoveProductBackground() {
    if (!payload.product.pcImageBase64 && !caseImagePath) {
      setError("Elegí primero la imagen del producto (derecha)")
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        const id = await ensureFlyerId()
        const { dataUri } = await removeFlyerCaseBackground(id, useOpenAiOnPick)
        updateProduct("pcImageBase64", dataUri)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo quitar el fondo")
      }
    })
  }

  function handleGenerate() {
    if (!hasProductImage) {
      setError("Elegí la imagen del gabinete/producto que va a la derecha del flyer")
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        const id = await ensureFlyerId()
        await saveFlyerDraft(id, {
          payload: slimFlyerPayload(payload),
          quoteDocumentId,
        })
        const { outputPath, renderMethod } = await generateFlyerPng(id)
        setOutputPath(outputPath)
        setLastRenderMethod(renderMethod)
        setPreviewUrl(`${outputPath}?t=${Date.now()}`)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al generar")
      }
    })
  }

  function handleSaveDraft() {
    setError(null)
    startTransition(async () => {
      try {
        const id = await saveFlyerDraft(flyerId ?? null, {
          payload: slimFlyerPayload({
            ...payload,
            styleReference: styleRefPath ? { path: styleRefPath } : undefined,
          }),
          quoteDocumentId,
        })
        setFlyerId(id)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al guardar")
      }
    })
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        <p className="text-sm text-white/50 rounded-xl border border-brand/30 bg-brand/5 px-4 py-3">
          Al pulsar <strong className="text-white">Generar</strong>, el PNG sale de la plantilla SVG{" "}
          <strong className="text-white">{FLYER_TEMPLATE_ID}</strong> (diseño TGS fijo): textos exactos,
          logo desde Configuración → Apariencia, y la foto del producto a la derecha. OpenAI solo se usa
          si activás quitar fondo en la imagen del producto.
        </p>

        {/* 1. Referencia de diseño */}
        <section className="rounded-xl border border-white/15 bg-[#141414] p-5 space-y-4">
          <div>
            <h3 className="font-medium text-lg">1. Referencia de diseño</h3>
            <p className="text-xs text-white/45 mt-1">
              Opcional: flyer de ejemplo para comparar mientras armás el contenido (no se incrusta en el
              PNG).
            </p>
          </div>

          <label className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-white/15 bg-[#0a0a0a] p-6 cursor-pointer hover:border-white/30 min-h-[140px] justify-center">
            {styleRefPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={styleRefPreview}
                alt="Referencia de diseño"
                className="max-h-40 max-w-full object-contain rounded-lg"
              />
            ) : (
              <span className="text-white/35 text-sm text-center">
                Subí un flyer de ejemplo
                <br />
                <span className="text-xs">JPG o PNG · máx. 5 MB</span>
              </span>
            )}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleStyleReferenceUpload}
              disabled={pending}
            />
            <span className="text-xs px-3 py-1.5 rounded-lg bg-white/10">
              {pending ? "Subiendo…" : "Elegir imagen de referencia"}
            </span>
          </label>
          {styleRefPath && (
            <p className="text-xs text-white/35 truncate">Guardada: {styleRefPath}</p>
          )}
        </section>

        {/* 2. Imagen del producto (derecha) */}
        <section className="rounded-xl border-2 border-dashed border-brand/50 bg-[#141414] p-5 space-y-4">
          <div>
            <h3 className="font-medium text-lg">2. Imagen del producto (va a la derecha)</h3>
            <p className="text-xs text-white/45 mt-1">
              Gabinete o producto que se verá en el flyer. Buscá con Serper, quitá el fondo blanco y/o
              subí un PNG transparente.
            </p>
          </div>

          {payload.product.pcImageBase64 && (
            <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-4 flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={payload.product.pcImageBase64}
                alt="Producto en el flyer"
                className="max-h-52 max-w-full object-contain"
              />
            </div>
          )}

          {serperConfigured ? (
            <ReferenceImageSearch
              payload={payload}
              flyerId={flyerId}
              serperConfigured={serperConfigured}
              removeBackground={removeBackgroundOnPick}
              useOpenAi={useOpenAiOnPick}
              ensureFlyerId={ensureFlyerId}
              onImageApplied={(dataUri) => updateProduct("pcImageBase64", dataUri)}
              onError={setError}
            />
          ) : (
            <p className="text-xs text-amber-200/80 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
              Configurá Serper en Configuración → Integración API para buscar fotos del producto.
            </p>
          )}

          <label className="flex items-center gap-2 text-xs text-white/60 cursor-pointer">
            <input
              type="checkbox"
              checked={removeBackgroundOnPick}
              onChange={(e) => {
                const on = e.target.checked
                setRemoveBackgroundOnPick(on)
                if (!on) setUseOpenAiOnPick(false)
              }}
              className="rounded border-white/20"
            />
            Quitar fondo claro al elegir imagen (solo bordes, conserva el producto)
          </label>
          {removeBackgroundOnPick && openAiConfigured && (
            <label className="flex items-center gap-2 text-xs text-amber-200/70 cursor-pointer ml-5">
              <input
                type="checkbox"
                checked={useOpenAiOnPick}
                onChange={(e) => setUseOpenAiOnPick(e.target.checked)}
                className="rounded border-amber-500/30"
              />
              Usar OpenAI (experimental: puede alterar o recortar el gabinete)
            </label>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleRemoveProductBackground}
              disabled={pending || !hasProductImage}
              className="text-xs px-3 py-2 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-40"
            >
              Quitar fondo de la imagen actual
            </button>
          </div>

          <label className="block">
            <span className="text-xs text-white/50 mb-2 block">O subir archivo del producto</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleProductUpload}
              disabled={pending}
              className="block w-full text-sm text-white/60 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-brand file:text-black file:font-medium"
            />
          </label>
          {caseImagePath && (
            <p className="text-xs text-white/35 truncate">Producto guardado: {caseImagePath}</p>
          )}
        </section>

        {/* 3. Textos */}
        <section className="rounded-xl border border-white/10 bg-[#141414] p-5 space-y-4">
          <div>
            <h3 className="font-medium text-lg">3. Textos del flyer</h3>
            <p className="text-xs text-white/45 mt-1">Completá manualmente.</p>
          </div>
          <p className="text-xs text-white/40">Plantilla: {FLYER_TEMPLATE_ID}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-xs text-white/50 block mb-1">Categoría</label>
              <input
                value={payload.product.categoryLabel}
                onChange={(e) => updateProduct("categoryLabel", e.target.value)}
                placeholder="PC GAMER"
                className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm focus-brand"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1">Título línea 1</label>
              <input
                value={payload.product.mainTitleLine1}
                onChange={(e) => updateProduct("mainTitleLine1", e.target.value.toUpperCase())}
                placeholder="RYZEN 5"
                className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm focus-brand"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1">Título línea 2</label>
              <input
                value={payload.product.mainTitleLine2}
                onChange={(e) => updateProduct("mainTitleLine2", e.target.value.toUpperCase())}
                placeholder="8400F"
                className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm focus-brand"
              />
            </div>
          </div>
        </section>

        {/* 4. Componentes */}
        <section className="rounded-xl border border-white/10 bg-[#141414] p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="font-medium text-lg">4. Componentes</h3>
              <p className="text-xs text-white/45">Una fila por pieza.</p>
            </div>
            <button
              type="button"
              onClick={addComponent}
              className="text-xs px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 shrink-0"
            >
              + Fila
            </button>
          </div>
          <div className="space-y-3">
            {payload.components.map((comp, i) => (
              <div
                key={i}
                className="grid gap-2 sm:grid-cols-[90px_1fr_1fr_auto] items-start border border-white/5 rounded-lg p-3"
              >
                <select
                  value={comp.icon}
                  onChange={(e) =>
                    updateComponent(i, { icon: e.target.value as FlyerComponentIcon })
                  }
                  className="bg-[#0f0f0f] border border-white/10 rounded-lg px-2 py-2 text-xs"
                >
                  {ICON_OPTIONS.map((ic) => (
                    <option key={ic} value={ic}>
                      {ic}
                    </option>
                  ))}
                </select>
                <input
                  value={comp.label}
                  onChange={(e) => updateComponent(i, { label: e.target.value })}
                  placeholder="PROCESADOR"
                  className="bg-[#0f0f0f] border border-white/10 rounded-lg px-2 py-2 text-xs focus-brand"
                />
                <textarea
                  value={comp.value}
                  onChange={(e) => updateComponent(i, { value: e.target.value })}
                  placeholder="Modelo"
                  rows={2}
                  className="bg-[#0f0f0f] border border-white/10 rounded-lg px-2 py-2 text-xs focus-brand resize-none"
                />
                <button
                  type="button"
                  onClick={() => removeComponent(i)}
                  className="text-xs text-red-300/80 hover:text-red-300 px-2"
                  aria-label="Quitar fila"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </section>

        {error && <p className="text-sm text-red-400">{error}</p>}

        {!openAiConfigured && (
          <p className="text-xs text-white/40 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
            OpenAI no configurado: podés generar igual con la plantilla SVG. Para quitar fondo del
            producto con IA, {openAiStatusMessage ?? "configurá la API Key en Integración API."}
          </p>
        )}
        {lastRenderMethod === "template" && (
          <p className="text-xs text-emerald-300/90 bg-emerald-500/10 border border-emerald-500/25 rounded-lg px-3 py-2">
            Última generación: <strong className="text-white">plantilla SVG TGS</strong>
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={pending}
            className="px-4 py-2 rounded-lg border border-white/10 text-sm hover:bg-white/5 disabled:opacity-50"
          >
            Guardar borrador
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={pending}
            className="btn-primary px-4 py-2 rounded-lg text-sm disabled:opacity-50"
          >
            {pending ? "Generando PNG…" : "Generar PNG 1080×1080"}
          </button>
          {outputPath && (
            <a
              href={outputPath}
              download
              className="px-4 py-2 rounded-lg border border-white/10 text-sm hover:bg-white/5"
            >
              Descargar PNG
            </a>
          )}
        </div>
      </div>

      <aside className="lg:sticky lg:top-6 h-fit space-y-4">
        {styleRefPreview && (
          <div>
            <p className="text-xs text-white/40 mb-2">Referencia de diseño</p>
            <div className="rounded-xl border border-white/10 bg-[#050505] overflow-hidden aspect-square max-h-[200px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={styleRefPreview} alt="" className="w-full h-full object-contain p-2" />
            </div>
          </div>
        )}
        <div>
          <p className="text-xs text-white/40 mb-2">PNG generado</p>
          <div className="aspect-square w-full rounded-xl border border-white/10 bg-[#050505] overflow-hidden">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Flyer" className="w-full h-full object-contain" />
            ) : (
              <div className="flex items-center justify-center h-full text-white/30 text-sm p-6 text-center">
                Elegí producto + textos y generá
              </div>
            )}
          </div>
        </div>
        <p className="text-[11px] text-white/30 text-center">
          Beneficios: {DEFAULT_BENEFITS.map((b) => b.line1).join(" · ")}
        </p>
      </aside>
    </div>
  )
}
