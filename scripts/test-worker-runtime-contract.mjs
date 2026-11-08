#!/usr/bin/env node
// Offline executable checks for source-level worker/runtime separation and retry safeguards.
// These do NOT substitute for Redis/PostgreSQL integration tests or a clean TS build.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (name) => readFileSync(join(root, name), 'utf8');
const r = (name) => read(`apps/backend/src/${name}`);
let assertions = 0;
function check(condition, message) { assert.ok(condition, message); assertions++; }
const api = r('server.ts');
const worker = r('worker.ts');
const emailQueue = r('jobs/email.queue.ts');
const certQueue = r('jobs/certificate.queue.ts');
const emailWorker = r('jobs/email.worker.ts');
const certWorker = r('jobs/certificate.worker.ts');
const certificateService = r('modules/certificates/certificate.service.ts');
const env = r('config/env.ts');
const schema = read('apps/backend/prisma/schema.prisma');
const migration = read('apps/backend/prisma/migrations/20261102210000_academy_certificate_idempotency/migration.sql');
const backendPkg = JSON.parse(read('apps/backend/package.json'));
const prodEnv = read('.env.production.example');
check(!/new\s+Worker\s*</.test(emailQueue) && !/new\s+Worker\s*</.test(certQueue), 'queue producers must not instantiate workers');
check(!/email\.worker|certificate\.worker|startEmailWorker|startCertificateWorker/.test(api), 'API entry point must not load worker processors');
check(/startEmailWorker\(\)/.test(worker) && /startCertificateWorker\(\)/.test(worker), 'worker entry point starts both processors');
check(/new\s+Worker\s*</.test(emailWorker) && /new\s+Worker\s*</.test(certWorker), 'dedicated processors instantiate workers');
check(backendPkg.scripts['start:worker'] === 'node dist/worker.js', 'production worker entry point is published');
check(/SMTP_TLS_MODE/.test(env) && /NODE_ENV === "production"/.test(env), 'production mail TLS is validated');
check(/requireTLS: env\.SMTP_TLS_MODE === "starttls"/.test(emailWorker), 'SMTP STARTTLS enforced when selected');
check(/auth: env\.SMTP_USER \?/.test(emailWorker), 'SMTP authenticates when credentials are provided');
check(!/job\.data\.to/.test(emailWorker.match(/worker\.on\("completed"[\s\S]*?return worker;/)?.[0] || ''), 'worker logs must not leak recipient address');
check(/attempts: 3/.test(emailQueue) && /backoff:/.test(emailQueue), 'email retries configured');
check(/attempts: 5/.test(certQueue) && /backoff:/.test(certQueue), 'certificate retries configured');
check(/createHash\("sha256"\)/.test(certQueue), 'deterministic certificate job identifier');
check(/@@unique\(\[studentId, courseId\]\)/.test(schema), 'Prisma certificate uniqueness by learner and course');
check(/CREATE UNIQUE INDEX "certificates_studentId_courseId_key"/.test(migration), 'migration creates matching certificate uniqueness index');
check(/error\.code === "P2002"/.test(certificateService) && /alreadyIssued/.test(certificateService), 'concurrent duplicate issuance handled');
check(/await prisma\.\$queryRaw`SELECT 1`/.test(api) && /await prisma\.\$queryRaw`SELECT 1`/.test(worker), 'startup checks DB before accepting work');
check(/await redis\.ping\(\)/.test(api) && /await redis\.ping\(\)/.test(worker), 'startup checks Redis');
check(/process\.on\("SIGTERM"/.test(api) && /process\.on\("SIGTERM"/.test(worker), 'graceful shutdown handlers exist');
check(/SMTP_TLS_MODE=starttls/.test(prodEnv) && !/^SMTP_PASSWORD=\s*$/m.test(prodEnv), 'sample production SMTP TLS variables explicit');
const id = (student, course) => `cert-${createHash('sha256').update(JSON.stringify([student, course])).digest('hex')}`;
check(id('alice','course-a') === id('alice','course-a') && id('alice','course-a') !== id('bob','course-a'), 'certificate job ID formula deterministic and distinct');
console.log(`PASS: ${assertions} worker, SMTP, retry and certificate idempotency assertions`);
