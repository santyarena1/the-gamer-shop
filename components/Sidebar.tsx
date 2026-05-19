"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { logout } from "@/actions/auth"
import BrandLogo from "@/components/BrandLogo"
import type { BrandingSettings } from "@/lib/branding-constants"

type NavEmployee = { id: string; name: string; active: boolean }

type NavItem = { href: string; label: string }

const presupuestosGroup: NavItem[] = [
  { href: "/presupuestos", label: "Foro" },
  { href: "/cotizador", label: "Cotizador" },
]

const configuracionGroup: NavItem[] = [
  { href: "/configuracion", label: "General" },
  { href: "/usuarios", label: "Usuarios" },
]

function isPathActive(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

function isGroupActive(pathname: string, items: NavItem[]) {
  return items.some((item) => isPathActive(pathname, item.href))
}

function NavGroup({
  label,
  icon,
  items,
  pathname,
  pendingHref,
  onNavigate,
}: {
  label: string
  icon: string
  items: NavItem[]
  pathname: string
  pendingHref: string | null
  onNavigate: (href: string) => void
}) {
  const active = isGroupActive(pathname, items)
  const [open, setOpen] = useState(active)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setOpen(active)
  }, [active, pathname])

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
            ? "nav-active"
            : "text-white/60 hover:text-white hover:bg-white/5"
        }`}
      >
        <span className="w-5 text-center">{icon}</span>
        <span className="flex-1 text-left">{label}</span>
        <span className="text-[10px] text-white/40">{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div className="mt-1 ml-2 pl-3 border-l border-white/10 space-y-0.5">
          {items.map((item) => {
            const isCurrent = isPathActive(pathname, item.href)
            const pending = pendingHref === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                onClick={() => {
                  if (!isCurrent) onNavigate(item.href)
                  setOpen(false)
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  isCurrent
                    ? "nav-sub-active"
                    : "text-white/50 hover:text-white hover:bg-white/5"
                } ${pending ? "opacity-50 pointer-events-none" : ""}`}
              >
                <span className="flex-1">{item.label}</span>
                {pending && (
                  <span className="w-3 h-3 border-2 border-brand border-t-[var(--brand-accent)] rounded-full animate-spin shrink-0" />
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function EmployeesNav({
  employees,
  pathname,
  pendingHref,
  onNavigate,
}: {
  employees: NavEmployee[]
  pathname: string
  pendingHref: string | null
  onNavigate: (href: string) => void
}) {
  const active =
    pathname === "/empleados" || pathname.startsWith("/empleados/")

  const [open, setOpen] = useState(active)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setOpen(active)
  }, [active, pathname])

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
            ? "nav-active"
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
            prefetch
            onClick={() => {
              if (pathname !== "/empleados") onNavigate("/empleados")
              setOpen(false)
            }}
            className={`block px-3 py-1.5 rounded-lg text-xs transition-colors ${
              pathname === "/empleados"
                ? "nav-sub-active"
                : "text-white/50 hover:text-white hover:bg-white/5"
            } ${pendingHref === "/empleados" ? "opacity-50 pointer-events-none" : ""}`}
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
                  prefetch
                  onClick={() => {
                    if (!isCurrent) onNavigate(href)
                    setOpen(false)
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    isCurrent
                      ? "nav-sub-active"
                      : emp.active
                        ? "text-white/70 hover:text-white hover:bg-white/5"
                        : "text-white/35 hover:text-white/50 hover:bg-white/5"
                  } ${pendingHref === href ? "opacity-50 pointer-events-none" : ""}`}
                >
                  <span className="w-5 h-5 shrink-0 rounded-full bg-brand-muted border border-brand flex items-center justify-center text-[10px] text-brand font-semibold">
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
  pending,
  onNavigate,
}: {
  href: string
  label: string
  icon: string
  active: boolean
  pending?: boolean
  onNavigate?: (href: string) => void
}) {
  return (
    <Link
      href={href}
      prefetch
      onClick={() => {
        if (!active) onNavigate?.(href)
      }}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
        active
          ? "nav-active"
          : "text-white/60 hover:text-white hover:bg-white/5"
      } ${pending ? "opacity-50 pointer-events-none" : ""}`}
    >
      <span className="w-5 text-center">{icon}</span>
      {label}
      {pending && (
        <span className="ml-auto w-3 h-3 border-2 border-brand border-t-[var(--brand-accent)] rounded-full animate-spin" />
      )}
    </Link>
  )
}

export default function Sidebar({
  role,
  userId,
  employees = [],
  branding,
}: {
  role: string
  userId: string
  employees?: NavEmployee[]
  branding: BrandingSettings
}) {
  const pathname = usePathname()
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  useEffect(() => {
    setPendingHref(null)
  }, [pathname])

  const navProps = {
    pathname,
    pendingHref,
    onNavigate: setPendingHref,
  }

  return (
    <aside className="w-60 bg-[#141414] border-r border-white/10 flex flex-col h-full shrink-0">
      <div className="p-6 border-b border-white/10">
        <BrandLogo branding={branding} size="sm" />
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {role === "ADMIN" ? (
          <>
            <NavLink
              href="/dashboard"
              label="Dashboard"
              icon="▣"
              active={pathname === "/dashboard"}
              pending={pendingHref === "/dashboard"}
              onNavigate={setPendingHref}
            />
            <EmployeesNav employees={employees} {...navProps} />
            <NavGroup label="Presupuestos" icon="💬" items={presupuestosGroup} {...navProps} />
            <NavLink
              href="/productos"
              label="Productos"
              icon="📦"
              active={isPathActive(pathname, "/productos")}
              pending={pendingHref === "/productos"}
              onNavigate={setPendingHref}
            />
            <NavLink
              href="/generador-imagenes"
              label="Generador de imágenes"
              icon="🖼"
              active={isPathActive(pathname, "/generador-imagenes")}
              pending={pendingHref === "/generador-imagenes"}
              onNavigate={setPendingHref}
            />
            <NavLink
              href="/gastos"
              label="Gastos recurrentes"
              icon="🏢"
              active={isPathActive(pathname, "/gastos")}
              pending={pendingHref === "/gastos"}
              onNavigate={setPendingHref}
            />
            <NavGroup label="Configuración" icon="⚙" items={configuracionGroup} {...navProps} />
            <NavLink
              href="/tareas"
              label="Tareas"
              icon="✓"
              active={isPathActive(pathname, "/tareas")}
              pending={pendingHref === "/tareas"}
              onNavigate={setPendingHref}
            />
          </>
        ) : (
          <>
            <NavLink
              href={`/empleados/${userId}`}
              label="Mi perfil"
              icon="👤"
              active={pathname === `/empleados/${userId}`}
              pending={pendingHref === `/empleados/${userId}`}
              onNavigate={setPendingHref}
            />
            <NavGroup label="Presupuestos" icon="💬" items={presupuestosGroup} {...navProps} />
            <NavLink
              href="/productos"
              label="Productos"
              icon="📦"
              active={isPathActive(pathname, "/productos")}
              pending={pendingHref === "/productos"}
              onNavigate={setPendingHref}
            />
            <NavLink
              href="/generador-imagenes"
              label="Generador de imágenes"
              icon="🖼"
              active={isPathActive(pathname, "/generador-imagenes")}
              pending={pendingHref === "/generador-imagenes"}
              onNavigate={setPendingHref}
            />
            <NavLink
              href="/tareas"
              label="Tareas"
              icon="✓"
              active={isPathActive(pathname, "/tareas")}
              pending={pendingHref === "/tareas"}
              onNavigate={setPendingHref}
            />
          </>
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
