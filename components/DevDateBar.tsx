"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
import { setDevFakeDate, clearDevFakeDate } from "@/actions/dev-date"
import {
  DEV_DATE_CHANGED_EVENT,
  formatAppDateLabel,
  parseAppDate,
  toDateInputValue,
} from "@/lib/app-date-shared"

type Props = {
  currentIso: string
  isFake: boolean
}

export default function DevDateBar({ currentIso, isFake }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [iso, setIso] = useState(currentIso)

  useEffect(() => {
    setIso(currentIso)
  }, [currentIso])

  const displayDate = formatAppDateLabel(parseAppDate(iso))

  function applyDate(nextIso: string) {
    setIso(nextIso)
    startTransition(async () => {
      await setDevFakeDate(nextIso)
      window.dispatchEvent(new Event(DEV_DATE_CHANGED_EVENT))
      router.refresh()
    })
  }

  function handleReset() {
    startTransition(async () => {
      await clearDevFakeDate()
      window.dispatchEvent(new Event(DEV_DATE_CHANGED_EVENT))
      router.refresh()
    })
  }

  function jumpToFirstOfMonth() {
    const d = parseAppDate(iso)
    applyDate(toDateInputValue(new Date(d.getFullYear(), d.getMonth(), 1)))
  }

  function jumpMonth(delta: number) {
    const d = parseAppDate(iso)
    applyDate(toDateInputValue(new Date(d.getFullYear(), d.getMonth() + delta, 1)))
  }

  const monthYear = parseAppDate(iso).toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric",
  })

  return (
    <div className="shrink-0 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-xs flex-wrap">
        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-medium">
          DEV · Fecha simulada
        </span>
        <span className="text-white/60">{isFake ? displayDate : `Real: ${displayDate}`}</span>
        <span className="text-amber-300/80">· Período sueldos/IPC: {monthYear}</span>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          disabled={pending}
          onClick={() => jumpMonth(-1)}
          className="text-xs px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 disabled:opacity-40"
        >
          ← Mes
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={jumpToFirstOfMonth}
          className="text-xs px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 disabled:opacity-40"
        >
          Día 1
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => jumpMonth(1)}
          className="text-xs px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 disabled:opacity-40"
        >
          Mes →
        </button>
        <input
          type="date"
          value={iso}
          disabled={pending}
          onChange={(e) => applyDate(e.target.value)}
          className="bg-[#0f0f0f] border border-amber-500/30 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-400 disabled:opacity-50"
        />
        <button
          type="button"
          onClick={handleReset}
          disabled={pending || !isFake}
          className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 disabled:opacity-40 transition-colors"
        >
          Fecha real
        </button>
      </div>
    </div>
  )
}
