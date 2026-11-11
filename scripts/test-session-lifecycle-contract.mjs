#!/usr/bin/env node
// Static security invariants; DB-backed concurrency tests remain required.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => readFileSync(path.join(root, rel), 'utf8');
const src = read('apps/backend/src/modules/auth/auth.service.ts');
const controller = read('apps/backend/src/modules/auth/auth.controller.ts');
const routes = read('apps/backend/src/modules/auth/auth.routes.ts');
const schema = read('apps/backend/prisma/schema.prisma');
let count = 0;
function check(value, label) { assert.ok(value, label); count++; }
const refresh = src.split('export async function refreshAccessToken(')[1].split('// Logout single device')[0];
check(refresh.includes('hashToken(refreshTokenRaw)'), 'incoming refresh token hashed');
// Account state is checked through the shared eligibility helper, which requires not deleted, active and verified.
check(refresh.includes('isAccountEligible(stored.user)') && src.includes('return !user.deletedAt && user.isActive && user.isEmailVerified;'), 'account state checked on refresh');
check(refresh.includes('prisma.$transaction(async (tx) =>'), 'rotate in a transaction');
check(refresh.includes('tx.refreshToken.updateMany') && refresh.includes('isRevoked: false'), 'conditional consume prevents replay');
check(refresh.includes('consumed.count !== 1'), 'concurrent reuse rejected');
check(refresh.includes('tx.refreshToken.create'), 'rotated credential persisted atomically');
check(refresh.includes('deviceInfo: stored.deviceInfo'), 'device metadata retained');
check(refresh.includes('refreshToken: rotatedToken'), 'replacement token returned to controller');
check(controller.includes('setRefreshCookie(res, result.refreshToken)'), 'browser receives replacement HttpOnly cookie');
check(controller.includes('return sendSuccess(res, result, "Token refreshed")'), 'body-token client receives replacement token');
check(controller.includes('req.body?.refreshToken'), 'logout supports cookie-only request with no body');
check(routes.includes('router.post("/refresh", refreshLimiter') && routes.includes('router.post("/reset-password", authLimiter') && routes.includes('router.post("/verify-email", authLimiter'), 'refresh/recovery routes are rate-limited');
const reset = src.split('export async function resetPassword(')[1].split('export async function getUserProfile(')[0];
check(reset.includes('tx.user.updateMany') && reset.includes('resetPasswordToken: token') && reset.includes('consumed.count !== 1'), 'reset token single-use guarded');
check(reset.includes('tx.refreshToken.updateMany'), 'password reset revokes sessions transactionally');
const verify = src.split('export async function verifyEmail(')[1].split('export async function loginUser(')[0];
check(verify.includes('prisma.user.updateMany') && verify.includes('consumed.count !== 1'), 'email verify token single-use guarded');
check(schema.includes('model RefreshToken') && schema.includes('deviceInfo String?'), 'rotation matches Prisma session schema');
console.log(`PASS: ${count} session, account recovery and single-use credential invariants`);
