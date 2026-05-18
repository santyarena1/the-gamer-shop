/** Convierte Decimals de Prisma a números para pasar a Client Components */
export function toNumber(value: unknown): number {
  if (value == null) return 0
  return Number(value)
}
