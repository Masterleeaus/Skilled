#!/usr/bin/env node
// Source contract for the accessible skip navigation proposed in issue #33.
// This catches accidental regressions; runtime keyboard/AT verification is still required.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const app = path.join(root, 'src/app');
const read = (route) => fs.readFileSync(path.join(app, route, 'page.tsx'), 'utf8');
const routes = [
  '(auth)/forgot-password','(auth)/login','(auth)/register',
  '(auth)/reset-password','(auth)/verify-email','academy/assessor',
  'admin/courses','admin/lesson-review','admin/users','courses',
  'pathways','profile','student/assignments/[assignmentId]','student',
  'student/certificates','student/quizzes/[quizId]','teacher/courses/[slug]/assignments/new',
  'teacher/courses/[slug]/quizzes/new','teacher/courses/[slug]/students',
  'teacher/courses/new','teacher',
];
const layout = fs.readFileSync(path.join(app, 'layout.tsx'), 'utf8');
assert.match(layout, /href="#main-content"/, 'Global skip navigation must target main content');
assert.match(layout, /Skip to main content/, 'Global skip link must provide an accessible label');
assert.match(layout, /focus:not-sr-only/, 'Global skip link must become visible on focus');
let tested = 0;
for (const route of routes) {
  const source = read(route);
  assert.match(source, /id=["']main-content["']/, route + ' must be a skip target');
  assert.match(source, /tabIndex=\{-1\}/, route + ' main target must be focusable programmatically');
  assert.match(source, /<main\b/, route + ' needs a main landmark');
  tested++;
}
console.log('PASS: global skip link and ' + tested + ' route landmarks; runtime keyboard checks still required');
