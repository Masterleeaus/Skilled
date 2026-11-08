import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = file => readFileSync(resolve(root, file), 'utf8');
const pages = ['login', 'register', 'verify-email', 'forgot-password', 'reset-password'];

test('all five learner account screens use one canonical Skilled brand component', () => {
  const component = read('apps/frontend/src/components/AuthBrand.tsx');
  assert.match(component, /SkilledAt\.Work/);
  assert.match(component, /aria-label="SkilledAt\.Work home"/);
  assert.match(component, /href="\/"/);
  for (const name of pages) {
    const source = read(`apps/frontend/src/app/(auth)/${name}/page.tsx`);
    assert.match(source, /import \{ AuthBrand \} from "@\/components\/AuthBrand"/, name);
    assert.match(source, /<AuthBrand \/>/, name);
    assert.doesNotMatch(source, /Titan Academy|generic LMS/i, name);
  }
});

test('login and registration preserve live error announcement and role-aware navigation', () => {
  const login = read('apps/frontend/src/app/(auth)/login/page.tsx');
  const register = read('apps/frontend/src/app/(auth)/register/page.tsx');
  assert.match(login, /role="alert".*serverError/);
  assert.match(register, /role="alert".*serverError/);
  assert.match(login, /result\.user\.role === "ADMIN"/);
  assert.match(register, /Teaching and organisation access require authorisation/);
  assert.match(register, /await registerUser\(values\)/);
});

test('account token flow guards and recovery routes remain intact', () => {
  const verify = read('apps/frontend/src/app/(auth)/verify-email/page.tsx');
  const reset = read('apps/frontend/src/app/(auth)/reset-password/page.tsx');
  const forgot = read('apps/frontend/src/app/(auth)/forgot-password/page.tsx');
  assert.match(verify, /submitted\.current/);
  assert.match(verify, /await verifyEmail\(token\)/);
  assert.match(reset, /await resetPassword\(token, password\)/);
  assert.match(reset, /password !== confirm/);
  assert.match(forgot, /If an account exists for that email/);
  assert.match(forgot, /await forgotPassword\(email\)/);
});

test('notifications are not falsely represented as an active API', () => {
  const app = read('apps/backend/src/app.ts');
  const schema = read('apps/backend/prisma/schema.prisma');
  assert.match(schema, /model Notification \{/);
  assert.doesNotMatch(app, /app\.use\(\s*["']\/api\/notifications/);
});
