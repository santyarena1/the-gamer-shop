"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  generateFlyerPng,
  removeFlyerCaseBackground,
  saveFlyerDraft,
  uploadFlyerCaseImage,
} from "@/actions/flyer"
import type { BackgroundRemovalMethod } from "@/lib/flyer/process-case-image"
import ReferenceImageSearch from "@/components/generador-imagenes/ReferenceImageSearch"
import {
  DEFAULT_BENEFITS,
  FLYER_TEMPLATE_ID,
  type FlyerComponent,
  type FlyerComponentIcon,
  type FlyerPayload,
} from "@/lib/flyer/types"

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
  quoteDocumentId?: string | null
  serperConfigured?: boolean
  openAiConfigured?: boolean
}

export default function FlyerEditor({
  flyerId: initialFlyerId,
  initialPayload,
  outputPath: initialOutput,
  caseImagePath,
  quoteDocumentId,
  serperConfigured = false,
  openAiConfigured = false,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [removeBackground, setRemoveBackground] = useState(true)
  const [bgStatus, setBgStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [flyerId, setFlyerId] = useState(initialFlyerId)
  const [payload, setPayload] = useState<FlyerPayload>(initialPayload)
  const [outputPath, setOutputPath] = useState(initialOutput ?? null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialOutput ?? null)

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
      components: [
        ...p.components,
        { icon: "other", label: "COMPONENTE", value: "" },
      ],
    }))
  }

  function removeComponent(index: number) {
    setPayload((p) => ({
      ...p,
      components: p.components.filter((_, i) => i !== index),
    }))
  }

  function bgMethodLabel(method: BackgroundRemovalMethod): string {
    if (method === "openai") return "Fondo quitado con OpenAI"
    if (method === "sharp") return "Fondo blanco recortado (modo local)"
    return ""
  }

  async function ensureFlyerId(): Promise<string> {
    if (flyerId) return flyerId
    const id = await saveFlyerDraft(null, { payload, quoteDocumentId })
    setFlyerId(id)
    router.replace(`/generador-imagenes/${id}`)
    return id
  }

  function handleCaseUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setBgStatus(null)
    startTransition(async () => {
      try {
        const id = await ensureFlyerId()
        const fd = new FormData()
        fd.set("caseImage", file)
        const result = await uploadFlyerCaseImage(id, fd, removeBackground)
        if (result) {
          updateProduct("pcImageBase64", result.dataUri)
          setBgStatus(bgMethodLabel(result.method))
        }
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al subir")
      }
    })
  }

  function handleRemoveBackground() {
    if (!payload.product.pcImageBase64) {
      setError("Cargá una imagen primero")
      return
    }
    setError(null)
    setBgStatus(null)
    startTransition(async () => {
      try {
        const id = await ensureFlyerId()
        const { dataUri, method } = await removeFlyerCaseBackground(id)
        updateProduct("pcImageBase64", dataUri)
        setBgStatus(bgMethodLabel(method))
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo quitar el fondo")
      }
    })
  }

  function handleGenerate() {
    setError(null)
    startTransition(async () => {
      try {
        const id = await ensureFlyerId()
        await saveFlyerDraft(id, { payload, quoteDocumentId })
        const path = await generateFlyerPng(id)
        setOutputPath(path)
        setPreviewUrl(`${path}?t=${Date.now()}`)
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
        const id = await saveFlyerDraft(flyerId ?? null, { payload, quoteDocumentId })
        setFlyerId(id)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al guardar")
      }
    })
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
      <div className="space-y-6">
        <section className="rounded-xl border border-white/10 bg-[#141414] p-5 space-y-4">
          <h3 className="font-medium">Datos principales</h3>
          <p className="text-xs text-white/40">Plantilla: {FLYER_TEMPLATE_ID}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-xs text-white/50 block mb-1">Categoría</label>
              <input
                value={payload.product.categoryLabel}
                onChange={(e) => updateProduct("categoryLabel", e.target.value)}
                className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm focus-brand"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1">Título línea 1</label>
              <input
                value={payload.product.mainTitleLine1}
                onChange={(e) => updateProduct("mainTitleLine1", e.target.value.toUpperCase())}
                className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm focus-brand"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1">Título línea 2</label>
              <input
                value={payload.product.mainTitleLine2}
                onChange={(e) => updateProduct("mainTitleLine2", e.target.value.toUpperCase())}
                className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm focus-brand"
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-[#141414] p-5 space-y-3">
          <h3 className="font-medium">Imagen del gabinete / producto</h3>
          {caseImagePath && (
            <p className="text-xs text-white/40 truncate">Actual: {caseImagePath}</p>
          )}
          {payload.product.pcImageBase64 && (
            <div className="w-32 h-32 rounded-lg border border-white/10 overflow-hidden bg-[#0a0a0a]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={payload.product.pcImageBase64}
                alt="Referencia actual"
                className="w-full h-full object-contain"
              />
            </div>
          )}
          <label className="flex items-center gap-2 text-xs text-white/60 cursor-pointer">
            <input
              type="checkbox"
              checked={removeBackground}
              onChange={(e) => setRemoveBackground(e.target.checked)}
              className="rounded border-white/20"
            />
            Quitar fondo al cargar
            {openAiConfigured ? (
              <span className="text-white/35">(OpenAI + respaldo local)</span>
            ) : (
              <span className="text-white/35">(recorte de fondo blanco local)</span>
            )}
          </label>

          <ReferenceImageSearch
            payload={payload}
            flyerId={flyerId}
            serperConfigured={serperConfigured}
            removeBackground={removeBackground}
            ensureFlyerId={ensureFlyerId}
            onImageApplied={(dataUri, method) => {
              updateProduct("pcImageBase64", dataUri)
              setBgStatus(bgMethodLabel(method))
            }}
            onError={setError}
          />

          {payload.product.pcImageBase64 && (
            <button
              type="button"
              onClick={handleRemoveBackground}
              disabled={pending}
              className="text-xs px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-50"
            >
              {pending ? "Procesando…" : "Quitar fondo de la imagen actual"}
            </button>
          )}

          {bgStatus && <p className="text-xs text-brand">{bgStatus}</p>}

          <input
            type="file"
            accept="image/*"
            onChange={handleCaseUpload}
            className="block w-full text-sm text-white/60 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-brand file:text-black file:font-medium"
          />
          <p className="text-xs text-white/30">
            Las fotos de catálogo suelen tener fondo blanco: activá &quot;Quitar fondo&quot; para
            PNG transparente. Con OpenAI en Configuración el resultado es más limpio. Máx. 5 MB.
          </p>
        </section>

        <section className="rounded-xl border border-white/10 bg-[#141414] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Componentes</h3>
            <button
              type="button"
              onClick={addComponent}
              className="text-xs px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10"
            >
              + Agregar
            </button>
          </div>
          <div className="space-y-3">
            {payload.components.map((comp, i) => (
              <div
                key={i}
                className="grid gap-2 sm:grid-cols-[100px_1fr_1fr_auto] items-start border border-white/5 rounded-lg p-3"
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
                  placeholder="Etiqueta"
                  className="bg-[#0f0f0f] border border-white/10 rounded-lg px-2 py-2 text-xs focus-brand"
                />
                <textarea
                  value={comp.value}
                  onChange={(e) => updateComponent(i, { value: e.target.value })}
                  placeholder="Valor"
                  rows={2}
                  className="bg-[#0f0f0f] border border-white/10 rounded-lg px-2 py-2 text-xs focus-brand resize-none"
                />
                <button
                  type="button"
                  onClick={() => removeComponent(i)}
                  className="text-xs text-red-300/80 hover:text-red-300 px-2"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </section>

        {error && <p className="text-sm text-red-400">{error}</p>}

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
            {pending ? "Generando…" : "Generar PNG 1080×1080"}
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

      <aside className="lg:sticky lg:top-6 h-fit">
        <p className="text-xs text-white/40 mb-2">Vista previa</p>
        <div className="aspect-square w-full max-w-[400px] mx-auto rounded-xl border border-white/10 bg-[#050505] overflow-hidden">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Preview flyer"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-white/30 text-sm p-4 text-center">
              Generá la imagen para ver el resultado
            </div>
          )}
        </div>
        <p className="text-[11px] text-white/30 mt-2 text-center">
          Beneficios fijos: {DEFAULT_BENEFITS.map((b) => b.line1).join(" · ")}
        </p>
      </aside>
    </div>
  )
}
