"use client"

import { useActionState } from "react"
import {
  createQuoteQuickButton,
  updateQuoteQuickButton,
  deleteQuoteQuickButton,
} from "@/actions/quotes"
import { QUOTE_BUTTON_VARIANTS, QUOTE_VARIANT_OPTIONS, type QuickButton } from "@/lib/quote-constants"

export default function QuickButtonsSettings({ buttons }: { buttons: QuickButton[] }) {
  const [createError, createAction] = useActionState(createQuoteQuickButton, null)
  const [, updateAction] = useActionState(updateQuoteQuickButton, null)

  return (
    <div className="bg-[#141414] border border-white/10 rounded-xl p-4 space-y-4">
      <div>
        <p className="text-sm font-medium">Botones rápidos</p>
        <p className="text-xs text-white/40 mt-0.5">
          Aparecen en cada hilo para marcar estado con un clic (enviado, revisar, etc.).
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {buttons.map((b) => (
          <span
            key={b.id}
            className={`text-xs px-3 py-1.5 rounded-lg ${
              QUOTE_BUTTON_VARIANTS[b.variant]?.button ?? QUOTE_BUTTON_VARIANTS.default.button
            }`}
          >
            {b.label}
          </span>
        ))}
      </div>

      <div className="space-y-2">
        {buttons.map((b) => (
          <form
            key={b.id}
            action={updateAction}
            className="flex flex-wrap items-end gap-2 p-2 rounded-lg bg-[#0f0f0f] border border-white/5"
          >
            <input type="hidden" name="id" value={b.id} />
            <div className="flex-1 min-w-[120px]">
              <label className="text-[10px] text-white/40 block mb-0.5">Texto</label>
              <input
                name="label"
                defaultValue={b.label}
                className="w-full bg-[#141414] border border-white/10 rounded px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] text-white/40 block mb-0.5">Color</label>
              <select
                name="variant"
                defaultValue={b.variant}
                className="bg-[#141414] border border-white/10 rounded px-2 py-1 text-sm"
              >
                {QUOTE_VARIANT_OPTIONS.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-1 text-xs pb-1">
              <input type="hidden" name="active" value="false" />
              <input type="checkbox" name="active" value="true" defaultChecked={b.active} />
              Activo
            </label>
            <button type="submit" className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/15">
              Guardar
            </button>
            <button
              type="button"
              onClick={() => void deleteQuoteQuickButton(b.id)}
              className="text-xs px-2 py-1 rounded bg-red-500/10 text-red-400"
            >
              ✕
            </button>
          </form>
        ))}
      </div>

      <form action={createAction} className="flex flex-wrap items-end gap-2 pt-2 border-t border-white/10">
        <div className="flex-1 min-w-[140px]">
          <label className="text-[10px] text-white/40 block mb-0.5">Nuevo botón</label>
          <input
            name="label"
            required
            placeholder="Ej. Cotizado"
            className="w-full bg-[#0f0f0f] border border-white/10 rounded px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="text-[10px] text-white/40 block mb-0.5">Color</label>
          <select name="variant" defaultValue="green" className="bg-[#0f0f0f] border border-white/10 rounded px-2 py-1.5 text-sm">
            {QUOTE_VARIANT_OPTIONS.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="text-xs px-3 py-1.5 rounded-lg bg-green-500/20 text-green-400">
          + Agregar
        </button>
      </form>
      {createError && <p className="text-red-400 text-xs">{createError}</p>}
    </div>
  )
}
