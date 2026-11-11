#!/usr/bin/env node
/** Negative fixtures for ACA-020: malformed assessment files cannot become publishable. */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const project=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const fixtureDir=path.join(project,'tests/fixtures/assessment-publication');
const validator=path.join(project,'scripts/validate-assessment-publication.mjs');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'skilled-negative-publication-'));
const expected=["invalid_json","identity_mismatch","missing_answer_keys","duplicate_or_missing_answer_id","invalid_answer_index","invalid_answer_index","invalid_answer_index","invalid_answer_index","missing_rationale","missing_rationale","missing_practical_criteria","missing_practical_criteria","unconfigured_pass_rule","unconfigured_pass_rule","invalid_evidence_requirements","invalid_evidence_requirements","invalid_stop_work_criteria","invalid_stop_work_criteria","duplicate_or_missing_answer_id","duplicate_or_missing_answer_id"];
try {
  const curriculum=path.join(temp,'curriculum');
  const assessments=path.join(curriculum,'assessments');
  fs.mkdirSync(assessments,{recursive:true});
  const names=fs.readdirSync(fixtureDir).filter(x=>x.endsWith('.assessment.json')).sort();
  assert.equal(names.length,expected.length,'All 20 negative fixtures must be present');
  for(const name of names)fs.copyFileSync(path.join(fixtureDir,name),path.join(assessments,name));
  fs.writeFileSync(path.join(curriculum,'assessment-publication-approvals.json'),'{}\n');
  const run=(strict)=>{
    const report=path.join(temp,strict?'strict.json':'diagnostic.json');
    const argv=[validator,`--curriculum-root=${temp}`,report,...(strict?['--fail-on-blocked']:[])];
    const result=spawnSync(process.execPath,argv,{encoding:'utf8',maxBuffer:4*1024*1024,timeout:30000});
    assert.ok(fs.existsSync(report),`Validator must write a report; stderr: ${result.stderr}`);
    return {exit:result.status,summary:JSON.parse(fs.readFileSync(report,'utf8'))};
  };
  const diagnostic=run(false);
  assert.equal(diagnostic.exit,0,'Diagnostic mode must report blockers without failing');
  assert.equal(diagnostic.summary.total,expected.length);
  assert.equal(diagnostic.summary.approved,0,'No negative fixture may be approved');
  assert.equal(diagnostic.summary.blocked,expected.length);
  assert.equal(diagnostic.summary.records.length,expected.length);
  for(let i=0;i<expected.length;i++){
    const id=`CI-${String(i+1).padStart(2,'0')}`;
    const item=diagnostic.summary.records.find(r=>r.filename===`${id}.assessment.json`);
    assert.ok(item,`Missing fixture report ${id}`);
    assert.equal(item.status,'blocked',`Fixture ${id} unexpectedly approved`);
    assert.ok(item.reasons.includes(expected[i]),`Fixture ${id} must report ${expected[i]}; got ${item.reasons.join(', ')}`);
    assert.match(item.sha256,/^[a-f0-9]{64}$/,`Fixture ${id} must carry a source hash`);
  }
  const strict=run(true);
  assert.equal(strict.exit,1,'Strict publication gate must fail when any file is blocked');
  assert.equal(strict.summary.blocked,expected.length);
  assert.equal(strict.summary.approved,0);
  console.log(`PASS: ${names.length} malformed assessment cases rejected; diagnostic exit 0, strict exit 1`);
} finally {
  fs.rmSync(temp,{recursive:true,force:true});
}
