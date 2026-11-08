#!/usr/bin/env node
// Static route-contract checks only; the live SMTP and database journey needs integration testing.
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = f => readFileSync(path.join(root, f), 'utf8');
const mail = read('apps/backend/src/jobs/email.queue.ts');
const api = read('apps/frontend/src/lib/auth.api.ts');
const routes = read('apps/backend/src/modules/auth/auth.routes.ts');
const controller = read('apps/backend/src/modules/auth/auth.controller.ts');
const validators = read('apps/backend/src/modules/auth/auth.validators.ts');
const authService = read('apps/backend/src/modules/auth/auth.service.ts');
const login = read('apps/frontend/src/app/(auth)/login/page.tsx');
const registration = read('apps/frontend/src/app/(auth)/register/page.tsx');
let count = 0;
function check(condition, message) { assert.ok(condition, message); count++; }
for (const [slug, frontendFn, backendFn] of [
  ['verify-email', 'verifyEmail', 'verifyEmail'],
  ['reset-password', 'resetPassword', 'resetPassword'],
]) {
  check(existsSync(path.join(root, `apps/frontend/src/app/(auth)/${slug}/page.tsx`)), `Frontend ${slug} route exists`);
  check(mail.includes(`/${slug}?token=`), `${slug} email link matches frontend route`);
  check(api.includes(`function ${frontendFn}(`), `Frontend ${slug} API function exists`);
  check(routes.includes(`router.post("/${slug}"`) && routes.includes(`authController.${backendFn}`), `${slug} backend route exists`);
  check(controller.includes(`export async function ${backendFn}(`), `${slug} backend controller exists`);
}
check(existsSync(path.join(root, 'apps/frontend/src/app/(auth)/forgot-password/page.tsx')), 'Forgot password frontend route exists');
check(routes.includes('router.post("/forgot-password"'), 'Forgot password backend route exists');
check(login.includes('href="/forgot-password"'), 'Login links to recovery');
check(registration.includes('registerUser(values)'), 'Registration uses restricted API payload');
check(validators.includes('z.literal("STUDENT").optional()'), 'Public registration schema restricts assigned roles');
check(authService.includes('role: "STUDENT"'), 'Service forces unprivileged role');
// Account state is checked through the shared eligibility helper, which requires not deleted, active and verified.
check(authService.split('export async function refreshAccessToken(')[1].includes('isAccountEligible(stored.user)') && authService.includes('return !user.deletedAt && user.isActive && user.isEmailVerified;'), 'Refresh validates active verified user');
console.log(`PASS: ${count} static account-recovery and registration security route assertions`);
