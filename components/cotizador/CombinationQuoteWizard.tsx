"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createBatchDocuments } from "@/actions/quote-builder"
import { applyTemplateSlots } from "@/lib/quote-builder"
import { computeBuildTotal } from "@/lib/quote-builder"
import { buildQuoteTitleFromLineItems } from "@/lib/quote-document-title"
import {
  buildQuoteCombinations,
  combinationPreviewLabel,
  countQuoteCombinations,
  MAX_QUOTE_COMBINATIONS,
  type SlotSelections,
} from "@/lib/quote-combinations"
import { PC_SLOTS } from "@/lib/quote-builder-constants"
import {
  applyMarkupToLineItems,
  DEFAULT_MARKUP_PERCENT,
} from "@/lib/quote-pricing"
import { formatCurrency } from "@/lib/utils"
import CombinationSlotGrid from "./CombinationSlotGrid"
import MarkupPercentControl from "./MarkupPercentControl"

type Template = { id: string; name: string; slotsJson: string }

export default function CombinationQuoteWizard({ templates }: { templates: Template[] }) {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [selections, setSelections] = useState<SlotSelections>({})
  const [markupPercent, setMarkupPercent] = useState(DEFAULT_MARKUP_PERCENT)

  function handleMarkupChange(next: number) {
    setMarkupPercent(next)
    setSelections((prev) => {
      const out: SlotSelections = {}
      for (const { slot } of PC_SLOTS) {
        const list = prev[slot]
        if (list?.length) out[slot] = applyMarkupToLineItems(list, next)
      }
      return out
    })
  }

  const comboCount = useMemo(() => countQuoteCombinations(selections), [selections])
  const combinations = useMemo(
    () => buildQuoteCombinations(selections),
    [selections],
  )
  const overLimit = comboCount > MAX_QUOTE_COMBINATIONS

  function loadTemplate(slotsJson: string) {
    const items = applyTemplateSlots(slotsJson)
    const next: SlotSelections = {}
    for (const item of items) {
      const list = next[item.slot] ?? []
      if (!list.some((i) => i.sourceRef === item.sourceRef)) {
        next[item.slot] = [...list, item]
      }
    }
    setSelections(next)
  }

  function submit() {
    setError(null)
    if (combinations.length === 0) {
      setError("Agregá al menos un producto en alguna categoría")
      return
    }
    if (overLimit) {
      setError(`Máximo ${MAX_QUOTE_COMBINATIONS} presupuestos por tanda. Reducí variantes.`)
      return
    }

    startTransition(async () => {
      try {
        await createBatchDocuments(
          combinations.map((lineItems) => ({
            lineItems,
            label: buildQuoteTitleFromLineItems(lineItems),
          })),
          markupPercent,
        )
        router.push("/cotizador")
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al crear presupuestos")
      }
    })
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex gap-2 text-xs">
        <StepBadge n={1} active={step === 1} label="Componentes por categoría" />
        <StepBadge n={2} active={step === 2} label="Preview y crear" />
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div className="rounded-xl border border-white/10 bg-[#141414] px-4 py-3 text-sm text-white/60">
            <p>
              En cada categoría podés agregar <strong className="text-white/90">uno</strong> producto
              (fijo en todos los presupuestos) o <strong className="text-white/90">varios</strong>{" "}
              (genera un presupuesto por cada opción, combinado con el resto).
            </p>
            <p className="mt-2 text-white/45">
              Ejemplo: 1 motherboard + 3 procesadores → <span className="text-green-400">3</span>{" "}
              presupuestos (misma mother, distinto CPU).
            </p>
          </div>

          {templates.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => loadTemplate(t.slotsJson)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10"
                >
                  Plantilla: {t.name}
                </button>
              ))}
            </div>
          )}

          <MarkupPercentControl value={markupPercent} onChange={handleMarkupChange} />
          <CombinationSlotGrid
            selections={selections}
            onChange={setSelections}
            markupPercent={markupPercent}
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-white/50">
              {comboCount === 0 ? (
                "Sin combinaciones todavía"
              ) : overLimit ? (
                <span className="text-red-400">
                  Demasiadas combinaciones ({comboCount}). Máximo {MAX_QUOTE_COMBINATIONS}.
                </span>
              ) : (
                <>
                  Se crearán{" "}
                  <strong className="text-green-400">{comboCount}</strong> presupuesto
                  {comboCount === 1 ? "" : "s"}
                </>
              )}
            </p>
            <button
              type="button"
              disabled={comboCount === 0 || overLimit}
              onClick={() => setStep(2)}
              className="px-4 py-2 text-sm rounded-xl bg-green-500 text-black font-semibold disabled:opacity-50"
            >
              Ver preview →
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h2 className="font-semibold">
            {combinations.length} presupuesto{combinations.length === 1 ? "" : "s"} a crear
          </h2>
          <div className="overflow-x-auto rounded-xl border border-white/10 max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#1a1a1a] sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2 text-white/50 w-10">#</th>
                  <th className="text-left px-4 py-2 text-white/50">Título</th>
                  <th className="text-left px-4 py-2 text-white/50">Componentes</th>
                  <th className="text-right px-4 py-2 text-white/50">Total</th>
                </tr>
              </thead>
              <tbody>
                {combinations.map((items, i) => (
                  <tr key={i} className="border-t border-white/5">
                    <td className="px-4 py-3 text-white/30">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-white/90">
                      {buildQuoteTitleFromLineItems(items)}
                    </td>
                    <td className="px-4 py-3 text-white/50 text-xs max-w-md">
                      {combinationPreviewLabel(items)}
                    </td>
                    <td className="px-4 py-3 text-right text-green-400 font-medium">
                      {formatCurrency(computeBuildTotal(items))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(1)} className="text-sm px-3 py-2">
              ← Ajustar componentes
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={submit}
              className="px-5 py-2.5 text-sm rounded-xl bg-green-500 hover:bg-green-400 text-black font-semibold disabled:opacity-50"
            >
              {pending
                ? "Creando…"
                : `Crear ${combinations.length} presupuesto${combinations.length === 1 ? "" : "s"}`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function StepBadge({
  n,
  active,
  label,
}: {
  n: number
  active: boolean
  label: string
}) {
  return (
    <span
      className={`px-3 py-1 rounded-full ${
        active ? "bg-green-500/20 text-green-400" : "bg-white/5 text-white/40"
      }`}
    >
      {n}. {label}
    </span>
  )
}
