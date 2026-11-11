#!/usr/bin/env node
/** Execute the real course service with a controlled Prisma adapter. No production DB touched. */
import assert from 'node:assert/strict';
import { readFileSync, realpathSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=(p)=>readFileSync(join(root,p),'utf8');
const require=createRequire(import.meta.url);
let ts;
try { ts=require(join(root,'apps/backend/node_modules/typescript')); }
catch { ts=require(dirname(dirname(realpathSync(execFileSync('which',['tsc'],{encoding:'utf8'}).trim())))); }
const service=read('apps/backend/src/modules/courses/course.service.ts');
const compiled=ts.transpileModule(service,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const routes=read('apps/backend/src/modules/courses/course.routes.ts');
const client=read('apps/frontend/src/lib/course-detail.api.ts');
const pages=resolve(root,'apps/frontend/src/app/teacher');
const fs=require('node:fs');
let count=0;
function check(x,msg){assert.ok(x,msg);count++;}
class AppError extends Error {};
class ForbiddenError extends AppError {};
class NotFoundError extends AppError {};
let course={id:'course-1',slug:'draft',teacherId:'owner',deletedAt:null,isPublished:false};
let lastQuery;
const prisma={
 course:{
  findUnique:async({where})=>{lastQuery=where;return course;},
  findMany:async({where})=>{lastQuery=where;return [course];},
  count:async()=>1,
 },
 $transaction:async(requests)=>Promise.all(requests),
};
const module={exports:{}};
new Function('require','module','exports',compiled)((id)=>{
 if(id.endsWith('config/prisma'))return {prisma};
 if(id.endsWith('config/logger'))return {logger:{info(){},warn(){},error(){},debug(){}}};
 if(id.endsWith('utils/AppError'))return {AppError,ForbiddenError,NotFoundError};
 if(id.endsWith('utils/slugify'))return {slugify:()=>'',slugWithSuffix:()=>''};
 if(id.endsWith('utils/pagination'))return {getPaginationParams:()=>({page:1,limit:10,skip:0}),buildPaginationMeta:()=>({})};
 throw Error('Unexpected module import '+id);
},module,module.exports);
const {listCourses,getCourseBySlug,getCourseBySlugForManager}=module.exports;
await listCourses({published:false});
check(lastQuery.isPublished===true,'Public catalogue forces published filter despite published=false');
check(lastQuery.deletedAt===null,'Public catalogue excludes soft-deleted courses');
await assert.rejects(()=>getCourseBySlug('draft'),NotFoundError);count++;
check(lastQuery.slug==='draft','Draft detail lookup performed but denied');
await assert.rejects(()=>getCourseBySlugForManager('draft','other','TEACHER'),ForbiddenError);count++;
const ownerDraft=await getCourseBySlugForManager('draft','owner','TEACHER');
check(ownerDraft===course,'Owning teacher can preview draft');
const adminDraft=await getCourseBySlugForManager('draft','admin','ADMIN');
check(adminDraft===course,'Administrator can preview draft (tenant scoping still pending)');
course={...course,isPublished:true};
check((await getCourseBySlug('draft'))===course,'Published course is publicly visible');
course={...course,deletedAt:new Date()};
await assert.rejects(()=>getCourseBySlug('draft'),NotFoundError);count++;
await assert.rejects(()=>getCourseBySlugForManager('draft','owner','TEACHER'),NotFoundError);count++;
check(routes.includes('"/:slug/manage", authenticate, requirePermission("course:update:own")'),'Management endpoint authenticates and authorises');
check(routes.includes('getCourseBySlugForManager(req.params.slug, req.user!.userId, req.user!.role)'),'Authenticated identity forwarded');
check(client.includes('api.get(`/courses/${slug}/manage`)'),'Private client points to private route');
let teacherPages=0;
function walk(p){for(const e of fs.readdirSync(p,{withFileTypes:true})){const f=join(p,e.name);if(e.isDirectory())walk(f);else if(e.name.endsWith('.tsx')){const body=readFileSync(f,'utf8');if(body.includes('fetchCourseForManagement'))teacherPages++;check(!body.includes('fetchCourseBySlug'),'Teacher pages must use private preview API: '+f);}}}
walk(pages);
check(teacherPages>=8,`Expected teacher workflows use private previews, got ${teacherPages}`);
console.log(`PASS: ${count} executable course visibility and management-route assertions (${teacherPages} private-preview pages)`);
