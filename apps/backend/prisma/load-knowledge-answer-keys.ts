/**
 * Loads server-side knowledge-check answer keys for every PUBLISHED lesson revision (PASS43).
 * Keys come from curriculum/assessments/<sourceId>.assessment.json, matched by lesson ID and check ID.
 * Checks with no key are refused and reported, never guessed. Idempotent (upsert on revisionId + checkId).
 *
 * Approval gate (issue #16): a file's keys are loaded only when curriculum/assessment-publication-approvals.json
 * (or ACADEMY_ASSESSMENT_APPROVALS) holds an approved record whose sha256 matches the file's exact bytes, the same
 * rule the curriculum publisher enforces. An unapproved or stale file loads no keys and every check is refused.
 *
 * Run from apps/backend with DATABASE_URL set in the environment: npx tsx prisma/load-knowledge-answer-keys.ts
 * Prints counts and check IDs only. It never prints a key, a rationale or a connection string.
 */
import { PrismaClient } from "@prisma/client";
import { existsSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { knowledgeCheckList, planAnswerKeys, readAssessmentKeys, type AnswerKey } from "../src/modules/curriculum/knowledge-answer-keys";
import { approvalProblem, parseApprovalRecords, type ApprovalRecords } from "../src/modules/curriculum/assessment-approval";

const curriculumRoot = resolve(__dirname, "../../../curriculum");
const assessmentsDir = resolve(curriculumRoot, "assessments");
const prisma = new PrismaClient();

/** Keys for one lesson file, or the reason the file is held. A held file loads no keys. */
interface AssessmentState { keys: Map<string, AnswerKey> | null; hold: string | null }

async function loadApprovals(): Promise<ApprovalRecords> {
  const file = process.env.ACADEMY_ASSESSMENT_APPROVALS || resolve(curriculumRoot, "assessment-publication-approvals.json");
  try {
    return parseApprovalRecords(await readFile(file, "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return {};
    throw error;
  }
}

async function main() {
  const approvals = await loadApprovals();
  const isKnownUserId = async (userId: string) => Boolean(await prisma.user.findUnique({ where: { id: userId }, select: { id: true } }));
  const revisions = await prisma.academyLessonRevision.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true, body: true, lesson: { select: { sourceId: true } } },
    orderBy: [{ lesson: { sourceId: "asc" } }, { version: "asc" }],
  });

  const summary = { revisions: revisions.length, withChecks: 0, checks: 0, keysLoaded: 0, checksRefused: 0, revisionsWithRefusals: 0 };
  const refusedIds: string[] = [];
  const badFiles: string[] = [];
  const heldFiles: string[] = [];
  const assessmentCache = new Map<string, AssessmentState>();

  for (const revision of revisions) {
    const sourceId = revision.lesson.sourceId;
    const checks = knowledgeCheckList(revision.body);
    if (checks.length === 0) continue;
    summary.withChecks += 1;
    summary.checks += checks.length;

    if (!assessmentCache.has(sourceId)) {
      const file = resolve(assessmentsDir, `${sourceId}.assessment.json`);
      if (!existsSync(file)) {
        assessmentCache.set(sourceId, { keys: null, hold: null });
      } else {
        const bytes = readFileSync(file);
        const problem = await approvalProblem(sourceId, bytes, approvals, isKnownUserId);
        if (problem) {
          heldFiles.push(`${sourceId}: ${problem}`);
          assessmentCache.set(sourceId, { keys: null, hold: `assessment not approved (${problem})` });
        } else {
          try {
            assessmentCache.set(sourceId, { keys: readAssessmentKeys(JSON.parse(bytes.toString("utf8")), sourceId), hold: null });
          } catch (error) {
            badFiles.push(`${sourceId}: ${(error as Error).message}`);
            assessmentCache.set(sourceId, { keys: null, hold: null });
          }
        }
      }
    }

    const state = assessmentCache.get(sourceId)!;
    const plan = state.hold
      ? {
          keys: [] as AnswerKey[],
          refused: checks.map((item) => ({ checkId: typeof (item as { id?: unknown } | null)?.id === "string" ? (item as { id: string }).id : null, reason: state.hold! })),
        }
      : planAnswerKeys(revision.body, state.keys);
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
  if (heldFiles.length) console.log(`Assessment files held (no approval for their exact bytes, no keys loaded):\n${heldFiles.join("\n")}`);
  if (badFiles.length) console.log(`Assessment files refused (malformed):\n${badFiles.join("\n")}`);
  if (refusedIds.length) console.log(`Checks refused (no key loaded):\n${refusedIds.join("\n")}`);
}

main()
  .catch((error) => {
    console.error("Key load failed:", (error as Error).message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
