import { XMLParser } from "fast-xml-parser"

export type StockProduct = Record<string, string>

export type StockFeedResult = {
  products: StockProduct[]
  fetchedAt: string
  sourceUrl: string
}

export class StockFeedError extends Error {
  constructor(
    message: string,
    public readonly code: "AUTH" | "PARSE" | "NETWORK" | "EMPTY",
  ) {
    super(message)
    this.name = "StockFeedError"
  }
}

const DEFAULT_BASE_URL = "https://thegamershop.acustock.app"

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  trimValues: true,
  parseTagValue: true,
  isArray: (name) =>
    ["item", "product", "producto", "articulo", "row", "record", "imagen"].includes(
      name.toLowerCase(),
    ),
})

function feedBaseUrl() {
  return process.env.ACUSTOCK_FEED_BASE_URL?.replace(/\/$/, "") ?? DEFAULT_BASE_URL
}

function feedUrl() {
  if (process.env.ACUSTOCK_FEED_URL) return process.env.ACUSTOCK_FEED_URL

  const token = process.env.ACUSTOCK_FEED_TOKEN?.trim()
  if (token) {
    const soloWeb = process.env.ACUSTOCK_FEED_SOLO_WEB ?? "0"
    return `${feedBaseUrl()}/pages/feed.php?token=${encodeURIComponent(token)}&solo_web=${soloWeb}`
  }

  throw new StockFeedError(
    "Falta ACUSTOCK_FEED_TOKEN en .env (token del feed de AcuStock).",
    "AUTH",
  )
}

function isLoginPage(html: string) {
  return (
    html.includes("Iniciar Sesión") ||
    html.includes("login.php") ||
    /<form[^>]+login/i.test(html)
  )
}

async function buildFeedHeaders(): Promise<HeadersInit> {
  const headers: Record<string, string> = {
    Accept: "application/xml, text/xml, */*",
    "User-Agent": "TheGamerShop/1.0",
  }

  if (process.env.ACUSTOCK_FEED_COOKIE) {
    headers.Cookie = process.env.ACUSTOCK_FEED_COOKIE
    return headers
  }

  const user = process.env.ACUSTOCK_FEED_USER
  const pass = process.env.ACUSTOCK_FEED_PASSWORD
  if (user && pass) {
    const sessionCookie = await loginAcustock(user, pass)
    if (sessionCookie) headers.Cookie = sessionCookie
  }

  return headers
}

