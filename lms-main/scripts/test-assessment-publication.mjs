#!/usr/bin/env node
// Human approvals are external source records; do not silently create or infer them.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const validator = path.join(root, 'scripts/validate-assessment-publication.mjs');
const assessmentDir = path.join(root, 'curriculum/assessments');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'academy-gate-'));
let assertions = 0;
function check(condition, message) { assert.ok(condition, message); assertions++; }
function run(approvals, strict = false) {
  const report = path.join(temp, `report-${Math.random().toString(36).slice(2)}.json`);
  const env = { ...process.env, ACADEMY_ASSESSMENT_APPROVALS: approvals };
  const cmd = [validator, report, ...(strict ? ['--fail-on-blocked'] : [])];
  const result = spawnSync(process.execPath, cmd, { encoding: 'utf8', env, maxBuffer: 8 * 1024 * 1024 });
  return { status: result.status, stderr: result.stderr, data: fs.existsSync(report) ? JSON.parse(fs.readFileSync(report, 'utf8')) : null };
}
try {
  const approvalsPath = path.join(temp, 'approvals.json');
  fs.writeFileSync(approvalsPath, '{}\n');
  const baseline = run(approvalsPath);
  check(baseline.status === 0, 'Diagnostic mode succeeds');
  const data = baseline.data;
  const count = fs.readdirSync(assessmentDir).filter(x => x.endsWith('.assessment.json')).length;
  check(data.total === count && data.records.length === count, 'Gate checks every canonical assessment');
  check(data.blocked === count && data.approved === 0, 'No implicit approvals');
  check(data.reasonCounts.missing_or_stale_human_approval === count, 'Every unapproved assessment blocked');
  check(data.records.every(r => /^[a-f0-9]{64}$/.test(r.sha256)), 'Source hashes captured');
  check(run(approvalsPath, true).status === 1, 'Strict mode fails closed');
  const candidate = data.records.find(r => r.reasons.length === 1 && r.reasons[0] === 'missing_or_stale_human_approval');
  check(Boolean(candidate), 'At least one assessment has no other technical blockers');
  if (candidate) {
    const approval = { [candidate.lessonId]: { status: 'approved', sha256: candidate.sha256, reviewer: 'Assessment QA', reviewedAt: '2026-11-02T00:00:00Z' } };
    fs.writeFileSync(approvalsPath, JSON.stringify(approval));
    const verified = run(approvalsPath);
    check(verified.data.records.find(r => r.lessonId === candidate.lessonId)?.status === 'approved', 'Valid human approval accepted for unchanged assessment');
    check(verified.data.approved === 1, 'Only explicitly approved eligible item released');
    check(verified.data.blocked === count - 1, 'All other items remain blocked');
    approval[candidate.lessonId].sha256 = 'invalid';
    fs.writeFileSync(approvalsPath, JSON.stringify(approval));
    check(run(approvalsPath).data.approved === 0, 'Stale hash revokes approval');
    approval[candidate.lessonId].sha256 = candidate.sha256;
    approval[candidate.lessonId].reviewer = '';
    fs.writeFileSync(approvalsPath, JSON.stringify(approval));
    check(run(approvalsPath).data.approved === 0, 'Missing reviewer rejects approval');
    approval[candidate.lessonId].reviewer = 'Assessment QA';
    approval[candidate.lessonId].reviewedAt = 'not-a-date';
    fs.writeFileSync(approvalsPath, JSON.stringify(approval));
    check(run(approvalsPath).data.approved === 0, 'Invalid review date rejects approval');
    approval[candidate.lessonId].reviewedAt = '2026-99-99T99:99:99Z';
    fs.writeFileSync(approvalsPath, JSON.stringify(approval));
    check(run(approvalsPath).data.approved === 0, 'Malformed ISO-like date rejects approval');
  }
  console.log(`PASS: ${assertions} publication gate assertions; current assessment count ${count}; external human approvals not assumed`);
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
