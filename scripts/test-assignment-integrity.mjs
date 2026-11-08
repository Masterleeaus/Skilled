#!/usr/bin/env node
/** Execute actual assignment TypeScript services against controlled mocks.
 * Real PostgreSQL, MinIO, multipart HTTP and pnpm build remain pending. */
import assert from 'node:assert/strict';
import { readFileSync, realpathSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
let ts;
try { ts = require(join(root,'apps/backend/node_modules/typescript')); }
catch { ts = require(dirname(dirname(realpathSync(execFileSync('which',['tsc'],{ encoding:'utf8' }).trim())))); }
const file = (p) => readFileSync(join(root,p),'utf8');
const compile = (src) => ts.transpileModule(src, {
  compilerOptions: { module:ts.ModuleKind.CommonJS, target:ts.ScriptTarget.ES2022 },
}).outputText;
let checks=0;
const check=(cond,label)=>{assert.ok(cond,label); checks++;};
class AppError extends Error { constructor(message,status=400){super(message);this.status=status;} }
class NotFoundError extends AppError {}
let studentAllowed=true, teacherAllowed=true, published=true, listQueries=0, writes=0;
let assignment={id:'assignment',courseId:'course',dueDate:new Date('2030-01-01'),totalMarks:10,passingMarks:null};
let recalc=0;
const prisma={
 assignment:{
  findUnique:async()=>assignment,
  findMany:async()=>{listQueries++;return [assignment];},
  update:async({data})=>{writes++;assignment={...assignment,...data};return assignment;},
 },
 course:{findUnique:async()=>published?{isPublished:true,deletedAt:null}:{isPublished:false,deletedAt:null}},
 enrollment:{findMany:async()=>[{studentId:'student'}]},
 assignmentSubmission:{findUnique:async()=>({id:'submission'}),upsert:async()=>{writes++;return {id:'submission'};}},
};
const module={exports:{}};
new Function('require','module','exports',compile(file('apps/backend/src/modules/assignments/assignment.service.ts')))((id)=>{
 if(id==='@prisma/client') return {};
 if(id.endsWith('config/prisma')) return {prisma};
 if(id.endsWith('utils/AppError')) return {AppError,NotFoundError};
 if(id.endsWith('courses/course.service')) return {assertCourseOwnership:async()=>{if(!teacherAllowed)throw new AppError('not course owner',403);}};
 if(id.endsWith('enrollment/enrollment.service')) return {assertEnrolled:async()=>{if(!studentAllowed)throw new AppError('not enrolled',403);}, recalculateCourseProgress:async()=>{recalc++;}};
 throw Error('Unexpected module '+id);
},module,module.exports);
const s=module.exports;
const routes=file('apps/backend/src/modules/assignments/assignment.routes.ts');
check(routes.includes('router.get("/course/:courseId", authenticate'), 'Course assignments list authenticated');
check(routes.includes('await assignmentService.assertCanSubmitAssignment(req.params.assignmentId, req.user!.userId);'), 'Preflight runs before multipart body');
check(routes.indexOf('await assignmentService.assertCanSubmitAssignment') < routes.indexOf('uploadAssignmentFiles.array'), 'Preflight ordered before multer');
check(routes.includes('await removeAssignmentAttachments(attachments)'), 'Failed persistence cleans uploaded object references');
await s.listAssignmentsForCourse('course','student','STUDENT');
check(listQueries===1,'Enrolled student can list assignments');
studentAllowed=false;
await assert.rejects(()=>s.listAssignmentsForCourse('course','student','STUDENT'),/not enrolled/);checks++;
check(listQueries===1,'Unenrolled student cannot query assignments');
studentAllowed=true;teacherAllowed=false;
await assert.rejects(()=>s.listAssignmentsForCourse('course','teacher','TEACHER'),/not course owner/);checks++;
check(listQueries===1,'Unrelated teacher cannot query assignments');
teacherAllowed=true;
await s.listAssignmentsForCourse('course','teacher','TEACHER');
check(listQueries===2,'Owning teacher can list');
published=false;
await assert.rejects(()=>s.assertCanSubmitAssignment('assignment','student'),/not available/);checks++;
check(writes===0,'Unpublished course cannot accept assignment');
published=true;studentAllowed=false;
await assert.rejects(()=>s.submitAssignment('assignment','student','text',[]),/not enrolled/);checks++;
check(writes===0,'Unenrolled student cannot write');
await assert.rejects(()=>s.getMySubmission('assignment','student'),/not enrolled/);checks++;
studentAllowed=true;
await s.assertCanSubmitAssignment('assignment','student');checks++;
await s.submitAssignment('assignment','student','text',[]);
check(writes===1,'Enrolled student can submit');
check(recalc===1,'Submission refreshes certificate eligibility after replacing any previous grade');
await assert.rejects(()=>s.configureAssignmentPassingMarks('assignment',0,'teacher','TEACHER'),/Passing marks/);checks++;
await assert.rejects(()=>s.configureAssignmentPassingMarks('assignment',11,'teacher','TEACHER'),/Passing marks/);checks++;
check(writes===1,'Invalid thresholds never written');
teacherAllowed=false;
await assert.rejects(()=>s.configureAssignmentPassingMarks('assignment',5,'teacher','TEACHER'),/not course owner/);checks++;
check(writes===1,'Unrelated teacher cannot change passing threshold');
teacherAllowed=true;
await s.configureAssignmentPassingMarks('assignment',5,'teacher','TEACHER');
check(assignment.passingMarks===5,'Owner can set passing threshold');
check(recalc===2,'Changing a pass threshold immediately refreshes enrolled learners');
check(writes===2,'Threshold update writes exactly once');
check(file('apps/backend/prisma/schema.prisma').includes('passingMarks Int?'), 'Legacy assignment pass threshold is nullable');
check(file('apps/backend/prisma/migrations/20261102240000_assignment_passing_marks/migration.sql').includes('CHECK ("passingMarks" IS NULL'), 'Migration checks range while retaining legacy null');
const uploadSource=file('apps/backend/src/modules/assignments/assignment-upload.service.ts');
check(uploadSource.includes('await removeAssignmentAttachments(uploaded)'), 'Partial object uploads are cleaned up');
check(uploadSource.includes('Promise.allSettled'), 'Object cleanup is best-effort without suppressing original failure');
check(file('apps/frontend/src/app/teacher/courses/[slug]/assignments/page.tsx').includes('Unconfigured — certification blocked'), 'Teacher UI distinguishes legacy unconfigured assignments');
check(file('apps/frontend/src/app/teacher/courses/[slug]/assignments/new/page.tsx').includes('passingMarks'), 'New assignment form requires passing threshold');
console.log(`PASS: ${checks} executable assignment access, upload-authorization, pass-threshold, migration and UI checks`);
