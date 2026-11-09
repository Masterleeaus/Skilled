#!/usr/bin/env node
/**
 * Real validator malformed-input regression: each of 20 hostile JSON shapes must
 * return a structured strict-gate refusal rather than throwing or exiting 2.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dir=path.join(root,'tests/fixtures/assessment-malformed');
const files=fs.readdirSync(dir).filter(f=>/^AM-\d{2}-.*\.json$/.test(f)).sort();
assert.equal(files.length,20,'Exactly 20 malformed assessment fixtures required');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'skilled-malformed-assessment-'));
try {
  const scriptDir=path.join(temp,'scripts');
  const assessmentDir=path.join(temp,'curriculum/assessments');
  const courseDir=path.join(temp,'curriculum/courses/synthetic');
  fs.mkdirSync(scriptDir,{recursive:true});
  fs.mkdirSync(assessmentDir,{recursive:true});
  fs.mkdirSync(courseDir,{recursive:true});
  for(const name of ['validate-assessment-publication.mjs','reconcile-assessment-questions.mjs']){
    fs.copyFileSync(path.join(root,'scripts',name),path.join(scriptDir,name));
  }
  const id='SYNTHETIC-MALFORMED';
  const lesson={
    id,title:'Synthetic malformed assessment lesson',status:'DRAFT',courseSlugs:['synthetic'],
    learningOutcomes:['Identify the safest response'],
    instruction:[{heading:'Procedure',body:'Apply the stop-work procedure'}],
    knowledgeChecks:[{id:'Q1',question:'Which action is safe?',options:['Stop','Ignore','Continue']}],
  };
  fs.writeFileSync(path.join(courseDir,id+'.json'),JSON.stringify(lesson,null,2)+'\n');
  fs.writeFileSync(path.join(temp,'curriculum/assessment-publication-approvals.json'),'{}\n');
  const results=[];
  for(const filename of files){
    const fixture=JSON.parse(fs.readFileSync(path.join(dir,filename),'utf8'));
    const base={
      lessonId:id,knowledgeAnswers:[{id:'Q1',correctIndex:0,rationale:'Stop safely'}],
      practicalCriteria:['Demonstrate a safe response'],passRule:'80% minimum',
      evidenceRequired:[],stopWorkCriteria:[],
    };
    const payload=fixture.payload;
    const doc=payload&&typeof payload==='object'&&!Array.isArray(payload)?{...base,...payload}:payload;
    const inputFile=path.join(assessmentDir,id+'.assessment.json');
    fs.writeFileSync(inputFile,JSON.stringify(doc,null,2)+'\n');
    const report=path.join(temp,'report-'+filename);
    const result=spawnSync(process.execPath,
      [path.join(scriptDir,'validate-assessment-publication.mjs'),report,'--fail-on-blocked'],
      {cwd:temp,encoding:'utf8',timeout:15000,maxBuffer:1024*1024});
    assert.equal(result.status,1,
      `${filename} expected an explicit blocked status (1), got ${result.status}: ${result.stderr}`);
    assert.ok(fs.existsSync(report),`${filename} must produce a JSON report`);
    const record=JSON.parse(fs.readFileSync(report,'utf8'));
    assert.equal(record.total,1,`${filename} must account for exactly one file`);
    assert.equal(record.blocked,1,`${filename} must reject malformed source`);
    assert.equal(record.approved,0,`${filename} must not publish a malformed source`);
    assert.equal(record.records[0].status,'blocked');
    assert.ok(record.records[0].reasons.includes(fixture.expectedReason),
      `${filename}: expected ${fixture.expectedReason}, got ${record.records[0].reasons.join(',')}`);
    results.push({scenario:fixture.scenario,code:fixture.expectedReason});
  }
  console.log(JSON.stringify({result:'PASS',fixtures:results.length,blocked:results.length,
    approvalsAdded:0,canonicalSourcesChanged:0,scenarios:results},null,2));
}finally{
  fs.rmSync(temp,{recursive:true,force:true});
}
