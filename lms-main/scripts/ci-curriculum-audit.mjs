#!/usr/bin/env node
/**
 * CI gate for Skilled curriculum structure and normalisation (ACA-020).
 *
 * Usage:
 *   node scripts/ci-curriculum-audit.mjs                 # check; exit 1 on any failure
 *   node scripts/ci-curriculum-audit.mjs --report <path> # also write a JSON review report
 *   node scripts/ci-curriculum-audit.mjs --write-baseline # rewrite the ratchet baseline (reviewers only)
 *   node scripts/ci-curriculum-audit.mjs --fail-on-blocked # also fail while any assessment is blocked (curriculum:ci uses this)
 *
 * Input: curriculum/courses/<course>/*.json and curriculum/shared/**\/*.json, the same set the publisher's file loader
 * indexes. Course manifests (JSON with no lesson id) are excluded and counted, not checked as lessons.
 *
 * Checks:
 *   1. Hard structure rules that must stay at zero (unparseable JSON, missing identity, duplicate IDs).
 *   2. Known-gap ratchet: each audit issue code and normalisation blocker may not exceed the committed
 *      baseline in curriculum/ci/curriculum-ci-baseline.json. Existing gaps are reported, not hidden.
 *   3. Normalisation invariants: no draft is marked publication-approved, and the committed index is
 *      not stale compared with a fresh normalisation of the source drafts.
 *   4. Assessment publication gate: every assessment is accounted for and none is approved without
 *      a matching human approval record.
 *   5. Curriculum self-tests that are dependency-free and currently passing.
 *
 * Exit codes: 0 pass, 1 check failed, 2 the script itself could not run.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildIndex } from './reconcile-lesson-formats.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const indexPath = path.join(root, 'curriculum/lesson-normalization-index.json');
const baselinePath = path.join(root, 'curriculum/ci/curriculum-ci-baseline.json');
const assessmentDir = path.join(root, 'curriculum/assessments');
const args = process.argv.slice(2);
const reportIndex = args.indexOf('--report');
const reportPath = reportIndex >= 0 ? path.resolve(args[reportIndex + 1] ?? '') : null;
if (reportIndex >= 0 && !args[reportIndex + 1]) {
  console.error('--report requires a path');
  process.exit(2);
}

/** Codes that must never appear, regardless of the baseline. */
const HARD_ISSUE_CODES = new Set(['INVALID_JSON', 'MISSING_ID', 'MISSING_TITLE', 'FILENAME_MISMATCH', 'DUPLICATE_ID', 'MISSING_STATUS']);
/** Self-tests that pass today and must keep passing. Failing assessment tests are reported separately. */
const SELF_TESTS = [
  'scripts/test-audit-curriculum.mjs',
  'scripts/test-reconcile-lesson-formats.mjs',
  'scripts/test-curriculum-review-queue.mjs',
  'scripts/test-assessment-reconciliation.mjs',
  'scripts/test-assessment-publication-negative-fixtures.mjs',
];

const failures = [];
const notes = [];
const fail = (check, detail) => failures.push({ check, detail });

function runNode(script, extra = []) {
  return spawnSync(process.execPath, [path.join(root, script), ...extra], { cwd: root, encoding: 'utf8', timeout: 120000 });
}

// 1 and 2: structural audit, executed as a child process so its own output contract is what is checked.
const audit = runNode('scripts/audit-curriculum.mjs', ['--json']);
if (audit.status !== 0 || !audit.stdout.trim()) {
  console.error('curriculum audit could not run:', audit.stderr || audit.error);
  process.exit(2);
}
const auditResult = JSON.parse(audit.stdout);
const auditCounts = {};
for (const issue of auditResult.issues) auditCounts[issue.code] = (auditCounts[issue.code] ?? 0) + 1;

for (const issue of auditResult.issues.filter((item) => HARD_ISSUE_CODES.has(item.code))) {
  fail('hard-structure', `${issue.code} in ${issue.file}: ${issue.message}`);
}

// Normalisation counts and invariants, from a fresh in-memory run.
let freshIndex = null;
try {
  freshIndex = buildIndex();
} catch (error) {
  fail('hard-structure', `normalisation could not read the drafts: ${error.message}`);
}
const normalisationCounts = freshIndex ? { ...freshIndex.blockers } : {};
if (freshIndex) {
  for (const lesson of freshIndex.lessons) {
    if (lesson.publicationApproved !== false) fail('publication-approval', `${lesson.id} is not explicitly unapproved`);
    if (!lesson.originalStatus) fail('source-status', `${lesson.id} lost its original review status`);
  }
  if (freshIndex.total !== auditResult.lessonCount) fail('normalisation-coverage', `normalised ${freshIndex.total} of ${auditResult.lessonCount} drafts`);

  let committedIndex = null;
  try {
    committedIndex = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  } catch (error) {
    fail('index-drift', `committed index unreadable: ${error.message}`);
  }
  if (committedIndex && JSON.stringify(committedIndex) !== JSON.stringify(freshIndex)) {
    fail('index-drift', 'curriculum/lesson-normalization-index.json is stale; run node scripts/reconcile-lesson-formats.mjs');
  }
}

