export default function SidebarSkeleton() {
  return (
    <aside className="w-60 bg-[#141414] border-r border-white/10 flex flex-col h-full shrink-0">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-white/10 animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-3 w-28 bg-white/10 rounded animate-pulse" />
            <div className="h-2 w-20 bg-white/5 rounded animate-pulse" />
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-9 bg-white/5 rounded-lg animate-pulse" />
        ))}
      </nav>
    </aside>
  )
}
