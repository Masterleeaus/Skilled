#!/usr/bin/env node
// Offline, deterministic curriculum checks. This is not a substitute for dependency builds or database/browser tests.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checks = [
  'test-skilled-route-metadata.mjs',
  'test-auth-route-contracts.mjs',
  'test-session-lifecycle-contract.mjs',
  'test-quiz-integrity-contract.mjs',
  'test-multiselect-quiz.mjs',
  'test-quiz-access-grading.mjs',
  'test-teacher-grading-workflow.mjs',
  'test-course-publication-access.mjs',
  'test-lesson-privacy.mjs',
  'test-video-upload-safety.mjs',
  'test-private-video-playback.mjs',
  'test-workspace-lockfile.mjs',
  'test-migration-readiness.mjs',
  'test-schema-migration-parity.mjs',
  'test-academy-deployment-contract.mjs',
  'test-academy-runtime-guards.mjs',
  'test-payment-security-contract.mjs',
  'test-worker-runtime-contract.mjs',
  'test-certificate-eligibility.mjs',
  'test-assignment-integrity.mjs',
  'test-assessment-inventory.mjs',
  'test-assessment-publication.mjs',
  'test-assessment-reconciliation.mjs',
  'test-audit-curriculum.mjs',
  'test-curriculum-review-queue.mjs',
  'test-master-improvement-register.mjs',
  'test-reconcile-lesson-formats.mjs',
  'test-lesson-normalization-fixtures.mjs',
  'test-rebuild-curriculum-derived.mjs',
  'test-assessment-publication-negative-fixtures.mjs',
  'test-audit-active-compatibility.mjs',
  'test-audit-inactive-source-boundaries.mjs',
  'test-audit-canonical-import-manifest.mjs',
  'test-audit-course-art-manifest.mjs',
  'test-prepare-public-assets.mjs',
  'test-public-topbar-navigation.mjs',
  'test-account-flow-branding.mjs',
  'test-active-source-consolidation.mjs',
  'test-audit-public-product-identity.mjs',
  'test-audit-curriculum-brand.mjs',
  'test-curriculum-brand-fixtures.mjs',
  'test-skilled-public-brand.mjs',
  'test-deployment-doc-contract.mjs',
];
let failed = 0;
for (const test of checks) {
  const result = spawnSync(process.execPath, [path.join(root, 'scripts', test)], {
    encoding: 'utf8', maxBuffer: 16 * 1024 * 1024,
  });
  const ok = result.status === 0;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${test}`);
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (!ok) failed++;
}
console.log(`ACADEMY SOURCE VERIFICATION: ${checks.length - failed}/${checks.length} scripts passed`);
if (failed) process.exitCode = 1;
