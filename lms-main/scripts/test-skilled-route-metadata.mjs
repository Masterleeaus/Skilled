#!/usr/bin/env node
// Dependency-free guard for route privacy hints and the current Skilled public brand.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => fs.readFileSync(path.join(project, relative), 'utf8');
const privateRoutes = [
  "(auth)/login",
  "(auth)/register",
  "(auth)/forgot-password",
  "(auth)/reset-password",
  "(auth)/verify-email",
  "profile",
  "student",
  "student/quizzes/[quizId]",
  "student/assignments/[assignmentId]",
  "student/courses/[slug]",
  "student/courses/[slug]/discussions",
  "student/courses/[slug]/live-classes",
  "academy/assessor",
  "admin",
  "admin/users",
  "admin/users/[userId]",
  "admin/courses",
  "admin/business-context",
  "admin/lesson-review",
  "admin/lesson-review/[revisionId]",
  "teacher",
  "teacher/courses/new"
];
assert.equal(new Set(privateRoutes).size, privateRoutes.length, 'route list contains duplicate entries');
const helper = read('apps/frontend/src/lib/route-metadata.ts');
for (const expected of ['index: false', 'follow: false', 'nocache: true', 'referrer: "no-referrer"']) {
  assert.ok(helper.includes(expected), `missing metadata protection: ${expected}`);
}
let checked = 0;
for (const route of privateRoutes) {
  const file = `apps/frontend/src/app/${route}/layout.tsx`;
  const source = read(file);
  assert.match(source, /privateRouteMetadata\(/, `private metadata missing: ${file}`);
  assert.match(source, /export const metadata: Metadata/, `Next metadata export missing: ${file}`);
  assert.match(source, /return children;/, `layout must not wrap or remount page unexpectedly: ${file}`);
  assert.doesNotMatch(source, /Titan Academy/i, `legacy brand in route: ${file}`);
  checked++;
}
const publicCopy = [
  'apps/frontend/src/app/page.tsx',
  'apps/frontend/src/app/layout.tsx',
  'apps/frontend/src/app/manifest.ts',
  'apps/backend/src/jobs/email.queue.ts'
];
for (const file of publicCopy) {
  const source = read(file);
  assert.doesNotMatch(source, /Titan Academy/i, `outdated public brand in ${file}`);
  assert.match(source, /Skilled(?:At\.Work)?/, `current brand missing in ${file}`);
}
const emails = read('apps/backend/src/jobs/email.queue.ts');
assert.match(emails, /subject: "Verify your SkilledAt.Work account"/);
assert.match(emails, /subject: "Reset your SkilledAt.Work password"/);
assert.match(emails, /encodeURIComponent\(token\)/, 'token must remain URL encoded');
console.log(`PASS: ${checked} protected route metadata contracts and ${publicCopy.length} public brand surfaces`);
