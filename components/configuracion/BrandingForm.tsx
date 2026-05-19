"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  resetBrandingAction,
  updateBrandingAction,
  uploadBrandingLogoAction,
} from "@/actions/branding"
import { DEFAULT_BRANDING, type BrandingSettings } from "@/lib/branding-constants"
import BrandLogo from "@/components/BrandLogo"

type Props = {
  initial: BrandingSettings
}

export default function BrandingForm({ initial }: Props) {
  const router = useRouter()
  const [preview, setPreview] = useState(initial)
  const [saved, setSaved] = useState(false)
  const updateWasPending = useRef(false)
  const uploadWasPending = useRef(false)
  const [updateState, updateAction, updatePending] = useActionState(updateBrandingAction, null)
  const [uploadState, uploadAction, uploadPending] = useActionState(uploadBrandingLogoAction, null)

  useEffect(() => {
    setPreview(initial)
  }, [initial])

  useEffect(() => {
    if (updatePending) updateWasPending.current = true
    if (!updatePending && updateWasPending.current) {
      updateWasPending.current = false
      if (updateState === null) {
        setSaved(true)
        router.refresh()
        const t = setTimeout(() => setSaved(false), 3000)
        return () => clearTimeout(t)
      }
    }
    if (updateState) setSaved(false)
  }, [updateState, updatePending, router])

  useEffect(() => {
    if (uploadPending) uploadWasPending.current = true
    if (!uploadPending && uploadWasPending.current && uploadState === null) {
      uploadWasPending.current = false
      router.refresh()
    }
  }, [uploadState, uploadPending, router])

  function handleColorChange(value: string) {
    setPreview((p) => ({ ...p, accentColor: value }))
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/10 bg-[#141414] p-4">
        <p className="text-xs text-white/40 mb-3">Vista previa</p>
        <div className="flex flex-wrap items-center gap-4">
          <BrandLogo branding={preview} size="md" />
          <button type="button" className="btn-primary px-4 py-2 rounded-lg text-sm">
            Botón primario
          </button>
          <span className="text-brand text-sm font-medium">Texto acento</span>
        </div>
      </div>

      <form
        action={updateAction}
        className="space-y-4 rounded-xl border border-white/10 bg-[#141414] p-5"
      >
        <h3 className="font-medium">Identidad visual</h3>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-xs text-white/50 mb-1 block">Nombre del negocio</label>
            <input
              name="shopName"
              defaultValue={initial.shopName}
              required
              className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm focus-brand"
              onChange={(e) => setPreview((p) => ({ ...p, shopName: e.target.value }))}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-white/50 mb-1 block">Subtítulo</label>
            <input
              name="tagline"
              defaultValue={initial.tagline}
              required
              className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm focus-brand"
              onChange={(e) => setPreview((p) => ({ ...p, tagline: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">Color de acento</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={preview.accentColor}
                onChange={(e) => handleColorChange(e.target.value)}
                className="h-10 w-14 rounded-lg border border-white/10 bg-[#0f0f0f] cursor-pointer"
              />
              <input
                name="accentColor"
                value={preview.accentColor}
                onChange={(e) => handleColorChange(e.target.value)}
                pattern="^#[0-9A-Fa-f]{6}$"
                required
                className="flex-1 bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm font-mono focus-brand"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1 block">URL del logo (opcional)</label>
            <input
              name="logoUrl"
              type="url"
              defaultValue={initial.logoUrl ?? ""}
              placeholder="https://…"
              className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm focus-brand"
              onChange={(e) =>
                setPreview((p) => ({ ...p, logoUrl: e.target.value.trim() || null }))
              }
            />
          </div>
        </div>

        {updateState && <p className="text-sm text-red-400">{updateState}</p>}
        {saved && !updateState && <p className="text-sm text-brand">Cambios guardados</p>}

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="submit"
            disabled={updatePending}
            className="btn-primary px-4 py-2 rounded-lg text-sm disabled:opacity-50"
          >
            {updatePending ? "Guardando…" : "Guardar apariencia"}
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-lg text-sm border border-white/10 hover:bg-white/5"
            onClick={async () => {
              await resetBrandingAction()
              setPreview(DEFAULT_BRANDING)
              router.refresh()
            }}
          >
            Restaurar valores
          </button>
        </div>
      </form>

      <form
        action={uploadAction}
        className="space-y-4 rounded-xl border border-white/10 bg-[#141414] p-5"
      >
        <h3 className="font-medium">Subir logo</h3>
        <p className="text-xs text-white/50">
          PNG, JPG, WebP o SVG. Máximo 2 MB. Reemplaza el logo del menú y del login.
        </p>
        {initial.logoUrl && (
          <div className="flex items-center gap-3">
            <Image
              src={initial.logoUrl}
              alt="Logo actual"
              width={48}
              height={48}
              className="h-12 w-12 object-contain rounded-lg bg-white/5"
              unoptimized
            />
            <span className="text-xs text-white/40 truncate">{initial.logoUrl}</span>
          </div>
        )}
        <input
          name="logo"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="block w-full text-sm text-white/60 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-brand file:text-black file:font-medium"
        />
        {uploadState && <p className="text-sm text-red-400">{uploadState}</p>}
        <button
          type="submit"
          disabled={uploadPending}
          className="btn-primary px-4 py-2 rounded-lg text-sm disabled:opacity-50"
        >
          {uploadPending ? "Subiendo…" : "Subir logo"}
        </button>
      </form>
    </div>
  )
}
