#!/usr/bin/env node
/** Read-only post-deployment smoke test: no credentials, writes or privileged access. */
const input = process.argv[2] || 'https://academy.titanzero.io';
let origin;
try {
  const u = new URL(input);
  if (u.username || u.password || u.search || u.hash || u.pathname !== '/') throw new Error('origin only');
  if (u.protocol !== 'https:' && !(u.protocol === 'http:' && ['127.0.0.1','localhost','[::1]'].includes(u.hostname))) throw new Error('HTTPS required for public targets');
  origin = u.origin;
} catch {
  console.error('Usage: node scripts/academy-runtime-smoke.mjs https://academy.titanzero.io');
  console.error('HTTP permitted only for loopback local testing. No credentials or query parameters.');
  process.exit(2);
}
const probes = [
  { path: '/', name: 'frontend', type: 'html' },
  { path: '/api/health', name: 'API dependencies', type: 'health' },
  { path: '/api/courses', name: 'public catalogue', type: 'catalogue' },
];
let failed = 0;
for (const item of probes) {
  try {
    const response = await fetch(origin + item.path, { signal: AbortSignal.timeout(8000), redirect: 'manual', headers: { accept: item.type === 'html' ? 'text/html' : 'application/json' } });
    if (response.status !== 200) throw new Error('HTTP ' + response.status);
    const mime = response.headers.get('content-type') || '';
    if (item.type === 'html') {
      if (!mime.includes('text/html')) throw new Error('not HTML');
      const text = await response.text();
      if (!/<html[\s>]/i.test(text)) throw new Error('no HTML document');
    } else {
      if (!mime.includes('application/json')) throw new Error('not JSON');
      const data = await response.json();
      if (data?.success !== true) throw new Error('API response did not report success');
      if (item.type === 'health') {
        const checks = data?.data?.checks;
        if (data?.data?.healthy !== true || !checks || !['database', 'redis', 'storage'].every(k => checks[k] === 'ok')) throw new Error('database, redis or storage unhealthy');
      } else if (!Array.isArray(data?.data)) throw new Error('catalogue response is not an array');
    }
    console.log('PASS ' + item.name + ' ' + item.path);
  } catch (error) {
    failed++;
    console.log('FAIL ' + item.name + ' ' + item.path + ': ' + error.message);
  }
}
console.log(`ACADEMY RUNTIME SMOKE: ${probes.length - failed}/${probes.length} checks passed`);
if (failed) process.exitCode = 1;
