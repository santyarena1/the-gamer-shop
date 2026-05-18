"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { logout } from "@/actions/auth"

type NavEmployee = { id: string; name: string; active: boolean }

const adminNav = [
  { href: "/dashboard", label: "Dashboard", icon: "▣" },
  { href: "/presupuestos", label: "Presupuestos", icon: "💬" },
  { href: "/gastos", label: "Gastos", icon: "🏢" },
  { href: "/usuarios", label: "Usuarios", icon: "⚙" },
  { href: "/tareas", label: "Tareas", icon: "✓" },
]

const employeeNav = (userId: string) => [
  { href: `/empleados/${userId}`, label: "Mi perfil", icon: "👤" },
  { href: "/presupuestos", label: "Presupuestos", icon: "💬" },
  { href: "/tareas", label: "Tareas", icon: "✓" },
]

function EmployeesNav({
  employees,
  pathname,
}: {
  employees: NavEmployee[]
  pathname: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const active =
    pathname === "/empleados" || pathname.startsWith("/empleados/")

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  return (
    <div ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
          active
            ? "bg-green-500/20 text-green-400 font-medium"
            : "text-white/60 hover:text-white hover:bg-white/5"
        }`}
      >
        <span className="w-5 text-center">👥</span>
        <span className="flex-1 text-left">Empleados</span>
        <span className="text-[10px] text-white/40">{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div className="mt-1 ml-2 pl-3 border-l border-white/10 space-y-0.5 max-h-56 overflow-y-auto">
          <Link
            href="/empleados"
            onClick={() => setOpen(false)}
            className={`block px-3 py-1.5 rounded-lg text-xs transition-colors ${
              pathname === "/empleados"
                ? "bg-green-500/15 text-green-400"
                : "text-white/50 hover:text-white hover:bg-white/5"
            }`}
          >
            Ver todos
          </Link>
          {employees.length === 0 ? (
            <p className="px-3 py-1.5 text-xs text-white/30">Sin empleados</p>
          ) : (
            employees.map((emp) => {
              const href = `/empleados/${emp.id}`
              const isCurrent = pathname === href
              return (
                <Link
                  key={emp.id}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    isCurrent
                      ? "bg-green-500/15 text-green-400"
                      : emp.active
                        ? "text-white/70 hover:text-white hover:bg-white/5"
                        : "text-white/35 hover:text-white/50 hover:bg-white/5"
                  }`}
                >
                  <span className="w-5 h-5 shrink-0 rounded-full bg-green-500/15 border border-green-500/25 flex items-center justify-center text-[10px] text-green-400 font-semibold">
                    {emp.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="truncate">{emp.name}</span>
                  {!emp.active && (
                    <span className="text-[10px] text-white/25 shrink-0">inactivo</span>
                  )}
                </Link>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

function NavLink({
  href,
  label,
  icon,
  active,
}: {
  href: string
  label: string
  icon: string
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
        active
          ? "bg-green-500/20 text-green-400 font-medium"
          : "text-white/60 hover:text-white hover:bg-white/5"
      }`}
    >
      <span className="w-5 text-center">{icon}</span>
      {label}
    </Link>
  )
}

export default function Sidebar({
  role,
  userId,
  employees = [],
}: {
  role: string
  userId: string
  employees?: NavEmployee[]
}) {
  const pathname = usePathname()
  const navItems = role === "ADMIN" ? adminNav : employeeNav(userId)

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
        {role === "ADMIN" ? (
          <>
            <NavLink
              href="/dashboard"
              label="Dashboard"
              icon="▣"
              active={pathname === "/dashboard"}
            />
            <EmployeesNav employees={employees} pathname={pathname} />
            {adminNav.slice(1, -1).map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                icon={item.icon}
                active={pathname.startsWith(item.href)}
              />
            ))}
            <NavLink
              href="/tareas"
              label="Tareas"
              icon="✓"
              active={pathname.startsWith("/tareas")}
            />
          </>
        ) : (
          navItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={pathname.startsWith(item.href)}
            />
          ))
        )}
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
