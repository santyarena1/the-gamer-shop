import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { getDatabaseUrl } from "@/lib/database-url"

/** Bump when cambia prisma/schema.prisma para invalidar el cliente en caché (dev). */
const PRISMA_CLIENT_VERSION = "2026-marketing-purchase-goals-v2"

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
  prismaClientVersion?: string
}

function createPrismaClient() {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: getDatabaseUrl() }),
  })
}

function isClientReady(client: PrismaClient | undefined): client is PrismaClient {
  if (!client) return false
  return typeof client.marketingBrand?.findMany === "function"
}

function getPrismaClient(): PrismaClient {
  const versionOk =
    globalForPrisma.prismaClientVersion === PRISMA_CLIENT_VERSION
  const ready = versionOk && isClientReady(globalForPrisma.prisma)

  if (ready) return globalForPrisma.prisma!

  const client = createPrismaClient()
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client
    globalForPrisma.prismaClientVersion = PRISMA_CLIENT_VERSION
  }
  return client
}

export const db = getPrismaClient()
