#!/usr/bin/env node
/**
 * Verify the real assessment publication validator with isolated source lesson and
 * approval fixtures, including clean strict-pass and strict-fail behavior.
 * No canonical assessment, curriculum lesson or real approval file is modified.
 */
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixturesDir = path.join(root, 'tests/fixtures/publication-gate-contract');
const scriptsDir = path.join(root, 'scripts');
const cases = fs.readdirSync(fixturesDir).filter(name => /^PG-\d{2}-.*\.json$/.test(name)).sort();
assert.equal(cases.length, 28, 'The full 28-case approval contract is required');
let passed = 0, accepted = 0, rejected = 0;
const counts = {};

function evaluate(config, filename) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'skilled-approval-contract-'));
  try {
    for (const dir of ['scripts', 'curriculum/assessments', 'curriculum/courses/synthetic']) {
      fs.mkdirSync(path.join(temp, dir), { recursive: true });
    }
    // Execute unchanged production validator and reconciler under an isolated
    // temporary root, because both derive the canonical root from import.meta.url.
    for (const name of ['validate-assessment-publication.mjs', 'reconcile-assessment-questions.mjs']) {
      fs.copyFileSync(path.join(scriptsDir, name), path.join(temp, 'scripts', name));
    }
    const id = 'SYNTHETIC-PUBLICATION-01';
    const lesson = {
      id, title: 'Synthetic only - never publish', status: 'DRAFT',
      courseSlugs: ['synthetic-course'], learningOutcomes: ['Identify safe steps'],
      instruction: [{ heading: 'Step', body: 'Stop when the operation is unsafe.' }],
      knowledgeChecks: [{ id: 'Q1', question: 'Select safe action', options: ['Stop', 'Continue', 'Escalate'] }],
      ...config.lessonPatch,
    };
    if (!config.removeLesson) {
      fs.writeFileSync(path.join(temp, 'curriculum/courses/synthetic', id + '.json'),
        JSON.stringify(lesson, null, 2) + '\n');
    }
    const assessment = {
      lessonId: id, knowledgeAnswers: [{ id: 'Q1', correctIndex: 0, rationale: 'Correct' }],
      practicalCriteria: ['Demonstrate the approved safe procedure'],
      passRule: '80% minimum', evidenceRequired: [], stopWorkCriteria: [],
      ...config.assessmentPatch,
    };
    const assessmentPath = path.join(temp, 'curriculum/assessments', id + '.assessment.json');
    const assessmentBytes = config.rawAssessment ?? JSON.stringify(assessment, null, 2) + '\n';
    fs.writeFileSync(assessmentPath, assessmentBytes);
    const approval = {
      status: 'approved', reviewer: 'Alex Reviewer',
      reviewedAt: '2025-06-01T00:00:00Z',
      sha256: crypto.createHash('sha256').update(assessmentBytes).digest('hex'),
      ...config.approvalPatch,
    };
    const approvals = config.removeApproval ? {} : { [id]: approval };
    fs.writeFileSync(path.join(temp, 'curriculum/assessment-publication-approvals.json'),
      JSON.stringify(approvals, null, 2) + '\n');
    const reportPath = path.join(temp, 'gate-report.json');
    const proc = spawnSync(process.execPath,
      [path.join(temp, 'scripts/validate-assessment-publication.mjs'), reportPath, '--fail-on-blocked'],
      { cwd: temp, encoding: 'utf8', timeout: 15000, maxBuffer: 2 * 1024 * 1024 }
    );
    assert.ok(fs.existsSync(reportPath),
      `${filename}: gate must produce a report; exit=${proc.status}; stderr=${proc.stderr}`);
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    assert.equal(report.total, 1, `${filename}: exactly one isolated assessment`);
    assert.equal(report.records.length, 1, `${filename}: exactly one detailed record`);
    assert.equal(report.records[0].filename, id + '.assessment.json');
    assert.match(report.records[0].sha256, /^[a-f0-9]{64}$/);
    if (config.expectedApproved) {
      assert.equal(proc.status, 0, `${filename}: reviewed assessment should pass strict gate; stderr=${proc.stderr}`);
      assert.equal(report.approved, 1, `${filename}: expected exactly one approved assessment`);
      assert.equal(report.blocked, 0);
      assert.deepEqual(report.records[0].reasons, []);
      accepted++;
    } else {
      assert.equal(proc.status, 1, `${filename}: blocked assessment must fail strict gate; stderr=${proc.stderr}`);
      assert.equal(report.approved, 0);
      assert.equal(report.blocked, 1);
      assert.ok(report.records[0].reasons.includes(config.expectedReason),
        `${filename}: required ${config.expectedReason} among ${report.records[0].reasons.join(', ')}`);
      counts[config.expectedReason] = (counts[config.expectedReason] || 0) + 1;
      rejected++;
    }
    passed++;
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}
for (const filename of cases) {
  const config = JSON.parse(fs.readFileSync(path.join(fixturesDir, filename), 'utf8'));
  assert.equal(typeof config.expectedApproved, 'boolean', filename);
  assert.equal(typeof config.name, 'string', filename);
  if (!config.expectedApproved) assert.equal(typeof config.expectedReason, 'string', filename);
  evaluate(config, filename);
}
assert.equal(accepted, 4, 'Exactly four approved synthetic paths are covered');
assert.equal(rejected, 24, 'Exactly 24 blocked synthetic paths are covered');
console.log(JSON.stringify({
  result: 'PASS', total: passed, cleanStrictPass: accepted,
  blockedStrictFail: rejected, refusedReasons: counts,
  realContentApproved: 0, canonicalCurriculumChanged: false,
}, null, 2));
