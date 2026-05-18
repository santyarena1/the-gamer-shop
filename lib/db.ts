import { PrismaClient } from "@/app/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

/** Bump when cambia prisma/schema.prisma para invalidar el cliente en caché (dev). */
const PRISMA_CLIENT_VERSION = "2026-quotes-forum"

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
  prismaClientVersion?: string
}

function createPrismaClient() {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  })
}

const cached =
  globalForPrisma.prisma &&
  globalForPrisma.prismaClientVersion === PRISMA_CLIENT_VERSION

export const db = cached ? globalForPrisma.prisma! : createPrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db
  globalForPrisma.prismaClientVersion = PRISMA_CLIENT_VERSION
}
