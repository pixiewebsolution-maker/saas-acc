import { PrismaClient } from '@prisma/client'

// SAAS PRODUCTION NOTE:
// To prevent Serverless function connection exhaustion, you MUST use connection pooling.
// If using Prisma Accelerate, install `@prisma/extension-accelerate` and uncomment the extension below.
// If using PgBouncer (e.g., Supabase), ensure your DATABASE_URL appends `?pgbouncer=true&connection_limit=1`.
// See: https://www.prisma.io/docs/guides/performance-and-optimization/connection-management

const prismaClientSingleton = () => {
  return new PrismaClient({
    // Uncomment for detailed query logging in development
    // log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
  // .$extends(withAccelerate()) // If using Prisma Accelerate
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

export const db = globalThis.prismaGlobal ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = db

