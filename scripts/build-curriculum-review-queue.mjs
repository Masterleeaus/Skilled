#!/usr/bin/env node
// Derive a deterministic, source-linked editorial queue; never mutate source lessons.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildIndex} from './reconcile-lesson-formats.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const destination=path.join(root,'curriculum','lesson-review-queue.json');
const csvPath=path.join(root,'curriculum','lesson-review-queue.csv');
const rank={'no usable instructional sections':0,'no explicit learning outcomes':1,'course mapping requires review':2,'missing identity/title':0,'no recognized learner/source lesson':0};
export function createQueue(index){
 const lessons=index.lessons.filter(x=>x.reviewBlockers.length).map(x=>({id:x.id,title:x.title,sourceFile:x.sourceFile,sourceHash:x.sourceHash,format:x.format,priority:x.reviewBlockers.some(b=>rank[b]===0)?'P0':x.reviewBlockers.some(b=>rank[b]===1)?'P1':'P2',issues:[...x.reviewBlockers],suggestedAction:x.reviewBlockers.map(b=>({
  'no usable instructional sections':'Author and subject-matter-review genuine instructional content; do not fabricate from metadata',
  'no explicit learning outcomes':'Author measurable outcomes aligned to the original source and assessor requirements',
  'course mapping requires review':'Assign a verified canonical course identifier after curriculum-owner review',
  'missing identity/title':'Restore original identity/title from authoritative source',
  'no recognized learner/source lesson':'Investigate source schema and add a reviewed extractor'
 })[b]||'Investigate source'),reviewStatus:'needs-human-review',publicationApproved:false}));
 const order={P0:0,P1:1,P2:2};lessons.sort((a,b)=>order[a.priority]-order[b.priority]||a.id.localeCompare(b.id));
 const summary={totalDrafts:index.total,requiringReview:lessons.length,byPriority:{P0:0,P1:0,P2:0},byIssue:{...index.blockers}};
 for(const item of lessons)summary.byPriority[item.priority]++;
 return {schemaVersion:1,generatedFrom:'curriculum/lesson-normalization-index.json',policy:'Editorial queue only. No publication approvals or invented teaching content.',summary,lessons};
}
export function csv(queue){const quote=v=>'"'+String(v??'').replaceAll('"','""')+'"';return [['priority','id','title','sourceFile','sourceHash','issues','reviewStatus'],...queue.lessons.map(x=>[x.priority,x.id,x.title,x.sourceFile,x.sourceHash,x.issues.join('; '),x.reviewStatus])].map(row=>row.map(quote).join(',')).join('\n')+'\n';}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const index=buildIndex();const queue=createQueue(index);
 fs.writeFileSync(destination,JSON.stringify(queue,null,2)+'\n');fs.writeFileSync(csvPath,csv(queue));
 console.log(JSON.stringify({summary:queue.summary,json:destination,csv:csvPath}));
 if(process.argv.includes('--strict')&&queue.summary.requiringReview)process.exitCode=1;
}
