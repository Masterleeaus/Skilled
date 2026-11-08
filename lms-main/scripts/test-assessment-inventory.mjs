#!/usr/bin/env node
// Compare a fresh audit to the actual filesystem; Pass 39 remains a historical snapshot.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assessmentDir = path.join(root, 'curriculum/assessments');
const sourceFiles = fs.readdirSync(assessmentDir).filter(name => name.endsWith('.assessment.json'));
const reportDir = fs.mkdtempSync(path.join(os.tmpdir(), 'academy-inventory-'));
try {
  const reportPath = path.join(reportDir, 'inventory.json');
  const result = spawnSync(process.execPath, [path.join(root, 'scripts/audit-assessment-inventory.mjs'), reportPath], {
    encoding: 'utf8', maxBuffer: 16 * 1024 * 1024,
  });
  assert.equal(result.status, 0, `Inventory audit must not have structural errors: ${result.stderr}\n${result.stdout}`);
  const data = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  let assertions = 0;
  function check(value, message) { assert.ok(value, message); assertions++; }
  check(data.assessmentCount === sourceFiles.length, 'Every canonical file audited');
  check(data.assessments.length === sourceFiles.length, 'Every canonical entry recorded');
  check(data.assessmentCount >= 841, 'Historical baseline of 841 assessments has not been lost');
  check(data.publicationApproved === 0, 'Inventory does not fabricate approvals');
  check(new Set(data.assessments.map(a => a.lessonId)).size === data.assessments.length, 'Unique lesson IDs');
  check(new Set(data.assessments.map(a => a.file)).size === data.assessments.length, 'Unique files');
  check(data.assessments.every(a => a.publicationStatus === 'requires_editorial_approval'), 'Review flag is conservative');
  check(data.assessments.every(a => /^[a-f0-9]{64}$/.test(a.sha256)), 'Every source hashed');
  check(data.assessments.every(a => {
    const file = path.resolve(root, a.file);
    return file.startsWith(assessmentDir + path.sep) && fs.existsSync(file) &&
      a.sha256 === crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  }), 'Every current digest matches current source bytes');
  check(data.assessments.every(a => a.knowledgeAnswerCount >= 0 && a.practicalCriteriaCount >= 0), 'Counts nonnegative');
  check(data.findings.length === data.issues, 'Finding count matches');
  check(data.findings.every(f => ['error', 'review'].includes(f.severity)), 'Finding severities valid');
  check(data.assessments.every(a => Array.isArray(a.sourceCandidates)), 'Source candidates tracked');
  check(data.assessments.every(a => a.sourceCandidates.every(f => fs.existsSync(path.join(root, f)))), 'Source candidates exist');
  const historical = JSON.parse(fs.readFileSync(path.join(root, 'curriculum/assessment-inventory-pass39.json'), 'utf8'));
  check(historical.assessmentCount === historical.assessments.length, 'Historical Pass 39 record still intact');
  check(data.assessmentCount >= historical.assessmentCount, 'Current inventory has not regressed below Pass 39');
  console.log(`PASS: ${assertions} current inventory and historical continuity assertions; ${data.assessmentCount} assessments, ${data.issues} review findings`);
} finally {
  fs.rmSync(reportDir, { recursive: true, force: true });
}
