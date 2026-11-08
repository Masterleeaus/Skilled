/**
 * Loads server-side knowledge-check answer keys for every PUBLISHED lesson revision (PASS43).
 * Keys come from curriculum/assessments/<sourceId>.assessment.json, matched by lesson ID and check ID.
 * Checks with no key are refused and reported, never guessed. Idempotent (upsert on revisionId + checkId).
 *
 * Run from apps/backend with DATABASE_URL set in the environment: npx tsx prisma/load-knowledge-answer-keys.ts
 * Prints counts and check IDs only. It never prints a key, a rationale or a connection string.
 */
import { PrismaClient } from "@prisma/client";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { knowledgeCheckList, planAnswerKeys, readAssessmentKeys, type AnswerKey } from "../src/modules/curriculum/knowledge-answer-keys";

const assessmentsDir = resolve(__dirname, "../../../curriculum/assessments");
const prisma = new PrismaClient();

async function main() {
  const revisions = await prisma.academyLessonRevision.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true, body: true, lesson: { select: { sourceId: true } } },
    orderBy: [{ lesson: { sourceId: "asc" } }, { version: "asc" }],
  });

  const summary = { revisions: revisions.length, withChecks: 0, checks: 0, keysLoaded: 0, checksRefused: 0, revisionsWithRefusals: 0 };
  const refusedIds: string[] = [];
  const badFiles: string[] = [];
  const assessmentCache = new Map<string, Map<string, AnswerKey> | null>();

  for (const revision of revisions) {
    const sourceId = revision.lesson.sourceId;
    const checks = knowledgeCheckList(revision.body);
    if (checks.length === 0) continue;
    summary.withChecks += 1;
    summary.checks += checks.length;

    if (!assessmentCache.has(sourceId)) {
      const file = resolve(assessmentsDir, `${sourceId}.assessment.json`);
      if (!existsSync(file)) {
        assessmentCache.set(sourceId, null);
      } else {
        try {
          assessmentCache.set(sourceId, readAssessmentKeys(JSON.parse(readFileSync(file, "utf8")), sourceId));
        } catch (error) {
          badFiles.push(`${sourceId}: ${(error as Error).message}`);
          assessmentCache.set(sourceId, null);
        }
      }
    }

    const plan = planAnswerKeys(revision.body, assessmentCache.get(sourceId) ?? null);
    for (const key of plan.keys) {
      await prisma.academyKnowledgeAnswerKey.upsert({
        where: { revisionId_checkId: { revisionId: revision.id, checkId: key.checkId } },
        create: { revisionId: revision.id, checkId: key.checkId, correctIndex: key.correctIndex, rationale: key.rationale },
        update: { correctIndex: key.correctIndex, rationale: key.rationale },
      });
    }
    summary.keysLoaded += plan.keys.length;
    if (plan.refused.length > 0) {
      summary.revisionsWithRefusals += 1;
      summary.checksRefused += plan.refused.length;
      for (const refusal of plan.refused) refusedIds.push(`${sourceId} ${refusal.checkId ?? "(no id)"}: ${refusal.reason}`);
    }
  }

  console.log(JSON.stringify(summary, null, 2));
  if (badFiles.length) console.log(`Assessment files refused (malformed):\n${badFiles.join("\n")}`);
  if (refusedIds.length) console.log(`Checks refused (no key loaded):\n${refusedIds.join("\n")}`);
}

main()
  .catch((error) => {
    console.error("Key load failed:", (error as Error).message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
