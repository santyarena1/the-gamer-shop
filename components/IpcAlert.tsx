"use client"

import { useActionState } from "react"
import { saveMonthlyIpc } from "@/actions/ipc"
import { MONTHS } from "@/lib/utils"

type Props = {
  month: number
  year: number
  existingPercentage?: number | null
}

export default function IpcAlert({ month, year, existingPercentage }: Props) {
  const [error, action, pending] = useActionState(saveMonthlyIpc, null)
  const needsIpc = existingPercentage == null

  return (
    <div
      className={`rounded-xl border p-5 ${
        needsIpc
          ? "bg-yellow-500/10 border-yellow-500/30"
          : "bg-green-500/10 border-green-500/30"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl">{needsIpc ? "⚠️" : "✓"}</span>
        <div className="flex-1">
          <h3 className="font-semibold text-sm">
            {needsIpc
              ? `IPC de ${MONTHS[month - 1]} ${year} — valor único para todos`
              : `IPC de ${MONTHS[month - 1]} ${year} cargado`}
          </h3>
          <p className="text-xs text-white/50 mt-1">
            {needsIpc
              ? "Cada mes se carga un solo porcentaje de IPC. Aplica a todos los empleados con ajuste por inflación y genera las liquidaciones automáticamente."
              : `IPC registrado: ${existingPercentage}%. Las liquidaciones del mes se generan automáticamente.`}
          </p>

          {needsIpc && (
            <form action={action} className="mt-4 flex flex-wrap items-end gap-3">
              <input type="hidden" name="month" value={month} />
              <input type="hidden" name="year" value={year} />
              <div>
                <label className="text-xs text-white/60 mb-1 block">Porcentaje IPC *</label>
                <input
                  name="percentage"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="Ej: 2.5"
                  className="w-32 bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                />
              </div>
              <button
                type="submit"
                disabled={pending}
                className="px-4 py-2 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black text-sm font-semibold rounded-lg transition-colors"
              >
                {pending ? "Guardando..." : "Guardar IPC del mes"}
              </button>
            </form>
          )}

          {!needsIpc && (
            <form action={action} className="mt-3 flex flex-wrap items-end gap-3">
              <input type="hidden" name="month" value={month} />
              <input type="hidden" name="year" value={year} />
              <div>
                <label className="text-xs text-white/60 mb-1 block">Actualizar IPC (%)</label>
                <input
                  name="percentage"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={existingPercentage}
                  required
                  className="w-32 bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                />
              </div>
              <button
                type="submit"
                disabled={pending}
                className="px-3 py-2 text-xs bg-white/10 hover:bg-white/15 rounded-lg transition-colors"
              >
                {pending ? "..." : "Recalcular sueldos"}
              </button>
            </form>
          )}

          {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
        </div>
      </div>
    </div>
  )
}
