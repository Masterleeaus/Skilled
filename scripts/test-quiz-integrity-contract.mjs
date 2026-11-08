#!/usr/bin/env node
/** Offline quiz integrity checks. Runs real TypeScript service logic using a mock
 * Prisma adapter if a local/global TypeScript compiler is available. No DB used. */
import assert from 'node:assert/strict';
import { readFileSync, existsSync, realpathSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(join(root, 'apps/backend/src/modules/quizzes/quiz.service.ts'), 'utf8');
const schema = readFileSync(join(root, 'apps/backend/prisma/schema.prisma'), 'utf8');
const migration = readFileSync(join(root, 'apps/backend/prisma/migrations/20261102220000_academy_quiz_answer_uniqueness/migration.sql'), 'utf8');
const preflight = readFileSync(join(root, 'apps/backend/prisma/quiz-answer-preflight.sql'), 'utf8');
let checks = 0;
function check(value, explanation) { assert.ok(value, explanation); checks++; }
check(/question\.options\.some\(\(o\) => o\.id === answer\.selectedOptionId\)/.test(source), 'foreign option rejected');
check(/answeredIds\.has\(answer\.questionId\)/.test(source), 'duplicate answer rejected');
check(/input\.answers\.length !== questions\.length/.test(source), 'complete response required');
check(/claimed\.count !== 1/.test(source), 'conditional attempt claim checked');
check(/tx\.answer\.createMany\(/.test(source), 'answer creation in transaction');
check(/marksObtained > question\.marks/.test(source), 'grade ceiling enforced');
check(/@@unique\(\[attemptId, questionId\]\)/.test(schema), 'Prisma answer uniqueness');
check(/CREATE UNIQUE INDEX "answers_attemptId_questionId_key"/.test(migration), 'answer uniqueness DDL');
check(/WHERE "status" = 'IN_PROGRESS'/.test(migration), 'partial active attempt uniqueness');
check((preflight.match(/HAVING COUNT\(\*\) > 1/g) || []).length === 2, 'two duplicate preflight checks');

let typescript;
try {
  const req = createRequire(import.meta.url);
  try { typescript = req(join(root, 'apps/backend/node_modules/typescript')); }
  catch {
    const tsc = realpathSync(execFileSync('which', ['tsc'], {encoding: 'utf8'}).trim());
    typescript = req(dirname(dirname(tsc)));
  }
} catch {
  console.log(`PASS: ${checks} source and migration assertions; runtime mock execution SKIPPED (TypeScript compiler unavailable)`);
  process.exit(0);
}
const js = typescript.transpileModule(source, {compilerOptions:{module:typescript.ModuleKind.CommonJS,target:typescript.ScriptTarget.ES2022}}).outputText;
class AppError extends Error { constructor(message, statusCode=400){super(message);this.statusCode=statusCode;} }
class ForbiddenError extends AppError {}
class NotFoundError extends AppError {}
const correctOption = {id:'option-a', isCorrect:true};
const wrongOption = {id:'option-b', isCorrect:false};
const question = {id:'q1', marks:5,type:'SINGLE_CHOICE',options:[correctOption,wrongOption]};
const questionTwo = {id:'q2',marks:5,type:'SINGLE_CHOICE',options:[{id:'option-c',isCorrect:true},{id:'option-d',isCorrect:false}]};
const attempt = {id:'attempt-1', studentId:'student-1', quizId:'quiz-1', status:'IN_PROGRESS', startedAt:new Date(), quiz:{timeLimitMinutes:30}};
const events = [];
let responses = [question,questionTwo];
let count = 1;
const tx = {
  quizAttempt: { updateMany: async (query)=>{events.push(['claim',query]);return {count};} },
  answer: { createMany: async (query)=>{events.push(['answers',query]);} },
};
const prisma = {
  quizAttempt: { findUnique: async ()=>attempt },
  question: {findMany: async ()=>responses},
  $transaction: async (cb)=>cb(tx),
};
function localRequire(id) {
  if (id.endsWith('config/prisma')) return {prisma};
  if (id.endsWith('utils/AppError')) return {AppError, ForbiddenError, NotFoundError};
  if (id.endsWith('courses/course.service')) return {assertCourseOwnership:async()=>{}};
  if (id.endsWith('enrollment/enrollment.service')) return {assertEnrolled:async()=>{},recalculateCourseProgress:async()=>({eligible:false})};
  throw Error(`Unmocked dependency: ${id}`);
}
const module = {exports:{}};
new Function('require','module','exports',js)(localRequire,module,module.exports);
const {submitAttempt} = module.exports;
const valid = [{questionId:'q1',selectedOptionId:'option-a'},{questionId:'q2',selectedOptionId:'option-c'}];
async function rejected(answers, fragment) {
  events.length=0;
  await assert.rejects(()=>submitAttempt('attempt-1','student-1',{answers}),new RegExp(fragment));
  assert.equal(events.length,0,'rejected responses must never write data');
  checks++;
}
await rejected([valid[0],valid[0]],'Duplicate');
await rejected([valid[0]],'exactly one');
await rejected([{questionId:'q1',selectedOptionId:'option-c'},valid[1]],'does not belong');
await rejected([{questionId:'invalid',selectedOptionId:'option-a'},valid[1]],'outside this quiz');
await rejected([{questionId:'q1'},valid[1]],'choice must be selected');
await rejected([{questionId:'q1',selectedOptionId:'option-a'},{questionId:'q2',selectedOptionId:'option-a'}],'does not belong');
// Concurrent conditional claim: zero modified rows must abort before inserting any answers.
count=0;events.length=0;
await assert.rejects(()=>submitAttempt('attempt-1','student-1',{answers:valid}),/already submitted/);
assert.deepEqual(events.map(e=>e[0]),['claim']);checks++;
count=1;events.length=0;
await submitAttempt('attempt-1','student-1',{answers:valid});
assert.deepEqual(events.map(e=>e[0]),['claim','answers']);
assert.equal(events[0][1].data.marksObtained,10);
assert.equal(events[0][1].data.status,'GRADED');
checks+=3;
attempt.startedAt = new Date(Date.now()-31*60_000);
await rejected(valid,'time limit');
console.log(`PASS: ${checks} quiz assertions (${checks-10} mocked service execution assertions), no database accessed`);
