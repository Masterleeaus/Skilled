// Validates the Pass 98 cleaning lesson import files.
// Usage: node validate-cleaning-lessons.mjs [learnerPath] [assessorPath]
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const learnerPath = process.argv[2] ?? join(here, 'cleaning-lessons.learner.json');
const assessorPath = process.argv[3] ?? join(here, 'cleaning-lessons.assessor.json');
const learner = JSON.parse(readFileSync(learnerPath, 'utf8'));
const assessor = JSON.parse(readFileSync(assessorPath, 'utf8'));
const errors = [];
const warnings = [];
const fail = (msg) => errors.push(msg);

// Learner-side checks
if (learner.courses?.length !== 10) fail(`expected 10 courses, found ${learner.courses?.length}`);
const ids = learner.lessons.map((l) => l.id);
if (new Set(ids).size !== ids.length) fail('duplicate lesson ids in learner file');
if (ids.length !== 121) fail(`expected 121 distinct lessons, found ${ids.length}`);
const placements = learner.courses.reduce((n, c) => n + c.placements.length, 0);
if (placements !== 155) fail(`expected 155 placements, found ${placements}`);
const idSet = new Set(ids);
for (const course of learner.courses) {
  course.placements.forEach((p, i) => {
    if (p.position !== i + 1) fail(`${course.slug}: non-contiguous position at ${p.lessonId}`);
    if (!idSet.has(p.lessonId)) fail(`${course.slug}: unknown lesson ${p.lessonId}`);
  });
}
const FORBIDDEN = /answer|rationale|model|expected|trainer|evidence|review/i;
const walk = (v, path, cb) => {
  if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`, cb));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) { cb(k, path); walk(x, `${path}.${k}`, cb); }
};
walk(learner.lessons, 'lessons', (k, p) => { if (FORBIDDEN.test(k)) fail(`answer-like key "${k}" in learner file at ${p}`); });
for (const l of learner.lessons) {
  if (l.status !== 'DRAFT') fail(`${l.id}: status must be DRAFT`);
  if (!l.learningOutcomes?.length) warnings.push(`${l.id}: no learning outcomes in source (SME to author)`);
  if (!l.instructionSections?.some((s) => s.body && s.body.trim())) fail(`${l.id}: no instructional body`);
}

// Assessor-side checks
if (!String(assessor.status).startsWith('ASSESSOR ONLY')) fail('assessor file must be marked ASSESSOR ONLY');
const assessorIds = assessor.lessons.map((a) => a.lessonId);
if (new Set(assessorIds).size !== assessorIds.length) fail('duplicate lesson ids in assessor file');
for (const id of ids) if (!assessorIds.includes(id)) fail(`${id}: missing assessor record`);
for (const id of assessorIds) if (!idSet.has(id)) fail(`${id}: assessor record has no learner lesson`);
const answerIds = new Set(assessor.lessons.flatMap((a) => (a.knowledgeAnswers ?? []).map((k) => k.id)));
let questions = 0, unanswered = 0;
for (const l of learner.lessons) for (const kc of l.knowledgeChecks ?? []) {
  if (kc.question) { questions++; if (!answerIds.has(kc.id)) { unanswered++; fail(`${kc.id}: question has no assessor answer`); } }
}

const summary = {
  courses: learner.courses.length,
  distinctLessons: ids.length,
  lessonPlacements: placements,
  knowledgeQuestions: questions,
  questionsWithAssessorAnswer: questions - unanswered,
  assessorRecords: assessor.lessons.length,
};
if (errors.length) {
  console.error(JSON.stringify({ status: 'FAILED', errors: errors.slice(0, 50), errorCount: errors.length, summary }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ status: 'PASSED', summary, warningCount: warnings.length, warnings }, null, 2));
