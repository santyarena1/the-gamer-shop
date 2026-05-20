import Link from "next/link"
import { getCachedBranding, getCachedSession } from "@/lib/server-cache"

type HeaderProps = {
  title: string
  backHref?: string
  backLabel?: string
}

export default async function Header({
  title,
  backHref,
  backLabel = "Volver",
}: HeaderProps) {
  const [session, branding] = await Promise.all([getCachedSession(), getCachedBranding()])

  return (
    <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#0f0f0f]">
      <div className="flex items-center gap-3 min-w-0">
        {backHref && (
          <Link
            href={backHref}
            className="shrink-0 w-9 h-9 rounded-lg border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            aria-label={backLabel}
            title={backLabel}
          >
            ←
          </Link>
        )}
        <h1 className="font-semibold text-lg truncate">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium">{session?.name}</p>
          <p className="text-xs text-white/40">
            {session?.role === "ADMIN" ? "Administrador" : "Empleado"}
          </p>
        </div>
        <div
          className="w-8 h-8 rounded-full bg-brand-muted border border-brand flex items-center justify-center text-brand text-sm font-bold"
          title={branding.shopName}
        >
          {session?.name?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  )
}
