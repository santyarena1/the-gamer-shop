"use client"

import { useActionState } from "react"
import { resetPassword } from "@/actions/auth"

type Props = {
  onBack: () => void
}

export default function ForgotPasswordForm({ onBack }: Props) {
  const [state, action, pending] = useActionState(resetPassword, null)

  return (
    <form action={action} className="space-y-4">
      <p className="text-white/50 text-sm">
        Ingresá tu email, una contraseña nueva y el código de restablecimiento del servidor.
      </p>
      <div>
        <label className="text-xs text-white/60 mb-1.5 block">Email</label>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full bg-[#0f0f0f] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500 transition-colors"
          placeholder="tu@email.com"
        />
      </div>
      <div>
        <label className="text-xs text-white/60 mb-1.5 block">Nueva contraseña</label>
        <input
          name="password"
          type="password"
          required
          minLength={6}
          className="w-full bg-[#0f0f0f] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500 transition-colors"
          placeholder="Mínimo 6 caracteres"
        />
      </div>
      <div>
        <label className="text-xs text-white/60 mb-1.5 block">Confirmar contraseña</label>
        <input
          name="confirmPassword"
          type="password"
          required
          minLength={6}
          className="w-full bg-[#0f0f0f] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500 transition-colors"
          placeholder="Repetí la contraseña"
        />
      </div>
      <div>
        <label className="text-xs text-white/60 mb-1.5 block">Código de restablecimiento</label>
        <input
          name="resetSecret"
          type="password"
          required
          autoComplete="off"
          className="w-full bg-[#0f0f0f] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500 transition-colors"
          placeholder="PASSWORD_RESET_SECRET"
        />
      </div>
      {state && state !== "ok" && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
          {state}
        </div>
      )}
      {state === "ok" && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-green-400 text-sm">
          Contraseña actualizada. Ya podés iniciar sesión.
        </div>
      )}
      <button
        type="submit"
        disabled={pending || state === "ok"}
        className="w-full py-3 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold rounded-xl transition-colors"
      >
        {pending ? "Guardando..." : "Restablecer contraseña"}
      </button>
      <button
        type="button"
        onClick={onBack}
        className="w-full py-2 text-sm text-white/50 hover:text-white transition-colors"
      >
        Volver al inicio de sesión
      </button>
    </form>
  )
}
