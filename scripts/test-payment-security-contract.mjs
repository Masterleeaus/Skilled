#!/usr/bin/env node
/** Offline contract checks. Does not simulate Stripe, HTTP or a database. */
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = (file) => readFileSync(join(root, file), 'utf8');
const service = src('apps/backend/src/modules/payments/payment.service.ts');
const provider = src('apps/backend/src/modules/payments/stripe.provider.ts');
const app = src('apps/backend/src/app.ts');
const webhook = src('apps/backend/src/modules/payments/stripe.webhook.ts');
const routes = src('apps/backend/src/modules/payments/payment.routes.ts');
const authClient = src('apps/frontend/src/lib/api-client.ts');
let assertions = 0;
function check(condition, label) { assert.ok(condition, label); assertions++; }
check(/verifyAndCompletePayment\(providerReference: string, requestingStudentId\?: string\)/.test(service), 'payment supports user ownership');
check(/payment.studentId !== requestingStudentId/.test(service), 'payment enforces owner');
check(/await prisma\.\$transaction\(\[/.test(service), 'zero-price enrollment and receipt atomic');
check(/result.studentId !== payment.studentId/.test(service), 'student matches signed session metadata');
check(/result.courseId !== payment.courseId/.test(service), 'course matches signed session metadata');
check(/result.currency.toLowerCase\(\) !== "usd"/.test(service), 'currency checked');
check(/Math.round\(result.amount \* 100\)/.test(service), 'amount checked');
check(/session.metadata\?\.studentId/.test(provider), 'metadata sourced from Stripe');
check(/stripe.webhooks.constructEvent\(req.body, signature, env.STRIPE_WEBHOOK_SECRET\)/.test(webhook), 'webhook checks signature');
const webhookPosition = app.indexOf('app.post("/api/payments/stripe/webhook"');
check(webhookPosition > 0 && webhookPosition < app.indexOf('app.use(express.json('), 'raw webhook must precede JSON parser');
check(/express.raw\(\{ type: "application\/json"/.test(app), 'webhook receives raw bytes');
check(/verifyAndCompletePayment\(req.params.providerReference, req.user!.userId\)/.test(routes), 'signed-in caller passes identity');
check(existsSync(join(root, 'apps/frontend/src/app/payment/success/page.tsx')), 'checkout success page exists');
check(existsSync(join(root, 'apps/frontend/src/app/payment/cancelled/page.tsx')), 'checkout cancellation page exists');
check(/queue.splice\(0\).forEach\(\(waiter\) => waiter.reject\(refreshError\)\)/.test(authClient), 'refresh waiters rejected on error');
console.log(`Payment and refresh contracts: ${assertions} static assertions passed`);
