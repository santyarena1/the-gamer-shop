"use client"

import { useActionState, useState, useTransition } from "react"
import {
  deleteOpenAiAction,
  saveOpenAiAction,
  testOpenAiAction,
} from "@/actions/openai-settings"
import type { OpenAiPublicSettings } from "@/lib/openai-integration-types"

type Props = {
  initial: OpenAiPublicSettings
}

export default function OpenAiSettingsForm({ initial }: Props) {
  const [state, action, pending] = useActionState(saveOpenAiAction, null)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(
    null,
  )
  const [testing, startTest] = useTransition()

  return (
    <div className="rounded-xl border border-white/10 bg-[#141414] p-5 space-y-4">
      <div>
        <h3 className="font-medium">OpenAI</h3>
        <p className="text-xs text-white/50 mt-1">
          Quita el fondo blanco de fotos de gabinete/producto en el Generador de imágenes (modelo{" "}
          <code className="text-white/40">gpt-image-1</code>). Si no hay key, se usa recorte local.
        </p>
      </div>

      {initial.configured && initial.maskedKey && (
        <p className="text-sm text-white/60">
          Token configurado: <code className="text-brand">{initial.maskedKey}</code>
        </p>
      )}

      <form action={action} className="space-y-3">
        <div>
          <label className="text-xs text-white/50 block mb-1">
            API Key {initial.configured && "(dejar vacío para mantener la actual)"}
          </label>
          <input
            name="apiKey"
            type="password"
            autoComplete="off"
            placeholder="sk-…"
            className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm font-mono focus-brand"
          />
        </div>
        <div>
          <label className="text-xs text-white/50 block mb-1">Modelo por defecto</label>
          <select
            name="defaultModel"
            defaultValue={initial.defaultModel}
            className="w-full bg-[#0f0f0f] border border-white/10 rounded-lg px-3 py-2 text-sm"
          >
            <option value="gpt-image-1">gpt-image-1</option>
            <option value="dall-e-3">dall-e-3</option>
          </select>
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
                setTestResult(await testOpenAiAction())
              })
            }
            className="px-4 py-2 rounded-lg border border-white/10 text-sm hover:bg-white/5 disabled:opacity-50"
          >
            {testing ? "Probando…" : "Probar conexión"}
          </button>
          {initial.configured && (
            <button
              type="button"
              onClick={() => startTest(async () => await deleteOpenAiAction())}
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
