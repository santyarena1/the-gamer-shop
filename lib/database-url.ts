/**
 * Arma DATABASE_URL inyectando POSTGRES_PASSWORD cuando la URL no la trae.
 * La URL y la contraseña deben vivir en .env.local (gitignored) para no perderlas en pull/push.
 */
const DEFAULT_DATABASE_URL =
  "postgresql://postgres@127.0.0.1:5432/thegamershop"

export function getDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL?.trim() || DEFAULT_DATABASE_URL

  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return raw
  }

  if (url.password) return raw

  const password = process.env.POSTGRES_PASSWORD
  if (password === undefined || password === "") {
    throw new Error(
      [
        "Falta POSTGRES_PASSWORD en .env.local (no en .env — ese archivo puede cambiar con git pull).",
        "",
        "1. Copiá: copy .env.local.example .env.local",
        "2. Poné tu contraseña de PostgreSQL, o ejecutá como Admin:",
        "   scripts/reset-postgres-password.ps1  → deja devlocal",
        "",
        `Usuario en DATABASE_URL: "${url.username || "postgres"}"`,
        `Base: "${url.pathname.replace(/^\//, "") || "thegamershop"}"`,
      ].join("\n"),
    )
  }

  url.password = password
  return url.toString()
}
