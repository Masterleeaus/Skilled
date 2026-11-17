import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 requires a driver adapter. The connection string comes only from the environment.
// It is not checked here, so importing this module never fails; a missing URL surfaces on first query, as before.
export function createPrismaAdapter() {
  return new PrismaPg({ connectionString: process.env.DATABASE_URL });
}
