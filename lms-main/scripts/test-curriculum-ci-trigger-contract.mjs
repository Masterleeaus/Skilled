#!/usr/bin/env node
// Regression contract for curriculum CI trigger coverage (issue #26).
// Intentionally dependency-free: this test should run before any install/build.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const workflow = fs.readFileSync(path.join(root, '.github/workflows/curriculum-ci.yml'), 'utf8');
const blocks = {};
for (const event of ['pull_request', 'push']) {
  const match = workflow.match(new RegExp('^  ' + event + ':\\n([\\s\\S]*?)(?=^  (?:pull_request|push|workflow_dispatch):|^permissions:)', 'm'));
  assert.ok(match, 'Missing ' + event + ' trigger');
  blocks[event] = [...match[1].matchAll(/^      - ["']([^"']+)["']$/gm)].map(m => m[1]);
}
function matches(pattern, filename) {
  const escape = (piece) => [...piece].map(char => '.^$+?()[]{}|\\\\'.includes(char) ? '\\\\' + char : char).join('');
  const expression = pattern.split('**').map(segment => segment.split('*').map(escape).join('[^/]*')).join('.*');
  return new RegExp('^' + expression + '$').test(filename);
}
const required = [
  'lms-main/curriculum/courses/example/lesson.json',
  'lms-main/curriculum/assessments/example.assessment.json',
  'lms-main/curriculum/lesson-normalization-index.json',
  'lms-main/curriculum/ci/curriculum-ci-baseline.json',
  'lms-main/scripts/ci-curriculum-audit.mjs',
  'lms-main/scripts/validate-assessment-publication.mjs',
  'lms-main/scripts/reconcile-lesson-formats.mjs',
  'lms-main/scripts/test-assessment-publication.mjs',
  'lms-main/apps/backend/src/modules/curriculum/curriculum-publisher.ts',
  'lms-main/apps/backend/src/modules/curriculum/curriculum.routes.ts',
  'lms-main/apps/backend/src/modules/curriculum/lesson-review.service.ts',
  'lms-main/apps/backend/src/modules/courses/lesson.service.ts',
  'lms-main/apps/backend/src/modules/courses/course.service.ts',
  'lms-main/apps/backend/src/modules/quizzes/quiz.routes.ts',
  'lms-main/apps/backend/prisma/schema.prisma',
  'lms-main/apps/backend/prisma/seed.ts',
  'lms-main/apps/backend/prisma/migrations/20261108140000_certificate_verification_token/migration.sql',
  'lms-main/apps/backend/src/tests/academy-enrolment-progress.test.ts',
  'lms-main/package.json',
  '.github/workflows/curriculum-ci.yml',
  '.github/workflows/curriculum-ci-trigger-contract.yml',
];
for (const event of ['pull_request', 'push']) {
  test(event + ': all 21 publication-sensitive paths trigger CI', () => {
    for (const filename of required) {
      assert.ok(blocks[event].some(p => matches(p, filename)), event + ' does not cover ' + filename);
    }
  });
  test(event + ': unrelated source changes do not trigger curriculum gate', () => {
    for (const filename of ['README.md', 'brand/logo.svg', 'library/example.jpg', 'lms-main/apps/frontend/public/icon.png']) {
      assert.ok(!blocks[event].some(p => matches(p, filename)), 'Unexpected CI trigger: ' + filename);
    }
  });
}
test('workflow uses frozen lockfile and strict curriculum gate', () => {
  assert.match(workflow, /pnpm install --frozen-lockfile/);
  assert.match(workflow, /run: pnpm curriculum:ci/);
  const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'lms-main/package.json'), 'utf8'));
  assert.match(packageJson.scripts['curriculum:ci'], /--fail-on-blocked/);
  assert.match(packageJson.scripts['curriculum:ci'], /ci-curriculum-audit\.mjs/);
});
test('failed checks retain JSON report for review, never publish approvals', () => {
  assert.match(workflow, /name: curriculum-ci-report/);
  assert.match(workflow, /if: always\(\)/);
  assert.match(workflow, /path: lms-main\/build\/curriculum-ci-report\.json/);
  assert.doesNotMatch(workflow, /--write-baseline|auto.?approv|publish-assessments/i);
});
