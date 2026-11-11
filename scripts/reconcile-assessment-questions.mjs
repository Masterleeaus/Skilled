#!/usr/bin/env node
// Read-only reconciliation. An answer index is never inferred or corrected automatically.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
// Lesson JSON is read from curriculum/courses and curriculum/shared, the single source of truth. Keyed by lesson id.
const authoringCache=new Map();
function walkJson(dir,out){
 let entries;try{entries=fs.readdirSync(dir,{withFileTypes:true});}catch{return out;}
 for(const e of entries){const full=path.join(dir,e.name);if(e.isDirectory())walkJson(full,out);else if(e.name.endsWith('.json'))out.push(full);}
 return out;
}
export function authoringLesson(base,id){
 if(!authoringCache.has(base)){
  const map=new Map();
  for(const sub of ['courses','shared']){
   for(const file of walkJson(path.join(base,'curriculum',sub),[]).sort()){
    let json;try{json=JSON.parse(fs.readFileSync(file,'utf8'));}catch{continue;}
    if(json&&typeof json==='object'&&typeof json.id==='string'&&!map.has(json.id))map.set(json.id,{file,json});
   }
  }
  authoringCache.set(base,map);
 }
 return authoringCache.get(base).get(id)??null;
}
export function reconcile(assessment, converted){
 const findings=[];
 const checks=Array.isArray(converted?.knowledgeChecks)?converted.knowledgeChecks:[];
 const answers=Array.isArray(assessment?.knowledgeAnswers)?assessment.knowledgeAnswers:[];
 const byId=new Map();
 for(const q of checks){
  if(!q||typeof q!=='object'||Array.isArray(q)||typeof q.id!=='string'||!q.id.trim()){
   findings.push({code:'invalid_question_entry'});
   continue;
  }
  if(byId.has(q.id))findings.push({code:'duplicate_question_id',id:q.id});
  byId.set(q.id,q);
 }
 for(const a of answers){
  if(!a||typeof a!=='object'||Array.isArray(a)||typeof a.id!=='string'||!a.id.trim()){
   findings.push({code:'invalid_answer_entry'});
   continue;
  }
  const q=byId.get(a.id);
  if(!q){findings.push({code:'unmatched_answer',id:a.id});continue;}
  if(typeof q.question!=='string'||!q.question.trim())findings.push({code:'empty_question',id:a.id});
  if(!Array.isArray(q.options)||q.options.length<2||q.options.some(o=>typeof o!=='string'||!o.trim()))findings.push({code:'invalid_options',id:a.id});
  else if(!Number.isInteger(a.correctIndex)||a.correctIndex<0||a.correctIndex>=q.options.length)findings.push({code:'answer_out_of_range',id:a.id,optionCount:q.options.length});
 }
 const answerIds=new Set(answers.filter(a=>a&&typeof a==='object'&&!Array.isArray(a)&&typeof a.id==='string').map(a=>a.id));
 for(const q of checks)if(q&&typeof q==='object'&&!Array.isArray(q)&&typeof q.id==='string'&&!answerIds.has(q.id))findings.push({code:'question_without_answer',id:q.id});
 if(!converted)findings.push({code:'missing_converted_lesson'});
 return findings;
}
export function audit(base=root){
 const dir=path.join(base,'curriculum/assessments');
 const files=fs.readdirSync(dir).filter(n=>n.endsWith('.assessment.json')).sort();
 const records=[];
 for(const filename of files){
  const bytes=fs.readFileSync(path.join(dir,filename));const id=filename.slice(0,-'.assessment.json'.length);
  let assessment,converted;const findings=[];
  try{assessment=JSON.parse(bytes);}catch{findings.push({code:'invalid_assessment_json'});}
  const found=authoringLesson(base,id);converted=found?found.json:undefined;
  if(assessment)findings.push(...reconcile(assessment,converted));
  records.push({lessonId:id,filename,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),convertedSource:found?path.relative(base,found.file):null,questionCount:converted?.knowledgeChecks?.length??0,answerCount:assessment?.knowledgeAnswers?.length??0,findings,reviewRequired:findings.length>0});
 }
 const counts={};for(const r of records)for(const f of r.findings)counts[f.code]=(counts[f.code]||0)+1;
 return {schemaVersion:1,total:records.length,needsReview:records.filter(r=>r.reviewRequired).length,findings:counts,records,automaticallyApproved:0};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const result=audit();const output=process.argv[2];if(output&&!output.startsWith('--'))fs.writeFileSync(path.resolve(output),JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({total:result.total,needsReview:result.needsReview,findings:result.findings},null,2));
 if(process.argv.includes('--fail-on-findings')&&result.needsReview)process.exitCode=1;
}
