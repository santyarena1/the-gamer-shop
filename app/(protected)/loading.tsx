export default function ProtectedLoading() {
  return (
    <div className="flex-1 overflow-auto p-6 animate-pulse">
      <div className="h-8 w-48 bg-white/10 rounded-lg mb-6" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-16 bg-white/5 rounded-xl border border-white/10" />
        ))}
      </div>
    </div>
  )
}
