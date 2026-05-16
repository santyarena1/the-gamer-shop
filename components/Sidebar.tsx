"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { logout } from "@/actions/auth"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "▣" },
  { href: "/empleados", label: "Empleados", icon: "👥" },
  { href: "/tareas", label: "Tareas", icon: "✓" },
  { href: "/sueldos", label: "Sueldos", icon: "$" },
  { href: "/deudas", label: "Deudas", icon: "⚠" },
  { href: "/compras", label: "Compras", icon: "🛒" },
]

export default function Sidebar({ role }: { role: string }) {
  const pathname = usePathname()

  return (
    <aside className="w-60 bg-[#141414] border-r border-white/10 flex flex-col h-full">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-green-500 flex items-center justify-center text-black font-bold text-sm">
            G
          </div>
          <div>
            <p className="font-semibold text-sm">The Gamer Shop</p>
            <p className="text-xs text-white/40">Panel de Gestión</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-green-500/20 text-green-400 font-medium"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <span className="w-5 text-center">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            <span className="w-5 text-center">⏻</span>
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  )
}
