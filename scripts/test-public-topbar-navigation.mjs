import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = file => readFileSync(resolve(root,file),'utf8');

test('public course browsers use Topbar without requiring auth', () => {
  const publicCourseList = read('apps/frontend/src/app/courses/page.tsx');
  assert.match(publicCourseList, /<Topbar title="Browse Courses" \/>/);
  assert.doesNotMatch(publicCourseList,/useRequireAuth\(/);
});

test('shared header navigates anonymous visitors home and exposes login/register', () => {
  const header = read('apps/frontend/src/components/Topbar.tsx');
  assert.match(header, /href=\{homeHref \?\? "\/"\}/);
  assert.match(header, /aria-label=\{homeHref \? "SkilledAt.Work dashboard" : "SkilledAt.Work home"\}/);
  assert.match(header, /\{homeHref \? \(/);
  assert.match(header, /href="\/login"/);
  assert.match(header, /href="\/register"/);
  assert.match(header, /href=\{homeHref\}/);
  assert.match(header, /\{user\?\.fullName\}/);
});

test('dashboard helper fails closed for absent user, and covers three existing roles', () => {
  const helper = read('apps/frontend/src/lib/dashboard-link.ts');
  assert.match(helper, /if \(!user\) return null/);
  for (const [role,path] of [['ADMIN','admin'],['TEACHER','teacher'],['STUDENT','student']]) {
    assert.ok(helper.includes('case "'+role+'": return "/'+path+'";'));
  }
  assert.match(helper,/default: return null/);
});

test('account dropdown remains authenticated-only and keyboard dismissible', () => {
  const header = read('apps/frontend/src/components/Topbar.tsx');
  assert.match(header,/if \(e\.key === "Escape"\) setMenuOpen\(false\)/);
  assert.match(header,/document\.removeEventListener\("keydown", handleEscape\)/);
  assert.match(header,/aria-expanded=\{menuOpen\}/);
  assert.match(header,/role="menu"/);
  assert.match(header,/role="menuitem"/);
  assert.match(header,/await logoutApi\(\)/);
});
