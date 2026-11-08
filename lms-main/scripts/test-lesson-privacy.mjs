#!/usr/bin/env node
/** Runtime module-visibility checks and source contract for presigned video authorization. */
import assert from 'node:assert/strict';
import { readFileSync, realpathSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=f=>readFileSync(join(root,f),'utf8');
const require=createRequire(import.meta.url);
let ts;
try {ts=require(join(root,'apps/backend/node_modules/typescript'));}
catch {ts=require(dirname(dirname(realpathSync(execFileSync('which',['tsc'],{encoding:'utf8'}).trim()))));}
let checks=0;
const check=(value,message)=>{assert.ok(value,message);checks++;};
class NotFoundError extends Error {}
let course={isPublished:false,deletedAt:null}, listings=0;
const prisma={course:{findUnique:async()=>course},module:{findMany:async()=>{listings++;return [{id:'module'}];}}};
const source=read('apps/backend/src/modules/courses/module.service.ts');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const module={exports:{}};
new Function('require','module','exports',compiled)((id)=>{
 if(id.endsWith('config/prisma'))return {prisma};
 if(id.endsWith('utils/AppError'))return {NotFoundError};
 if(id.endsWith('course.service'))return {assertCourseOwnership:async()=>{}};
 throw Error('Unexpected import '+id);
},module,module.exports);
const {listModules}=module.exports;
await assert.rejects(()=>listModules('draft'),NotFoundError);checks++;
check(listings===0,'Draft modules never queried for public caller');
course={isPublished:true,deletedAt:null};
check((await listModules('published')).length===1,'Published modules visible');
check(listings===1,'Published module lookup performed');
course={isPublished:true,deletedAt:new Date()};
await assert.rejects(()=>listModules('deleted'),NotFoundError);checks++;
course=null;
await assert.rejects(()=>listModules('missing'),NotFoundError);checks++;
check(listings===1,'Deleted and missing courses denied before listing');
const route=read('apps/backend/src/modules/courses/module.routes.ts');
const video=route.slice(route.indexOf('async function authorizedVideoForUser('));
check(video.includes('await assertCourseOwnership(lesson.module.courseId, userId, user.role)'), 'Staff video retrieval enforces course ownership');
check(video.includes('if (!course?.isPublished || course.deletedAt)'), 'Student preview denies draft or deleted courses');
check(video.includes('await isEnrolled(userId, lesson.module.courseId)'), 'Non-preview video requires active enrolment');
check(video.indexOf('await assertCourseOwnership') < video.indexOf('createPlaybackGrant('), 'Authorization occurs before issuing playback grant');
check(video.indexOf('await isEnrolled') < video.indexOf('createPlaybackGrant('), 'Enrollment is verified before issuing playback grant');
check(video.includes('await authorizedVideoForUser(req.params.lessonId, userId)'), 'Access revalidated on each stream request');
check(video.includes('verifyPlaybackGrant(token, req.params.lessonId)'), 'Stream validates lesson-bound grant');
console.log(`PASS: ${checks} module-privacy and private-video contract assertions (module service executed)`);
