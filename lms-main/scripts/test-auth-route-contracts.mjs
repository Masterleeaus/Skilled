#!/usr/bin/env node
// Route contracts and executable pure email links. Live SMTP and database journeys need integration testing.
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = f => readFileSync(path.join(root, f), 'utf8');
const require = createRequire(import.meta.url);
const ts = require(path.join(root, 'apps/backend/node_modules/typescript'));
const emailModule = { exports: {} };
const emailCode = ts.transpileModule(read('apps/backend/src/jobs/account-email-content.ts'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
new Function('module', 'exports', emailCode)(emailModule, emailModule.exports);
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
for (const [slug, frontendFn, backendFn, renderer] of [
  ['verify-email', 'verifyEmail', 'verifyEmail', 'verificationEmailContent'],
  ['reset-password', 'resetPassword', 'resetPassword', 'resetPasswordEmailContent'],
]) {
  check(existsSync(path.join(root, `apps/frontend/src/app/(auth)/${slug}/page.tsx`)), `Frontend ${slug} route exists`);
  const token = 'route-contract+token/&?=test';
  const content = emailModule.exports[renderer]('https://skilled.example.test', token);
  const href = content.html.match(/href="([^"]+)"/)?.[1];
  check(Boolean(href), `${slug} email contains a link`);
  const link = new URL(href.replaceAll('&amp;', '&'));
  check(link.origin === 'https://skilled.example.test' && link.pathname === `/${slug}`, `${slug} email link matches frontend route`);
  check(link.searchParams.get('token') === token, `${slug} email preserves encoded token`);
  check(mail.includes(`${renderer}(env.CLIENT_URL, token)`), `${slug} queue uses the tested link renderer`);
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
