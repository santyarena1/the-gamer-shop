import { cookies } from "next/headers"
import {
  DEV_FAKE_DATE_COOKIE,
  parseAppDate,
  toDateInputValue,
} from "@/lib/app-date-shared"

export function isDevDateBarEnabled() {
  return process.env.NODE_ENV === "development"
}

export async function getAppDate(): Promise<Date> {
  if (!isDevDateBarEnabled()) return new Date()

  const cookieStore = await cookies()
  const raw = cookieStore.get(DEV_FAKE_DATE_COOKIE)?.value
  return parseAppDate(raw)
}

export async function getAppDateIso(): Promise<string> {
  return toDateInputValue(await getAppDate())
}

export async function isFakeDateActive(): Promise<boolean> {
  if (!isDevDateBarEnabled()) return false
  const cookieStore = await cookies()
  return Boolean(cookieStore.get(DEV_FAKE_DATE_COOKIE)?.value)
}
