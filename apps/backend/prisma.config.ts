import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma 7: the datasource URL lives here, read from the environment only.
// Nothing is hard-coded; commands that need a database fail with Prisma's own error when DATABASE_URL is unset.
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },
});
