"use client"

import { useActionState } from "react"
import { login } from "@/actions/auth"

export default function LoginForm() {
  const [error, action, pending] = useActionState(login, null)

  return (
    <form action={action} className="space-y-4">
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
        <label className="text-xs text-white/60 mb-1.5 block">Contraseña</label>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full bg-[#0f0f0f] border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-500 transition-colors"
          placeholder="••••••••"
        />
      </div>
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full py-3 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold rounded-xl transition-colors"
      >
        {pending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  )
}
