#!/usr/bin/env node
// Conservative publication gate: no implicit approvals, no inferred correct answers.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {reconcile,authoringLesson} from './reconcile-assessment-questions.mjs';
// Explicit fixture roots are for isolated CLI regression tests only; the default is canonical source.
const rootArg=process.argv.slice(2).find(arg=>arg.startsWith('--curriculum-root='));
if(rootArg==='--curriculum-root=')throw new Error('curriculum root cannot be empty');
const root=rootArg?path.resolve(rootArg.slice('--curriculum-root='.length)):path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const base=path.join(root,'curriculum/assessments');
const files=fs.readdirSync(base).filter(n=>n.endsWith('.assessment.json')).sort();
const approvalsPath=process.env.ACADEMY_ASSESSMENT_APPROVALS || path.join(root,'curriculum/assessment-publication-approvals.json');
const approvals=fs.existsSync(approvalsPath)?JSON.parse(fs.readFileSync(approvalsPath,'utf8')):{};
if(!approvals||typeof approvals!=='object'||Array.isArray(approvals))throw new Error('approval file must be a JSON object keyed by lesson ID');
// A reviewer is a user ID (cuid-shaped; the publisher confirms it exists in the database) or a full personal name. Placeholders are refused.
const placeholderReviewer=/^(tbd|todo|n\/?a|none|null|unknown|test|placeholder|changeme|pending|reviewer|admin|example|dummy|x+|-+)$/i;
const namedReviewer=/^[A-Za-z][A-Za-z'.-]*(?:\s+[A-Za-z][A-Za-z'.-]*)+$/;
const userIdShape=/^c[a-z0-9]{20,30}$/;
const validReviewer=value=>typeof value==='string'&&!placeholderReviewer.test(value.trim())&&(namedReviewer.test(value.trim())||userIdShape.test(value.trim()));
// ISO 8601 with a time zone, parseable, and not in the future.
const validReviewedAt=value=>typeof value==='string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value)) && Date.parse(value)<=Date.now();
const records=[];
for(const filename of files){
 const file=path.join(base,filename),bytes=fs.readFileSync(file),sha256=crypto.createHash('sha256').update(bytes).digest('hex');
 const reasons=[];let a;
 try{a=JSON.parse(bytes);}catch{reasons.push('invalid_json');records.push({filename,sha256,status:'blocked',reasons});continue;}
 if(a.lessonId!==filename.replace('.assessment.json',''))reasons.push('identity_mismatch');
 if(!Array.isArray(a.knowledgeAnswers)||!a.knowledgeAnswers.length)reasons.push('missing_answer_keys');
 else {const ids=new Set();for(const answer of a.knowledgeAnswers){
  if(!answer.id||ids.has(answer.id))reasons.push('duplicate_or_missing_answer_id');ids.add(answer.id);
  if(!Number.isInteger(answer.correctIndex)||answer.correctIndex<0)reasons.push('invalid_answer_index');
  if(!answer.rationale?.trim())reasons.push('missing_rationale');
 }}
 if(!Array.isArray(a.practicalCriteria)||!a.practicalCriteria.some(x=>typeof x==='string'&&x.trim()))reasons.push('missing_practical_criteria');
 if(!a.passRule?.trim()||/^NOT SET$/i.test(a.passRule.trim()))reasons.push('unconfigured_pass_rule');
 if(!Array.isArray(a.evidenceRequired))reasons.push('invalid_evidence_requirements');
 if(!Array.isArray(a.stopWorkCriteria))reasons.push('invalid_stop_work_criteria');
 const found=authoringLesson(root,a.lessonId);
 const converted=found?found.json:null;
 for(const finding of reconcile(a,converted))reasons.push('question_mapping_'+finding.code);
 const approval=Object.hasOwn(approvals,a.lessonId)?approvals[a.lessonId]:undefined;
 if(!approval||approval.sha256!==sha256||approval.status!=='approved'||!validReviewer(approval.reviewer)||!validReviewedAt(approval.reviewedAt))reasons.push('missing_or_stale_human_approval');
 records.push({lessonId:a.lessonId,filename,sha256,status:reasons.length?'blocked':'approved',reasons:[...new Set(reasons)]});
}
const summary={schemaVersion:1,source:'scripts/validate-assessment-publication.mjs',total:records.length,approved:records.filter(r=>r.status==='approved').length,blocked:records.filter(r=>r.status==='blocked').length,reasonCounts:{},records};
for(const record of records)for(const reason of record.reasons)summary.reasonCounts[reason]=(summary.reasonCounts[reason]||0)+1;
const output=process.argv.slice(2).find(arg=>!arg.startsWith('--'));if(output)fs.writeFileSync(path.resolve(output),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify({total:summary.total,approved:summary.approved,blocked:summary.blocked,reasonCounts:summary.reasonCounts},null,2));
if(process.argv.includes('--fail-on-blocked')&&summary.blocked)process.exitCode=1;
