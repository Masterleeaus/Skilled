#!/usr/bin/env node
// Read-only, provenance-preserving reconciliation of Academy lesson files.
// Input is the authoring set the publisher indexes: curriculum/courses/<course>/*.json and curriculum/shared/**/*.json
// (mirrors apps/backend/src/modules/curriculum/file-lesson-loader.ts). The flat-format normaliser (normalize) is kept
// for the self-test samples only; the index is built with normalizeAuthoring.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..');
const curriculumDir=path.join(root,'curriculum');
const output=path.join(curriculumDir,'lesson-normalization-index.json');
const toRel=abs=>path.relative(root,abs).split(path.sep).join('/');
function walkJson(dir){
 const found=[];
 for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
  const full=path.join(dir,entry.name);
  if(entry.isDirectory())found.push(...walkJson(full));
  else if(entry.isFile()&&entry.name.endsWith('.json'))found.push(full);
 }
 return found;
}
/** Every JSON file the loader indexes: one level under courses/<course>/, and all of shared/. Sorted by relative path. */
export function listAuthoringFiles(base=curriculumDir){
 const files=[];
 const coursesDir=path.join(base,'courses');
 if(fs.existsSync(coursesDir))for(const entry of fs.readdirSync(coursesDir,{withFileTypes:true})){
  if(!entry.isDirectory())continue;
  const courseDir=path.join(coursesDir,entry.name);
  for(const f of fs.readdirSync(courseDir,{withFileTypes:true}))if(f.isFile()&&f.name.endsWith('.json'))files.push(path.join(courseDir,f.name));
 }
 const sharedDir=path.join(base,'shared');
 if(fs.existsSync(sharedDir))files.push(...walkJson(sharedDir));
 return files.map(file=>({file,rel:toRel(file)})).sort((a,b)=>a.rel.localeCompare(b.rel));
}
/**
 * A course-folder JSON with no `id` is a course or shared-reference manifest, not a lesson. The loader skips it and so
 * does this check. Shared files and course files with an `id` are always lessons.
 */
export function isManifest(rel,doc){
 return rel.startsWith('curriculum/courses/')&&(!doc||typeof doc!=='object'||!('id' in doc));
}
const nonempty=v=>typeof v==='string'&&v.trim().length>0;
const array=v=>Array.isArray(v)?v:[];
const strings=v=>array(v).flatMap(x=>nonempty(x)?[x.trim()]:[]);
const sectionKeys=['instructionSections','instructional_sections','teaching_sections','sections','instruction'];
function extractSections(lesson){
 const results=[];
 for(const key of sectionKeys){
  const raw=lesson[key];
  const entries=Array.isArray(raw)?raw:(nonempty(raw)?[{body:raw}]:[]);
  for(const s of entries){
   if(nonempty(s)) results.push({heading:'Instruction',body:s.trim()});
   else if(s&&typeof s==='object'){
    const body=[s.body,s.text,s.content,s.instruction,s.explanation].find(nonempty);
    if(body)results.push({heading:[s.heading,s.title,s.name].find(nonempty)||'Instruction',body:body.trim()});
   }
  }
 }
 if(nonempty(lesson.lesson_text))results.push({heading:'Lesson',body:lesson.lesson_text.trim()});
 return results;
}
export function normalize(doc,file){
 const content=doc.content||{};
 const native=content.learner;
 const source=array(content.courseLessons)[0]?.lesson;
 const lesson=native||source||{};
 const outcomes=[...strings(lesson.learningOutcomes),...strings(lesson.learning_outcomes),...strings(lesson.learning_objectives)];
 for(const key of ['learning_outcome','learning_objective'])if(nonempty(lesson[key]))outcomes.push(lesson[key].trim());
 const courseIds=[...new Set([...strings(lesson.courseIds),...[lesson.course_slug].filter(nonempty)])];
 const sections=extractSections(lesson);
 const sourceHash=crypto.createHash('sha256').update(JSON.stringify(doc)).digest('hex');
 const blockers=[];
 if(!nonempty(doc.id)||!nonempty(doc.title))blockers.push('missing identity/title');
 if(!outcomes.length)blockers.push('no explicit learning outcomes');
 if(!sections.length)blockers.push('no usable instructional sections');
 if(!courseIds.length)blockers.push('course mapping requires review');
 if(!native&&!source)blockers.push('no recognized learner/source lesson');
 return {id:doc.id,title:doc.title,sourceFile:file,sourceHash,format:native?'native-learner':source?'source-course-lesson':'unknown',sourceLessonId:source?.id||source?.lesson_id||null,courseIds,learningOutcomes:outcomes,instructionSections:sections,reviewBlockers:blockers,publicationApproved:false,originalStatus:doc.status};
}
/** Authoring-format normaliser: top-level learningOutcomes, courseSlugs, instruction[{heading, body}]. */
export function normalizeAuthoring(doc,file){
 const outcomes=strings(doc.learningOutcomes);
 const courseIds=[...new Set(strings(doc.courseSlugs))];
 const sections=array(doc.instruction).flatMap(s=>nonempty(s?.body)?[{heading:[s.heading,s.title].find(nonempty)||'Instruction',body:s.body.trim()}]:[]);
 const sourceHash=crypto.createHash('sha256').update(JSON.stringify(doc)).digest('hex');
 const blockers=[];
 if(!nonempty(doc.id)||!nonempty(doc.title))blockers.push('missing identity/title');
 if(!outcomes.length)blockers.push('no explicit learning outcomes');
 if(!sections.length)blockers.push('no usable instructional sections');
 if(!courseIds.length)blockers.push('course mapping requires review');
 return {id:doc.id,title:doc.title,sourceFile:file,sourceHash,format:'full-authoring',sourceLessonId:null,courseIds,learningOutcomes:outcomes,instructionSections:sections,reviewBlockers:blockers,publicationApproved:false,originalStatus:doc.status};
}
/** Builds the index from the authoring set. Manifests are excluded and reported by audit-curriculum.mjs, not counted here. */
export function buildIndex(sources=listAuthoringFiles()){
 const lessons=sources.flatMap(({file,rel})=>{const doc=JSON.parse(fs.readFileSync(file,'utf8'));return isManifest(rel,doc)?[]:[normalizeAuthoring(doc,rel)];});
 const counts={};for(const l of lessons)for(const b of l.reviewBlockers)counts[b]=(counts[b]||0)+1;
 return {schemaVersion:1,description:'Derived preview/index only. Original lesson drafts unchanged. No publication approval.',total:lessons.length,formats:lessons.reduce((a,l)=>(a[l.format]=(a[l.format]||0)+1,a),{}),blockers:counts,lessons};
}
if(process.argv[1]&&path.resolve(process.argv[1])===path.resolve(import.meta.filename)){
 const index=buildIndex();fs.writeFileSync(output,JSON.stringify(index,null,2)+'\n');
 console.log(JSON.stringify({total:index.total,formats:index.formats,blockers:index.blockers,index:output}));
 if(process.argv.includes('--strict')&&index.lessons.some(l=>l.reviewBlockers.length))process.exitCode=1;
}
