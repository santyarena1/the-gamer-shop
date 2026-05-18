"use client"

import { useCallback, useEffect, useState } from "react"
import {
  DEV_DATE_CHANGED_EVENT,
  DEV_FAKE_DATE_COOKIE,
  parseAppDate,
  toDateInputValue,
} from "@/lib/app-date-shared"

function readFakeDateFromCookie(): Date | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${DEV_FAKE_DATE_COOKIE}=([^;]*)`))
  if (!match?.[1]) return null
  return parseAppDate(decodeURIComponent(match[1]))
}

export function useAppDate() {
  const [date, setDate] = useState(() => readFakeDateFromCookie() ?? new Date())
  const [isFake, setIsFake] = useState(() => readFakeDateFromCookie() != null)

  const sync = useCallback(() => {
    const fake = readFakeDateFromCookie()
    setDate(fake ?? new Date())
    setIsFake(fake != null)
  }, [])

  useEffect(() => {
    sync()
    window.addEventListener(DEV_DATE_CHANGED_EVENT, sync)
    return () => window.removeEventListener(DEV_DATE_CHANGED_EVENT, sync)
  }, [sync])

  return {
    date,
    iso: toDateInputValue(date),
    isFake,
  }
}
