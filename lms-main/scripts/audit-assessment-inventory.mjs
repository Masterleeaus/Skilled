#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assessmentDir = path.join(root, 'curriculum/assessments');
// Lesson sources live in curriculum/courses/<course>/ and curriculum/shared/<area>/ (see curriculum/SCHEMA.md and
// scripts/ci-curriculum-audit.mjs). The older directories are kept so their matches are not lost.
const lessonDirs = ['curriculum/courses', 'curriculum/shared', 'curriculum/lessons', 'curriculum/converted-lessons', 'curriculum/specialist-courses', 'curriculum/lesson-drafts'];
const files = fs.readdirSync(assessmentDir).filter(f => f.endsWith('.assessment.json')).sort();
const issues = [], entries = [], seen = new Set();
const counts = {};
const issue = (severity, code, file, detail) => { issues.push({severity,code,file,detail}); counts[code] = (counts[code] || 0) + 1; };
const allJson = [];
function walk(dir) { if (!fs.existsSync(dir)) return; for (const item of fs.readdirSync(dir,{withFileTypes:true})) { const f=path.join(dir,item.name); if(item.isDirectory()) walk(f); else if(item.name.endsWith('.json')) allJson.push(f); } }
for (const dir of lessonDirs) walk(path.join(root,dir));
// Resolve by file stem and explicit lesson identifiers, without assuming one source schema.
const sourceIds = new Map();
for(const f of allJson) { const stem=path.basename(f,'.json'); if(!sourceIds.has(stem))sourceIds.set(stem,[]);sourceIds.get(stem).push(path.relative(root,f)); try { const data=JSON.parse(fs.readFileSync(f,'utf8')); for(const id of [data.lessonId,data.lesson_id,data.id,data.metadata?.lessonId]) { if(typeof id==='string' && /^[A-Za-z0-9]+-L\d+/.test(id)) { if(!sourceIds.has(id))sourceIds.set(id,[]);const p=path.relative(root,f);if(!sourceIds.get(id).includes(p))sourceIds.get(id).push(p); } } } catch {} }
for(const name of files) {
 const file='curriculum/assessments/'+name; let data;
 try {data=JSON.parse(fs.readFileSync(path.join(assessmentDir,name),'utf8'));} catch(e) {issue('error','invalid_json',file,e.message);continue;}
 const id=data.lessonId;
 if(typeof id!=='string'||!id.trim())issue('error','missing_lesson_id',file,'Missing lessonId');
 if(id!==name.replace('.assessment.json',''))issue('error','filename_id_mismatch',file,`lessonId=${id}`);
 if(seen.has(id))issue('error','duplicate_lesson_id',file,id);seen.add(id);
 const answers=data.knowledgeAnswers;
 if(!Array.isArray(answers)||!answers.length)issue('review','no_knowledge_answers',file,'No answer keys');
 const answerIds=new Set();
 if(Array.isArray(answers)) for(const answer of answers) {
   if(typeof answer.id!=='string'||!answer.id.trim())issue('error','missing_answer_id',file,'Answer missing ID');
   else if(answerIds.has(answer.id))issue('error','duplicate_answer_id',file,answer.id);
   answerIds.add(answer.id);
   if(!Number.isInteger(answer.correctIndex)||answer.correctIndex<0)issue('error','invalid_answer_index',file,String(answer.correctIndex));
   if(typeof answer.rationale!=='string'||!answer.rationale.trim())issue('review','missing_rationale',file,answer.id||'unknown');
 }
 if(!Array.isArray(data.practicalCriteria)||!data.practicalCriteria.some(x=>typeof x==='string'&&x.trim()))issue('review','missing_practical_criteria',file,'No practical criteria');
 if(typeof data.passRule!=='string'||!data.passRule.trim())issue('review','missing_pass_rule',file,'No pass rule');
 for(const field of ['evidenceRequired','stopWorkCriteria'])if(!Array.isArray(data[field]))issue('error','invalid_'+field,file,'Expected array');
 const sources=sourceIds.get(id)||[];
 if(!sources.length)issue('review','unmatched_lesson_source',file,`No source identified for ${id}`);
 const sha256=crypto.createHash('sha256').update(fs.readFileSync(path.join(assessmentDir,name))).digest('hex');
 entries.push({lessonId:id,file,sha256,knowledgeAnswerCount:Array.isArray(answers)?answers.length:0,practicalCriteriaCount:Array.isArray(data.practicalCriteria)?data.practicalCriteria.length:0,sourceCandidates:sources,publicationStatus:'requires_editorial_approval'});
}
const result={schemaVersion:1,generatedBy:'scripts/audit-assessment-inventory.mjs',assessmentCount:files.length,sourceJsonScanned:allJson.length,issues:issues.length,issueCounts:counts,findings:issues,assessments:entries,publicationApproved:0};
const output=process.argv[2];if(output)fs.writeFileSync(path.resolve(output),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({assessmentCount:result.assessmentCount,sourceJsonScanned:result.sourceJsonScanned,issues:result.issues,issueCounts:counts,publicationApproved:0},null,2));
if(issues.some(x=>x.severity==='error'))process.exitCode=1;