async function loginAcustock(user: string, pass: string): Promise<string | null> {
  const base = feedBaseUrl()
  const attempts: { path: string; fields: Record<string, string> }[] = [
    { path: "/pages/login", fields: { email: user, password: pass } },
    { path: "/pages/login", fields: { username: user, password: pass } },
    { path: "/pages/login", fields: { usuario: user, password: pass } },
    { path: "/login", fields: { email: user, password: pass } },
  ]

  for (const { path, fields } of attempts) {
    try {
      const res = await fetch(`${base}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(fields),
        redirect: "manual",
        cache: "no-store",
      })

      const setCookies =
        typeof res.headers.getSetCookie === "function"
          ? res.headers.getSetCookie()
          : res.headers.get("set-cookie")
            ? [res.headers.get("set-cookie")!]
            : []
      const cookie = extractSetCookie(setCookies)
      if (cookie && (res.status >= 300 && res.status < 400 || res.ok)) return cookie
    } catch {
      /* try next */
    }
  }

  return null
}

function extractSetCookie(cookies: string[]): string | null {
  const parts = cookies
    .map((c) => c.split(";")[0]?.trim())
    .filter(Boolean)
  return parts.length > 0 ? parts.join("; ") : null
}

function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (value == null) return []
  return Array.isArray(value) ? value : [value]
}

function collectItemArrays(node: unknown, depth = 0): Record<string, unknown>[][] {
  if (node == null || depth > 8) return []

  if (Array.isArray(node)) {
    if (node.length > 0 && typeof node[0] === "object" && node[0] !== null) {
      return [node as Record<string, unknown>[]]
    }
    return node.flatMap((child) => collectItemArrays(child, depth + 1))
  }

  if (typeof node !== "object") return []

  const record = node as Record<string, unknown>
  const arrays: Record<string, unknown>[][] = []

  for (const [key, value] of Object.entries(record)) {
    const lower = key.toLowerCase()
    if (
      [
        "item",
        "product",
        "producto",
        "articulo",
        "row",
        "record",
        "items",
        "imagen",
        "imagenes",
      ].includes(lower)
    ) {
      const items = asArray(value).filter(
        (v): v is Record<string, unknown> => typeof v === "object" && v !== null,
      )
      if (items.length > 0) arrays.push(items)
    }
  }

  if (arrays.length > 0) return arrays

  return Object.values(record).flatMap((child) => collectItemArrays(child, depth + 1))
}

function flattenValue(value: unknown): string {
  if (value == null) return ""
  if (typeof value === "boolean") return value ? "Sí" : "No"
  if (typeof value === "number") return String(value)
  if (typeof value === "string") return value.trim()
  if (Array.isArray(value)) return value.map(flattenValue).filter(Boolean).join(", ")
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>
    if ("#text" in obj) return flattenValue(obj["#text"])
    return Object.entries(obj)
      .map(([k, v]) => {
        const inner = flattenValue(v)
        return inner ? `${k}: ${inner}` : ""
      })
      .filter(Boolean)
      .join(" · ")
  }
  return String(value)
}

function flattenProduct(raw: Record<string, unknown>): StockProduct {
  const out: StockProduct = {}

  function walk(obj: Record<string, unknown>, prefix = "") {
    for (const [key, value] of Object.entries(obj)) {
      if (key.startsWith("@_")) continue
      const fullKey = prefix ? `${prefix}.${key}` : key

      if (value && typeof value === "object" && !Array.isArray(value)) {
        walk(value as Record<string, unknown>, fullKey)
        continue
      }

      const text = flattenValue(value)
      if (text !== "") out[fullKey] = text
    }
  }

  walk(raw)
  return out
}

function parseFeedXml(xml: string): StockProduct[] {
  const trimmed = xml.trim()
  if (!trimmed.startsWith("<")) {
    throw new StockFeedError("La respuesta no es XML válido.", "PARSE")
  }

  let parsed: unknown
  try {
    parsed = parser.parse(trimmed)
  } catch {
    throw new StockFeedError("No se pudo interpretar el XML del feed.", "PARSE")
  }

  const arrays = collectItemArrays(parsed)
  const best = arrays.sort((a, b) => b.length - a.length)[0] ?? []

  if (best.length === 0) {
    throw new StockFeedError("El XML no contiene productos reconocibles.", "EMPTY")
  }

  return best.map(flattenProduct).filter((p) => Object.keys(p).length > 0)
}

export async function fetchStockFeed(): Promise<StockFeedResult> {
  const url = feedUrl()
  let response: Response

  try {
    response = await fetch(url, {
      headers: await buildFeedHeaders(),
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    })
  } catch {
    throw new StockFeedError(
      "No se pudo conectar con AcuStock. Revisá la URL y tu conexión.",
      "NETWORK",
    )
  }

  const text = await response.text()

  if (!response.ok) {
    throw new StockFeedError(
      `AcuStock respondió con error ${response.status}.`,
      "NETWORK",
    )
  }

  if (isLoginPage(text)) {
    throw new StockFeedError(
      "Token de feed inválido o expirado. Revisá ACUSTOCK_FEED_TOKEN en .env.",
      "AUTH",
    )
  }

  const products = parseFeedXml(text)
  if (products.length === 0) {
    throw new StockFeedError("El feed no devolvió productos.", "EMPTY")
  }

  return {
    products,
    fetchedAt: new Date().toISOString(),
    sourceUrl: url,
  }
}
