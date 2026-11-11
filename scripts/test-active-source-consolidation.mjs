import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const frontend = resolve(root, 'apps/frontend/src');
const backend = resolve(root, 'apps/backend');

test('learner and teacher route wrappers use the same canonical thread component', () => {
  const paths = ['student', 'teacher'].map(role =>
    resolve(frontend, 'app', role, 'courses/[slug]/discussions/[threadId]/page.tsx'));
  const [student, teacher] = paths.map(path => readFileSync(path, 'utf8'));
  assert.equal(student, teacher);
  assert.match(student, /import \{ DiscussionThreadDetail \} from "@\/components\/DiscussionThreadDetail"/);
  assert.match(student, /return <DiscussionThreadDetail \/>/);
  const component = readFileSync(resolve(frontend, 'components/DiscussionThreadDetail.tsx'), 'utf8');
  for (const operation of ['fetchThread', 'addReply', 'resolveThread', 'pinReply']) {
    assert.match(component, new RegExp('\\b' + operation + '\\b'));
  }
  assert.match(component, /user\.role !== "STUDENT"/);
});

test('auth and permission canonical implementations remain while duplicates are absent', () => {
  assert.ok(existsSync(resolve(backend, 'src/modules/auth/token.utils.ts')));
  assert.ok(existsSync(resolve(backend, 'src/tests/permissions.test.ts')));
  assert.ok(!existsSync(resolve(backend, 'src/utils/token.ts')));
  assert.ok(!existsSync(resolve(backend, 'tests/permissions.ts')));
});
