"use client"

import { useState, useTransition } from "react"
import type { PcComponentSlot } from "@/lib/quote-builder-constants"
import { createDocumentWithVariants, savePcBuildTemplate } from "@/actions/quote-builder"
import { computeBuildTotal, searchResultToLineItem, variantFromBase } from "@/lib/quote-builder"
import { DEFAULT_MARKUP_PERCENT } from "@/lib/quote-pricing"
import {
  PC_SLOTS,
  SLOT_LABELS,
  type LineItemInput,
  type SearchProductResult,
} from "@/lib/quote-builder-constants"
import { formatCurrency } from "@/lib/utils"
import BuildSlotGrid from "./BuildSlotGrid"
import ProductSearchCombobox from "./ProductSearchCombobox"

type Template = { id: string; name: string; slotsJson: string }

export default function VariantMatrixWizard({ templates }: { templates: Template[] }) {
  const [step, setStep] = useState(1)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [markupPercent] = useState(DEFAULT_MARKUP_PERCENT)
  const [baseItems, setBaseItems] = useState<LineItemInput[]>([])
  const [varySlot, setVarySlot] = useState<PcComponentSlot | "">("")
  const [alternatives, setAlternatives] = useState<LineItemInput[]>([])
  const [pickSlot, setPickSlot] = useState<PcComponentSlot | null>(null)

  const previews =
    varySlot && alternatives.length > 0
      ? [
          { label: "Base", items: baseItems },
          ...alternatives.map((alt, i) => ({
            label: `Variante ${String.fromCharCode(66 + i)}`,
            items: variantFromBase(baseItems, varySlot, alt),
          })),
        ]
      : []

  function handleAddAlternative(result: SearchProductResult) {
    if (!varySlot) return
    const line = searchResultToLineItem(result, varySlot, markupPercent)
    setAlternatives((prev) => {
      const exists = prev.some((p) => p.sourceRef === line.sourceRef)
      if (exists) return prev
      return [...prev, line]
    })
  }

  function submit() {
    if (!varySlot || alternatives.length === 0) return
    setError(null)
    startTransition(async () => {
      try {
        await createDocumentWithVariants({
          baseItems,
          slot: varySlot,
          variants: alternatives.map((alt) => variantFromBase(baseItems, varySlot, alt)),
        })
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error")
      }
    })
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex gap-2 text-xs">
        {[1, 2, 3].map((s) => (
          <span
            key={s}
            className={`px-3 py-1 rounded-full ${
              step === s ? "bg-green-500/20 text-green-400" : "bg-white/5 text-white/40"
            }`}
          >
            Paso {s}
          </span>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h2 className="font-semibold">Configuración base</h2>
          <p className="text-sm text-white/45">
            El título del documento se arma solo al crear (ej. &quot;Variantes — Placa de
            video (3 configs)&quot;).
          </p>
          {templates.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    try {
                      const items = JSON.parse(t.slotsJson) as LineItemInput[]
                      setBaseItems(items)
                    } catch {
                      /* ignore */
                    }
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10"
                >
                  Plantilla: {t.name}
                </button>
              ))}
            </div>
          )}
          <BuildSlotGrid items={baseItems} onChange={setBaseItems} markupPercent={markupPercent} />
          <div className="flex gap-2">
            <button
              type="button"
              disabled={baseItems.length === 0}
              onClick={() => setStep(2)}
              className="px-4 py-2 text-sm rounded-xl bg-green-500 text-black font-semibold disabled:opacity-50"
            >
              Siguiente
            </button>
            <button
              type="button"
              onClick={() => {
                const name = prompt("Nombre de plantilla")
                if (name) savePcBuildTemplate(name, "", baseItems)
              }}
              className="text-sm px-3 py-2 rounded-xl border border-white/10"
            >
              Guardar como plantilla
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="font-semibold">¿Qué componente varía?</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PC_SLOTS.filter((s) => baseItems.some((i) => i.slot === s.slot)).map(
              ({ slot, label }) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setVarySlot(slot)}
                  className={`px-3 py-2 text-sm rounded-xl border ${
                    varySlot === slot
                      ? "border-green-500/50 bg-green-500/10 text-green-400"
                      : "border-white/10 hover:bg-white/5"
                  }`}
                >
                  {label}
                </button>
              ),
            )}
          </div>
          {varySlot && (
            <>
              <p className="text-sm text-white/50">
                Agregá alternativas para {SLOT_LABELS[varySlot]}
              </p>
              <div className="flex flex-wrap gap-2">
                {alternatives.map((a) => (
                  <span
                    key={a.sourceRef}
                    className="text-xs px-2 py-1 rounded-lg bg-white/5 flex items-center gap-1"
                  >
                    {a.name.slice(0, 40)}…
                    <button
                      type="button"
                      onClick={() =>
                        setAlternatives((p) => p.filter((x) => x.sourceRef !== a.sourceRef))
                      }
                      className="text-white/40 hover:text-red-400"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setPickSlot(varySlot)}
                className="px-4 py-2 text-sm rounded-xl border border-white/10 hover:bg-white/5"
              >
                + Buscar alternativa
              </button>
            </>
          )}
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(1)} className="text-sm px-3 py-2">
              ← Atrás
            </button>
            <button
              type="button"
              disabled={!varySlot || alternatives.length === 0}
              onClick={() => setStep(3)}
              className="px-4 py-2 text-sm rounded-xl bg-green-500 text-black font-semibold disabled:opacity-50"
            >
              Ver preview
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h2 className="font-semibold">Preview de variantes</h2>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-[#1a1a1a]">
                <tr>
                  <th className="text-left px-4 py-2 text-white/50">Config</th>
                  <th className="text-left px-4 py-2 text-white/50">
                    {varySlot ? SLOT_LABELS[varySlot] : ""}
                  </th>
                  <th className="text-right px-4 py-2 text-white/50">Total</th>
                </tr>
              </thead>
              <tbody>
                {previews.map((row) => {
                  const varied = varySlot
                    ? row.items.find((i) => i.slot === varySlot)
                    : null
                  return (
                    <tr key={row.label} className="border-t border-white/5">
                      <td className="px-4 py-3">{row.label}</td>
                      <td className="px-4 py-3 text-white/70 line-clamp-1">
                        {varied?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-right text-green-400 font-medium">
                        {formatCurrency(computeBuildTotal(row.items))}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(2)} className="text-sm px-3 py-2">
              ← Atrás
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={submit}
              className="px-4 py-2 text-sm rounded-xl bg-green-500 text-black font-semibold disabled:opacity-50"
            >
              {pending ? "Creando…" : "Crear presupuesto con variantes"}
            </button>
          </div>
        </div>
      )}

      {pickSlot && (
        <ProductSearchCombobox
          slot={pickSlot}
          markupPercent={markupPercent}
          onSelect={handleAddAlternative}
          onClose={() => setPickSlot(null)}
        />
      )}
    </div>
  )
}
