#!/usr/bin/env node
/** Exercises real quiz.service.ts submission logic against an isolated Prisma mock.
 * Does not replace a real PostgreSQL migration / concurrency test. */
import assert from 'node:assert/strict';
import { readFileSync, realpathSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(join(root, 'apps/backend/src/modules/quizzes/quiz.service.ts'), 'utf8');
const schema = readFileSync(join(root, 'apps/backend/prisma/schema.prisma'), 'utf8');
const migration = readFileSync(join(root, 'apps/backend/prisma/migrations/20261102230000_academy_multiple_choice_answers/migration.sql'), 'utf8');
const frontend = readFileSync(join(root, 'apps/frontend/src/app/student/quizzes/[quizId]/page.tsx'), 'utf8');
const validator = readFileSync(join(root, 'apps/backend/src/modules/quizzes/quiz.validators.ts'), 'utf8');
const require = createRequire(import.meta.url);
let ts;
try { ts = require(join(root, 'apps/backend/node_modules/typescript')); }
catch { ts = require(dirname(dirname(realpathSync(execFileSync('which',['tsc'],{encoding:'utf8'}).trim())))); }
const js = ts.transpileModule(source, { compilerOptions: {module:ts.ModuleKind.CommonJS, target:ts.ScriptTarget.ES2022} }).outputText;
let checks = 0;
const check = (test, message) => { assert.ok(test, message); checks++; };
check(schema.includes('selectedOptionIds Json?       @map("selected_option_ids")'), 'Prisma JSON selectedOptionIds field');
check(migration.includes('ADD COLUMN "selected_option_ids" JSONB'), 'additive migration');
check(frontend.includes('type={q.type === "MULTIPLE_CHOICE" ? "checkbox" : "radio"}'), 'checkbox UI');
check(frontend.includes('selectedOptionIds:'), 'frontend sends selectedOptionIds');
check(validator.includes('Duplicate selected options'), 'input validator rejects repeated options');
check(validator.includes('Text questions cannot include choice options'), 'question validator rejects contradictory text options');

class AppError extends Error { constructor(message, status=400){super(message);this.status=status;} }
class ForbiddenError extends AppError {}
class NotFoundError extends AppError {}
const attempt = {id:'a',studentId:'student',quizId:'quiz',status:'IN_PROGRESS',startedAt:new Date(),quiz:{timeLimitMinutes:30}};
const questions = [
  {id:'q-single',type:'SINGLE_CHOICE',marks:3,options:[{id:'s1',isCorrect:true},{id:'s2',isCorrect:false}]},
  {id:'q-multi',type:'MULTIPLE_CHOICE',marks:7,options:[{id:'m1',isCorrect:true},{id:'m2',isCorrect:true},{id:'m3',isCorrect:false}]},
  {id:'q-text',type:'TEXT',marks:5,options:[]},
];
const writes=[]; let claimCount=1;
const tx = {
 quizAttempt:{updateMany:async (q)=>{writes.push(['claim',q]);return {count:claimCount};}},
 answer:{createMany:async (q)=>{writes.push(['answers',q]);}},
};
const prisma={
 quizAttempt:{findUnique:async()=>attempt},
 question:{findMany:async()=>questions},
 $transaction:async(fn)=>fn(tx),
};
function stub(id){
 if(id.endsWith('config/prisma')) return {prisma};
 if(id.endsWith('utils/AppError')) return {AppError,ForbiddenError,NotFoundError};
 if(id.endsWith('courses/course.service')) return {assertCourseOwnership:async()=>{}};
 if(id.endsWith('enrollment/enrollment.service')) return {assertEnrolled:async()=>{},recalculateCourseProgress:async()=>({eligible:false})};
 throw new Error(`unexpected module ${id}`);
}
const module={exports:{}};new Function('require','module','exports',js)(stub,module,module.exports);
const {submitAttempt} = module.exports;
const base = [
 {questionId:'q-single',selectedOptionId:'s1'},
 {questionId:'q-multi',selectedOptionIds:['m2','m1']},
 {questionId:'q-text',textAnswer:'Reviewed by an assessor'},
];
async function submit(answers){writes.length=0;await submitAttempt('a','student',{answers});return writes.find(([t])=>t==='answers')?.[1].data;}
async function reject(answers,re){writes.length=0;await assert.rejects(()=>submitAttempt('a','student',{answers}),re);assert.equal(writes.length,0);checks++;}
const correct = await submit(base);
check(correct.length===3, 'three answers stored');
check(correct[1].marksObtained===7, 'exact-set multi-choice auto-graded');
check(JSON.stringify(correct[1].selectedOptionIds)===JSON.stringify(['m2','m1']), 'selected choices persisted in submitted order');
check(correct[2].marksObtained===null, 'text remains manual grading');
check(writes[0][1].data.status==='SUBMITTED', 'mixed quiz is submitted for manual review');
const wrong = await submit([base[0],{questionId:'q-multi',selectedOptionIds:['m1','m3']},base[2]]);
check(wrong[1].marksObtained===0, 'incorrect extra selection scores zero');
const missing = await submit([base[0],{questionId:'q-multi',selectedOptionIds:['m1']},base[2]]);
check(missing[1].marksObtained===0,'missing correct selection scores zero');
await reject([base[0],{questionId:'q-multi',selectedOptionIds:['m1','m1']},base[2]],/Duplicate selected options/);
await reject([base[0],{questionId:'q-multi',selectedOptionIds:['m1','s1']},base[2]],/does not belong/);
await reject([base[0],{questionId:'q-multi',selectedOptionId:'m1'},base[2]],/selectedOptionIds/);
await reject([{questionId:'q-single',selectedOptionIds:['s1']},base[1],base[2]],/single choice/);
await reject([base[0],base[1],{questionId:'q-text',textAnswer:'  '}],/text response/);
await reject([base[0],base[1],{questionId:'q-text',selectedOptionId:'s1'}],/does not belong/);
await reject([base[0],{questionId:'q-multi',selectedOptionIds:['m1','m2'],textAnswer:'a'},base[2]],/conflicting/);
await reject([base[0],{questionId:'q-multi',selectedOptionId:'m1',selectedOptionIds:['m1']},base[2]],/conflicting/);
// Fully machine-gradable quiz should be completed without human marking.
questions.pop();
await submit(base.slice(0,2));
check(writes[0][1].data.status==='GRADED', 'entire choice-only quiz auto graded');
check(writes[0][1].data.marksObtained===10,'single and multi-choice marks summed');
claimCount=0;
writes.length=0;
await assert.rejects(()=>submitAttempt('a','student',{answers:base.slice(0,2)}),/already submitted/);
check(writes.length===1 && writes[0][0]==='claim','conflicting attempt never writes answers');
console.log(`PASS: ${checks} multi-select grading and response-validation checks (mocked database, no live migrations)`);
