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

const marketingGroup: NavItem[] = [
  { href: "/marketing/objetivos-compra", label: "Objetivos de compra" },
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
  collapsed,
  onExpand,
}: {
  label: string
  icon: string
  items: NavItem[]
  pathname: string
  pendingHref: string | null
  onNavigate: (href: string) => void
  collapsed: boolean
  onExpand: () => void
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

  if (collapsed) {
    return (
      <button
        type="button"
        title={label}
        onClick={onExpand}
        className={`w-full flex items-center justify-center py-2 rounded-lg transition-colors ${
          active ? "nav-active" : "text-white/60 hover:text-white hover:bg-white/5"
        }`}
      >
        <span className="text-base">{icon}</span>
      </button>
    )
  }

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
  collapsed,
  onExpand,
}: {
  employees: NavEmployee[]
  pathname: string
  pendingHref: string | null
  onNavigate: (href: string) => void
  collapsed: boolean
  onExpand: () => void
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

  if (collapsed) {
    return (
      <button
        type="button"
        title="Empleados"
        onClick={onExpand}
        className={`w-full flex items-center justify-center py-2 rounded-lg transition-colors ${
          active ? "nav-active" : "text-white/60 hover:text-white hover:bg-white/5"
        }`}
      >
        <span className="text-base">👥</span>
      </button>
    )
  }

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
  collapsed,
}: {
  href: string
  label: string
  icon: string
  active: boolean
  pending?: boolean
  onNavigate?: (href: string) => void
  collapsed?: boolean
}) {
  if (collapsed) {
    return (
      <Link
        href={href}
        prefetch
        title={label}
        onClick={() => {
          if (!active) onNavigate?.(href)
        }}
        className={`flex items-center justify-center py-2 rounded-lg transition-colors ${
          active ? "nav-active" : "text-white/60 hover:text-white hover:bg-white/5"
        } ${pending ? "opacity-50 pointer-events-none" : ""}`}
      >
        <span className="text-base">{icon}</span>
      </Link>
    )
  }

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
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    setPendingHref(null)
  }, [pathname])

  const navProps = {
    pathname,
    pendingHref,
    onNavigate: setPendingHref,
    collapsed,
    onExpand: () => setCollapsed(false),
  }

  return (
    <aside className={`${collapsed ? "w-12" : "w-60"} bg-[#141414] border-r border-white/10 flex flex-col h-full shrink-0 transition-all duration-200`}>
      <div className={`border-b border-white/10 flex items-center ${collapsed ? "justify-center p-3" : "p-4 gap-2"}`}>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <BrandLogo branding={branding} size="sm" />
          </div>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? "Expandir menú" : "Colapsar menú"}
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-white/40 hover:text-white hover:bg-white/5 transition-colors text-xs"
        >
          {collapsed ? "›" : "‹"}
        </button>
      </div>

      <nav className={`flex-1 overflow-y-auto space-y-0.5 ${collapsed ? "p-1.5" : "p-4 space-y-1"}`}>
        {role === "ADMIN" ? (
          <>
            <NavLink
              href="/dashboard"
              label="Dashboard"
              icon="▣"
              active={pathname === "/dashboard"}
              pending={pendingHref === "/dashboard"}
              onNavigate={setPendingHref}
              collapsed={collapsed}
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
              collapsed={collapsed}
            />
            <NavLink
              href="/generador-imagenes"
              label="Generador de imágenes"
              icon="🖼"
              active={isPathActive(pathname, "/generador-imagenes")}
              pending={pendingHref === "/generador-imagenes"}
              onNavigate={setPendingHref}
              collapsed={collapsed}
            />
            <NavLink
              href="/gastos"
              label="Gastos recurrentes"
              icon="🏢"
              active={isPathActive(pathname, "/gastos")}
              pending={pendingHref === "/gastos"}
              onNavigate={setPendingHref}
              collapsed={collapsed}
            />
            <NavGroup label="Marketing" icon="📣" items={marketingGroup} {...navProps} />
            <NavGroup label="Configuración" icon="⚙" items={configuracionGroup} {...navProps} />
            <NavLink
              href="/tareas"
              label="Tareas"
              icon="✓"
              active={isPathActive(pathname, "/tareas")}
              pending={pendingHref === "/tareas"}
              onNavigate={setPendingHref}
              collapsed={collapsed}
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
              collapsed={collapsed}
            />
            <NavGroup label="Presupuestos" icon="💬" items={presupuestosGroup} {...navProps} />
            <NavLink
              href="/productos"
              label="Productos"
              icon="📦"
              active={isPathActive(pathname, "/productos")}
              pending={pendingHref === "/productos"}
              onNavigate={setPendingHref}
              collapsed={collapsed}
            />
            <NavLink
              href="/generador-imagenes"
              label="Generador de imágenes"
              icon="🖼"
              active={isPathActive(pathname, "/generador-imagenes")}
              pending={pendingHref === "/generador-imagenes"}
              onNavigate={setPendingHref}
              collapsed={collapsed}
            />
            <NavLink
              href="/tareas"
              label="Tareas"
              icon="✓"
              active={isPathActive(pathname, "/tareas")}
              pending={pendingHref === "/tareas"}
              onNavigate={setPendingHref}
              collapsed={collapsed}
            />
          </>
        )}
      </nav>

      <div className={`border-t border-white/10 ${collapsed ? "p-1.5" : "p-4"}`}>
        <form action={logout}>
          <button
            type="submit"
            title="Cerrar sesión"
            className={`w-full flex items-center rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors ${
              collapsed ? "justify-center py-2" : "gap-3 px-3 py-2"
            }`}
          >
            <span className={collapsed ? "text-base" : "w-5 text-center"}>⏻</span>
            {!collapsed && "Cerrar sesión"}
          </button>
        </form>
      </div>
    </aside>
  )
}
