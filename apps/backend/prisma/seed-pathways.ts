/**
 * Seeds the three role pathways from curriculum/structure/PATHWAYS.json. Idempotent.
 * Run from apps/backend: npx tsx prisma/seed-pathways.ts
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PathwaysFile, seedPathways } from "../src/modules/pathways/pathway.seed";

const source = resolve(__dirname, "../../../curriculum/structure/PATHWAYS.json");
const prisma = new PrismaClient();

async function main() {
  const file = JSON.parse(readFileSync(source, "utf8")) as PathwaysFile;
  const report = await seedPathways(prisma, file);
  console.log(JSON.stringify(report, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