// 2: ratchet against the baseline.
let baseline = { auditIssueCodes: {}, normalisationBlockers: {} };
if (fs.existsSync(baselinePath)) {
  baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
}
const ratchet = (label, current, allowed) => {
  if (args.includes('--write-baseline')) return;
  for (const code of new Set([...Object.keys(current), ...Object.keys(allowed)])) {
    const now = current[code] ?? 0;
    const before = allowed[code] ?? 0;
    if (now > before) fail(`ratchet-${label}`, `${code} rose from ${before} to ${now}`);
    if (now < before) notes.push(`${label} ${code} fell from ${before} to ${now}; lower the baseline after review`);
  }
};
ratchet('audit', auditCounts, baseline.auditIssueCodes);
ratchet('normalisation', normalisationCounts, baseline.normalisationBlockers);

// 4: assessment publication gate.
const failOnBlocked = args.includes('--fail-on-blocked');
const gate = runNode('scripts/validate-assessment-publication.mjs', failOnBlocked ? ['--fail-on-blocked'] : []);
const assessmentFiles = fs.readdirSync(assessmentDir).filter((name) => name.endsWith('.assessment.json')).length;
let gateSummary = null;
try {
  gateSummary = JSON.parse(gate.stdout);
} catch {
  fail('assessment-gate', 'publication gate produced no readable summary');
}
if (gateSummary) {
  if (gateSummary.total !== assessmentFiles) fail('assessment-gate', `gate covered ${gateSummary.total} of ${assessmentFiles} assessments`);
  const approvalsPath = process.env.ACADEMY_ASSESSMENT_APPROVALS || path.join(root, 'curriculum/assessment-publication-approvals.json');
  const approvals = fs.existsSync(approvalsPath) ? JSON.parse(fs.readFileSync(approvalsPath, 'utf8')) : {};
  const approvedRecords = Object.values(approvals).filter((entry) => entry?.status === 'approved').length;
  if (gateSummary.approved > approvedRecords) fail('assessment-gate', `${gateSummary.approved} assessments approved but only ${approvedRecords} approval records exist`);
  if (failOnBlocked && gateSummary.blocked > 0) fail('assessment-gate', `${gateSummary.blocked} assessments are blocked from publication; answer keys stay unpublished until each has a matching approval`);
}

// 5: self-tests.
const selfTestResults = SELF_TESTS.map((script) => {
  const result = runNode(script);
  if (result.status !== 0) fail('self-test', `${script} exited ${result.status}`);
  return { script, status: result.status === 0 ? 'passed' : 'failed' };
});

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  passed: failures.length === 0,
  source: auditResult.source,
  drafts: auditResult.lessonCount,
  manifestFiles: auditResult.manifests.length,
  auditIssueCodes: auditCounts,
  normalisationBlockers: normalisationCounts,
  assessmentGate: gateSummary ? { total: gateSummary.total, approved: gateSummary.approved, blocked: gateSummary.blocked, reasonCounts: gateSummary.reasonCounts } : null,
  selfTests: selfTestResults,
  failures,
  notes,
};

if (args.includes('--write-baseline') && freshIndex) {
  fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
  fs.writeFileSync(baselinePath, JSON.stringify({ schemaVersion: 1, auditIssueCodes: auditCounts, normalisationBlockers: normalisationCounts }, null, 2) + '\n');
  console.log(`baseline written: ${path.relative(root, baselinePath)}`);
}
if (reportPath) {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
}

console.log(`Curriculum CI: ${report.passed ? 'PASS' : 'FAIL'} - ${report.drafts} drafts, audit codes ${JSON.stringify(auditCounts)}, blockers ${JSON.stringify(normalisationCounts)}`);
console.log(`Assessment gate: ${gateSummary ? `${gateSummary.approved} approved, ${gateSummary.blocked} blocked of ${gateSummary.total}` : 'unavailable'}`);
for (const selfTest of selfTestResults) console.log(`self-test ${selfTest.status}: ${selfTest.script}`);
for (const note of notes) console.log(`note: ${note}`);
for (const failure of failures) console.log(`FAIL [${failure.check}] ${failure.detail}`);
process.exitCode = report.passed ? 0 : 1;
