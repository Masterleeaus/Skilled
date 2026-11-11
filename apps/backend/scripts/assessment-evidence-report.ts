/**
 * ACA-012: coverage report of practical evidence mapping across the real curriculum files.
 * Read-only. Prints JSON to stdout.
 *
 * Usage (from apps/backend): npx tsx scripts/assessment-evidence-report.ts
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { buildEvidenceReport, type AssessmentSpec } from "../src/modules/curriculum/assessment-evidence";

const curriculumRoot = resolve(__dirname, "../../../curriculum");
const assessmentsDir = join(curriculumRoot, "assessments");

function readJson(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
}

function walkJson(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      if (path !== assessmentsDir && name !== "node_modules") walkJson(path, out);
    } else if (name.endsWith(".json")) {
      out.push(path);
    }
  }
  return out;
}

const specs = readdirSync(assessmentsDir)
  .filter(name => name.endsWith(".assessment.json"))
  .map(name => readJson(join(assessmentsDir, name)) as unknown as AssessmentSpec);

// Course membership comes from each lesson file's courseSlugs. Shared lessons are included.
const courseLessons: Record<string, string[]> = {};
const lessonCheckCounts = new Map<string, number>();
for (const path of walkJson(curriculumRoot)) {
  const lesson = readJson(path);
  if (typeof lesson.id !== "string" || !Array.isArray(lesson.courseSlugs)) continue;
  const checks = Array.isArray(lesson.knowledgeChecks) ? lesson.knowledgeChecks : Array.isArray(lesson.knowledgeCheck) ? lesson.knowledgeCheck : [];
  lessonCheckCounts.set(lesson.id, checks.length);
  for (const slug of lesson.courseSlugs as string[]) {
    const list = (courseLessons[slug] ??= []);
    if (!list.includes(lesson.id)) list.push(lesson.id);
  }
}

const report = buildEvidenceReport(specs, courseLessons);

// Cross-check for the knowledge pass rule: the learner-facing checks must match the assessor file's count.
const specById = new Map(specs.map(spec => [spec.lessonId, spec] as const));
const checkCountMismatch = [...lessonCheckCounts.entries()]
  .filter(([id, count]) => specById.has(id) && (specById.get(id)!.knowledgeAnswers?.length ?? 0) !== count)
  .map(([id]) => id)
  .sort();

console.log(JSON.stringify({ ...report, lessonsWithCourseSlugs: lessonCheckCounts.size, knowledgeCheckCountMismatch: checkCountMismatch }, null, 2));
