import { getCachedBranding, getCachedSession } from "@/lib/server-cache"

export default async function Header({ title }: { title: string }) {
  const [session, branding] = await Promise.all([getCachedSession(), getCachedBranding()])

  return (
    <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#0f0f0f]">
      <h1 className="font-semibold text-lg">{title}</h1>
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
