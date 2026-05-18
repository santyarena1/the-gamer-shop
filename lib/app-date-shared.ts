export const DEV_FAKE_DATE_COOKIE = "dev-fake-date"
export const DEV_DATE_CHANGED_EVENT = "dev-date-changed"

/** Parsea YYYY-MM-DD en hora local (evita desfase de mes por UTC). */
export function parseAppDate(iso?: string | null): Date {
  if (!iso) return new Date()
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match) return new Date()
  const year = Number(match[1])
  const month = Number(match[2]) - 1
  const day = Number(match[3])
  const d = new Date(year, month, day, 12, 0, 0, 0)
  return isNaN(d.getTime()) ? new Date() : d
}

export function toDateInputValue(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function isPastDue(dueDate: Date | string, today: Date): boolean {
  return startOfDay(new Date(dueDate)) < startOfDay(today)
}

export function formatAppDateLabel(date: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date)
}
