#!/usr/bin/env node
/** Real TypeScript service execution with a controlled Prisma adapter.
 * Confirms authorisation and transaction order; PostgreSQL-level row locks
 * still require a separate database-backed integration test. */
import assert from 'node:assert/strict';
import { readFileSync, realpathSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
let ts;
try { ts = require(join(root,'apps/backend/node_modules/typescript')); }
catch { ts = require(dirname(dirname(realpathSync(execFileSync('which',['tsc'],{encoding:'utf8'}).trim())))); }
const source = readFileSync(join(root,'apps/backend/src/modules/quizzes/quiz.service.ts'),'utf8');
const routes = readFileSync(join(root,'apps/backend/src/modules/quizzes/quiz.routes.ts'),'utf8');
const compiled = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
let checks=0;
const check=(ok,label)=>{assert.ok(ok,label);checks++;};
class AppError extends Error { constructor(message,status=400){super(message);this.status=status;} }
class ForbiddenError extends AppError {}
class NotFoundError extends AppError {}
let enrolled = true; let owner = true; let enrollmentCalls=0; let ownershipCalls=0; let findCalls=0;
const attempt={id:'a',status:'SUBMITTED',quizId:'q',studentId:'s',quiz:{courseId:'course'},submittedAt:new Date()};
const answer={id:'one',attemptId:'a',questionId:'question',attempt};
let grade=1, gradeTotal=null, attemptStatus='SUBMITTED';
let txCalls=[]; let lockRows=[{id:'a',status:'SUBMITTED'}];
const tx = {
 $queryRaw:async(strings,...vals)=>{ txCalls.push(['lock',strings.join('?'),vals]); return lockRows;},
 answer:{
  findUnique:async()=>{txCalls.push(['read']);return answer;},
  update:async({data})=>{txCalls.push(['updateAnswer']);grade=data.marksObtained;},
  findMany:async()=>{txCalls.push(['aggregate']);return [{marksObtained:grade},{marksObtained: gradeTotal}];},
 },
 quizAttempt:{update:async({data})=>{txCalls.push(['updateAttempt']);attemptStatus=data.status;return data;}},
};
const prisma={
 quiz:{findMany:async()=>{findCalls++;return [{id:'q'}];}},
 answer:{findUnique:async()=>answer},
 question:{findUnique:async()=>({marks:5})},
 $transaction:async(fn)=>fn(tx),
};
const module={exports:{}};
new Function('require','module','exports',compiled)((id)=>{
 if(id.endsWith('config/prisma'))return {prisma};
 if(id.endsWith('utils/AppError'))return {AppError,ForbiddenError,NotFoundError};
 if(id.endsWith('courses/course.service'))return {assertCourseOwnership:async()=>{ownershipCalls++;if(!owner)throw new ForbiddenError('not owner');}};
 if(id.endsWith('enrollment/enrollment.service'))return {assertEnrolled:async()=>{enrollmentCalls++;if(!enrolled)throw new ForbiddenError('not enrolled');},recalculateCourseProgress:async()=>({eligible:false})};
 throw Error('Unexpected import '+id);
},module,module.exports);
const {listQuizzesForCourse,gradeAnswer}=module.exports;
check(routes.includes('listQuizzesForCourse(req.params.courseId, req.user!.userId, req.user!.role)'), 'authenticated user identity forwarded');
await listQuizzesForCourse('course','student','STUDENT');
check(enrollmentCalls===1&&ownershipCalls===0&&findCalls===1,'student enrolment checked before list');
enrolled=false;
await assert.rejects(()=>listQuizzesForCourse('course','student','STUDENT'),/not enrolled/);
check(findCalls===1,'unenrolled student cannot query course quizzes');
owner=false;
await assert.rejects(()=>listQuizzesForCourse('course','teacher','TEACHER'),/not owner/);
check(findCalls===1&&ownershipCalls===1,'unrelated teacher cannot list quizzes');
owner=true;
await listQuizzesForCourse('course','teacher','TEACHER');
check(findCalls===2&&ownershipCalls===2,'course owner can list quizzes');
check(source.includes('FOR UPDATE'),'PostgreSQL row-level lock is required');
check(source.includes('tx.$queryRaw<Array<{ id: string; status: string }>>`'),'parameterised tagged query');
grade=1;gradeTotal=3;txCalls=[];
await gradeAnswer('one',4,'teacher','TEACHER');
check(txCalls.map(([x])=>x).join(',')==='lock,read,updateAnswer,aggregate,updateAttempt','locking precedes grading and aggregation');
check(txCalls[0][2][0]==='a','lock parameter binds attempt ID');
check(attemptStatus==='GRADED','completed answers produce graded attempt');
gradeTotal=null;txCalls=[];
await gradeAnswer('one',3,'teacher','TEACHER');
check(attemptStatus==='SUBMITTED','incomplete regrade resets attempt to submitted');
lockRows=[];txCalls=[];
await assert.rejects(()=>gradeAnswer('one',2,'teacher','TEACHER'),/Only submitted attempts/);
check(txCalls.length===1,'missing locked attempt rejects before write');
lockRows=[{id:'a',status:'IN_PROGRESS'}];txCalls=[];
await assert.rejects(()=>gradeAnswer('one',2,'teacher','TEACHER'),/Only submitted attempts/);
check(txCalls.length===1,'in-progress attempt cannot be graded');
await assert.rejects(()=>gradeAnswer('one',6,'teacher','TEACHER'),/Grade must be an integer/);
checks++;
console.log(`PASS: ${checks} authenticated quiz-list and transaction-ordered grading assertions (mocked Prisma)`);
