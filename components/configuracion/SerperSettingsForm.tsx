"use client"

import { useActionState, useState, useTransition } from "react"
import {
  deleteSerperAction,
  saveSerperAction,
  testSerperAction,
} from "@/actions/serper-settings"
import type { SerperPublicSettings } from "@/lib/serper-integration-types"

type Props = {
  initial: SerperPublicSettings
}

export default function SerperSettingsForm({ initial }: Props) {
  const [state, action, pending] = useActionState(saveSerperAction, null)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(
    null,
  )
  const [testing, startTest] = useTransition()

  return (
    <div className="rounded-xl border border-white/10 bg-[#141414] p-5 space-y-4">
      <div>
        <h3 className="font-medium">Serper (búsqueda de imágenes)</h3>
        <p className="text-xs text-white/50 mt-1">
          Busca fotos de gabinetes o productos en el Generador de imágenes. También podés usar la
          variable <code className="text-white/40">SERPER_API_KEY</code> en .env.
        </p>
      </div>

      {initial.configured && initial.maskedKey && (
        <p className="text-sm text-white/60">
          API Key configurada: <code className="text-brand">{initial.maskedKey}</code>
        </p>
      )}

      <form action={action} className="space-y-3">
        <div>
          <label className="text-xs text-white/50 block mb-1">
            API Key {initial.configured && "(dejar vacío no actualiza — ingresá una nueva para reemplazar)"}
          </label>
          <input
            name="apiKey"
            type="password"
            autoComplete="off"
            placeholder="ede7…"
            className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm font-mono focus-brand"
          />
        </div>
        {state?.error && <p className="text-sm text-red-400">{state.error}</p>}
        {state?.ok && <p className="text-sm text-brand">Configuración guardada</p>}
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={pending}
            className="btn-primary px-4 py-2 rounded-lg text-sm disabled:opacity-50"
          >
            {pending ? "Guardando…" : "Guardar"}
          </button>
          <button
            type="button"
            disabled={testing}
            onClick={() =>
              startTest(async () => {
                setTestResult(await testSerperAction())
              })
            }
            className="px-4 py-2 rounded-lg border border-white/10 text-sm hover:bg-white/5 disabled:opacity-50"
          >
            {testing ? "Probando…" : "Probar conexión"}
          </button>
          {initial.configured && (
            <button
              type="button"
              onClick={() => startTest(async () => await deleteSerperAction())}
              className="px-4 py-2 rounded-lg text-sm text-red-300/80 hover:bg-red-500/10"
            >
              Eliminar token
            </button>
          )}
        </div>
      </form>

      {testResult && (
        <p className={`text-sm ${testResult.success ? "text-brand" : "text-red-400"}`}>
          {testResult.message}
        </p>
      )}
    </div>
  )
}
