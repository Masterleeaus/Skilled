#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawnSync, spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { once } from 'node:events';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const guard = resolve(root, 'scripts/check-academy-database-target.mjs');
const app = readFileSync(resolve(root, 'apps/backend/src/app.ts'), 'utf8');
const env = readFileSync(resolve(root, 'apps/backend/src/config/env.ts'), 'utf8');
const smoke = resolve(root, 'scripts/academy-runtime-smoke.mjs');
let assertions = 0;
function check(ok, reason) { assert.ok(ok, reason); assertions++; }
function db(url) {
  return spawnSync(process.execPath, [guard], { env: { ...process.env, DATABASE_URL: url }, encoding: 'utf8', timeout: 5000 });
}
check(app.includes('app.set("trust proxy", "loopback")'), 'Apache proxy trust scoped to loopback');
check(env.includes('Production requires the dedicated titan_academy database and role'), 'production database-target startup guard exists');
check(env.includes('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different'), 'signing key independence guard exists');
check(env.includes('Production frontend must use HTTPS'), 'production frontend TLS guard exists');
check(env.includes('Production Stripe requires both secret'), 'production Stripe pair guard exists');
const valid = db('postgresql://titan_academy:super-unique-SECRET@127.0.0.1:5432/titan_academy?schema=public');
check(valid.status === 0, 'safe Academy target accepted');
check(valid.stdout.includes('VERIFIED'), 'safe target reported');
check(!valid.stdout.includes('super-unique-SECRET'), 'secret must be redacted');
for (const url of [
  'postgresql://ai_fsm:SECRET@127.0.0.1:5432/ai_fsm',
  'postgresql://titan_desk:SECRET@127.0.0.1:5432/titan_desk',
  'postgresql://titan_academy:SECRET@some.remote.host:5432/titan_academy',
  'postgresql://admin:SECRET@127.0.0.1/titan_academy',
  'postgresql://titan_academy:SECRET@127.0.0.1/titan_academy?schema=ai_fsm',
  'not-a-url',
  ''
]) {
  const r = db(url);
  check(r.status !== 0, 'unsafe DB target rejected');
  check(!(r.stdout + r.stderr).includes('SECRET'), 'DB password never echoed');
}
const server = createServer((req, res) => {
  if (req.url === '/') { res.writeHead(200, { 'content-type': 'text/html' }); res.end('<html><body>Academy</body></html>'); }
  else if (req.url === '/api/health') { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ success: true, data: { healthy: true, checks: { database: 'ok', redis: 'ok', storage: 'ok' } } })); }
  else if (req.url === '/api/courses') { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ success: true, data: [] })); }
  else { res.writeHead(404); res.end(); }
});
try {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const port = server.address().port;
  function run() { return new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, [smoke, `http://127.0.0.1:${port}`], { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    child.stdout.on('data', x => stdout += x);
    child.stderr.on('data', x => stderr += x);
    child.once('error', reject);
    child.once('close', code => resolvePromise({ code, stdout, stderr }));
  }); }
  const good = await run();
  check(good.code === 0 && good.stdout.includes('3/3 checks passed'), 'runtime smoke correctly passes healthy sample server');
  server.removeAllListeners('request');
  server.on('request', (req, res) => {
    if (req.url === '/api/health') { res.writeHead(503, { 'content-type': 'application/json' }); res.end('{"success":false}'); }
    else if (req.url === '/') { res.writeHead(200, { 'content-type': 'text/html' }); res.end('<html></html>'); }
    else { res.writeHead(200, { 'content-type': 'application/json' }); res.end('{"success":true,"data":[]}'); }
  });
  const bad = await run();
  check(bad.code === 1 && bad.stdout.includes('FAIL API dependencies'), 'runtime smoke rejects unhealthy dependencies');
  const badUrl = spawnSync(process.execPath, [smoke, 'http://example.com'], { encoding: 'utf8', timeout: 5000 });
  check(badUrl.status !== 0, 'runtime smoke rejects public HTTP');
} finally { server.close(); }
console.log(`Academy runtime guards: ${assertions} assertions passed`);
