#!/usr/bin/env node
// Dependency-free curriculum QA over the authoring set the publisher indexes (curriculum/courses + curriculum/shared).
// Validates every lesson without claiming publication approval.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { listAuthoringFiles, isManifest } from './reconcile-lesson-formats.mjs';
const sources = listAuthoringFiles();
const ids = new Map(), issues = [], lessons = [], statuses = {}, courses = {}, manifests = [];
let lessonCount = 0;
function issue(file, code, message) { issues.push({file,code,message}); }
function isText(s) { return typeof s === 'string' && s.trim().length > 0; }
for (const { file: abs, rel } of sources) {
  let doc;
  try { doc = JSON.parse(fs.readFileSync(abs,'utf8')); }
  catch (error) { lessonCount++; issue(rel,'INVALID_JSON',error.message); continue; }
  if (isManifest(rel, doc)) { manifests.push(rel); continue; }
  lessonCount++;
  const file = path.basename(rel);
  if (!isText(doc.id)) issue(rel,'MISSING_ID','Missing lesson identifier');
  if (!isText(doc.title)) issue(rel,'MISSING_TITLE','Missing title');
  if (isText(doc.id) && file !== `${doc.id}.json`) issue(rel,'FILENAME_MISMATCH',`Expected ${doc.id}.json`);
  if (ids.has(doc.id)) issue(rel,'DUPLICATE_ID',`Also in ${ids.get(doc.id)}`);
  else ids.set(doc.id,rel);
  if (!isText(doc.status)) issue(rel,'MISSING_STATUS','Review status required');
  if (!Array.isArray(doc.learningOutcomes) || !doc.learningOutcomes.some(isText)) issue(rel,'MISSING_OUTCOMES','No learning outcomes');
  if (!Array.isArray(doc.instruction) || !doc.instruction.some(s=>isText(s?.body))) issue(rel,'MISSING_INSTRUCTION','No instruction sections');
  if (!Array.isArray(doc.courseSlugs) || !doc.courseSlugs.some(isText)) issue(rel,'MISSING_COURSE','No course association');
  for (const c of Array.isArray(doc.courseSlugs) ? doc.courseSlugs : []) if (isText(c)) courses[c]=(courses[c]||0)+1;
  statuses[doc.status]=(statuses[doc.status]||0)+1;
  lessons.push({id:doc.id,title:doc.title,status:doc.status,sha256:crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex')});
}
const result={schemaVersion:1,source:'curriculum/courses + curriculum/shared',lessonCount,parsedCount:lessons.length,uniqueLessonIds:ids.size,manifests,issues,issueCount:issues.length,statuses,courses,lessons};
if (process.argv.includes('--json')) console.log(JSON.stringify(result,null,2));
else console.log(`Curriculum audit: ${result.parsedCount}/${result.lessonCount} parsed, ${issues.length} issues, ${Object.keys(courses).length} courses; status: ${JSON.stringify(statuses)}`);
if (process.argv.includes('--strict') && issues.length) process.exitCode=1;
