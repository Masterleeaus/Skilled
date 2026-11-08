#!/usr/bin/env node
/** Execute real certificate-eligibility TypeScript with a deterministic Prisma mock.
 * No DB is created; real PostgreSQL and worker tests are still mandatory. */
import assert from 'node:assert/strict';
import { readFileSync, realpathSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
let ts;
try { ts = require(join(root, 'apps/backend/node_modules/typescript')); }
catch { ts = require(dirname(dirname(realpathSync(execFileSync('which', ['tsc'], { encoding: 'utf8' }).trim())))); }
const filename = join(root, 'apps/backend/src/modules/certificates/certificate-eligibility.service.ts');
const source = readFileSync(filename, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
let checks = 0;
function check(actual, expected, label) { assert.deepEqual(actual, expected, label); checks++; }
const scenario = {
  enrollment: { status: 'ACTIVE' },
  course: { isPublished: true, deletedAt: null },
  lessons: 2, completed: 2,
  quizzes: [{ id: 'q1', passingMarks: 7, totalMarks: 10 }],
  quizMarks: { q1: 8 },
  assignments: [{ id: 'a1', totalMarks: 10, passingMarks: 2 }],
  graded: { a1: 3 },
};
const prisma = {
  enrollment: { findUnique: async () => scenario.enrollment },
  course: { findUnique: async () => scenario.course },
  lesson: { count: async () => scenario.lessons },
  lessonProgress: { count: async () => scenario.completed },
  quiz: { findMany: async () => scenario.quizzes },
  quizAttempt: { findFirst: async ({ where }) => {
    check(where.studentId, 'student', 'Quiz attempt filters student');
    check(where.status, 'GRADED', 'Only graded attempts qualify');
    const mark = scenario.quizMarks[where.quizId];
    return mark !== undefined && mark >= where.marksObtained.gte ? { id: 'attempt' } : null;
  } },
  assignment: { findMany: async () => scenario.assignments },
  assignmentSubmission: { findFirst: async ({ where }) => {
    check(where.studentId, 'student', 'Assignment filters student');
    check(where.status, 'GRADED', 'Only teacher-graded submissions qualify');
    check(where.marksObtained, { not: null }, 'Grade must be recorded');
    return scenario.graded[where.assignmentId] !== undefined ? { id: 'submission', marksObtained: scenario.graded[where.assignmentId] } : null;
  } },
};
const module = { exports: {} };
new Function('require', 'module', 'exports', compiled)((id) => {
  if (id.endsWith('config/prisma')) return { prisma };
  throw new Error('Unexpected module: ' + id);
}, module, module.exports);
const { evaluateCertificateEligibility } = module.exports;
async function eligibility() { return evaluateCertificateEligibility('student', 'course'); }
let result = await eligibility();
check(result.eligible, true, 'Complete learning and assessments qualify');
check(result.blockers, [], 'No blockers for eligible learner');
check([result.lessonsCompleted, result.quizzesPassed, result.assignmentsGraded, result.assignmentsPassed], [2, 1, 1, 1], 'Evidence counts');
scenario.graded = { a1: 0 };
result = await eligibility();
check(result.eligible, false, 'Zero-mark graded submission does not qualify');
check(result.blockers.includes('Required assignments not passed'), true, 'Failing assignment is a certification blocker');
scenario.graded = { a1: 3 };
scenario.assignments[0].passingMarks = null;
result = await eligibility();
check(result.eligible, false, 'Legacy assignment without a passing mark is blocked');
check(result.blockers.includes('Assignment passing marks not configured'), true, 'Missing threshold is explained');
scenario.assignments[0].passingMarks = 2;
scenario.quizMarks.q1 = 5;
result = await eligibility();
check(result.eligible, false, 'Failed quiz blocks certificate');
check(result.blockers.includes('Required quizzes not passed'), true, 'Quiz failure visible');
scenario.quizMarks.q1 = 8;
scenario.graded = {};
result = await eligibility();
check(result.eligible, false, 'Ungraded assignment blocks certificate');
scenario.graded = { a1: 3 };
scenario.completed = 1;
result = await eligibility();
check(result.eligible, false, 'Incomplete lessons block certificate');
scenario.completed = 2;
scenario.enrollment = { status: 'CANCELLED' };
result = await eligibility();
check(result.eligible, false, 'Cancelled enrolment blocks certificate');
scenario.enrollment = { status: 'ACTIVE' };
scenario.course = { isPublished: false, deletedAt: null };
result = await eligibility();
check(result.eligible, false, 'Draft course blocks certificate');
scenario.course = { isPublished: true, deletedAt: null };
scenario.quizzes[0].passingMarks = 0;
result = await eligibility();
check(result.eligible, false, 'Unconfigured passing threshold cannot qualify');
scenario.quizzes[0].passingMarks = 7;
scenario.quizzes = [];
scenario.assignments = [];
result = await eligibility();
check(result.eligible, true, 'Lesson-only course without assessed requirements can complete');
scenario.lessons = 0;
result = await eligibility();
check(result.eligible, false, 'Empty course never qualifies');
const certSource = readFileSync(join(root, 'apps/backend/src/modules/certificates/certificate.service.ts'), 'utf8');
const enrollmentSource = readFileSync(join(root, 'apps/backend/src/modules/enrollment/enrollment.service.ts'), 'utf8');
const routesSource = readFileSync(join(root, 'apps/backend/src/modules/enrollment/enrollment.routes.ts'), 'utf8');
const quizSource = readFileSync(join(root, 'apps/backend/src/modules/quizzes/quiz.service.ts'), 'utf8');
const assignmentSource = readFileSync(join(root, 'apps/backend/src/modules/assignments/assignment.service.ts'), 'utf8');
check(certSource.includes('const eligibility = await evaluateCertificateEligibility(studentId, courseId)'), true, 'Worker checks current eligibility');
check(enrollmentSource.includes('status: eligibility.eligible ? "COMPLETED" : "ACTIVE"'), true, 'Enrollment status requires eligibility');
check(routesSource.includes('await assertCourseOwnership(req.params.courseId, req.user!.userId, req.user!.role);'), true, 'Roster and student endpoints enforce course ownership');
check(quizSource.includes('await recalculateCourseProgress(studentId, attempt.quiz.courseId)'), true, 'Auto grading triggers eligibility refresh');
check(assignmentSource.includes('await recalculateCourseProgress(submission.studentId, submission.assignment.courseId)'), true, 'Assignment grading triggers eligibility refresh');
console.log(`PASS: ${checks} certificate eligibility checks (actual TS service with mocked Prisma) and integration contracts`);
