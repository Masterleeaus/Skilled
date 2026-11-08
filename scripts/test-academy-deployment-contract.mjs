#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const compose = readFileSync(join(root, 'docker-compose.academy-deps.yml'), 'utf8');
const auth = readFileSync(join(root, 'apps/backend/src/middleware/authenticate.ts'), 'utf8');
const authTests = readFileSync(join(root, 'apps/backend/src/tests/auth.test.ts'), 'utf8');
let count = 0;
function check(value, message) { assert.ok(value, message); count++; }
check(!/^\s{2}postgres:/m.test(compose), 'Academy deps must not start PostgreSQL');
check(!/^\s{2}mailhog:/m.test(compose), 'Production deps must not start developer SMTP');
check(!/anonymous\s+set/i.test(compose), 'Object bucket must not grant anonymous access');
check(/127\.0\.0\.1:\$\{ACADEMY_REDIS_PORT/.test(compose), 'Redis must publish loopback only');
check(/127\.0\.0\.1:\$\{ACADEMY_MINIO_PORT/.test(compose), 'MinIO must publish loopback only');
check(!/minioadmin|POSTGRES_PASSWORD:\s*lms/i.test(compose), 'No shared default passwords');
check(/ACADEMY_REDIS_PASSWORD:\?/.test(compose), 'Redis password required');
check(/ACADEMY_MINIO_ROOT_PASSWORD:\?/.test(compose), 'MinIO password required');
check(/prisma\.user\.findUnique/.test(auth), 'Authentication must read live user state');
check(/isActive/.test(auth) && /isEmailVerified/.test(auth) && /deletedAt/.test(auth), 'Authentication must enforce account status');
check(/role:\s*user\.role/.test(auth), 'Authorization uses server-side role');
check(/database role after an administrator is demoted/.test(authTests), 'Role demotion integration regression exists');
check(/access tokens after account deactivation/.test(authTests), 'Deactivated JWT integration regression exists');
console.log(`Academy deploy/auth contracts: ${count} assertions passed`);
