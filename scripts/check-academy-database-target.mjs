#!/usr/bin/env node
/** No database connection, mutation, or secret printing. Validates the target before Prisma commands. */
const raw = process.env.DATABASE_URL;
const errors = [];
let target;
if (!raw) errors.push('DATABASE_URL is unset');
else {
  try {
    const u = new URL(raw);
    const db = decodeURIComponent(u.pathname.replace(/^\//, ''));
    const user = decodeURIComponent(u.username);
    const port = u.port || '5432';
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(u.hostname);
    if (!['postgresql:', 'postgres:'].includes(u.protocol)) errors.push('must use PostgreSQL');
    if (db !== 'titan_academy') errors.push('database must be exactly titan_academy');
    if (user !== 'titan_academy') errors.push('database role must be exactly titan_academy');
    if (!local) errors.push('database host must be loopback (isolated Academy local instance)');
    if (u.searchParams.has('schema') && u.searchParams.get('schema') !== 'public') errors.push('schema must be public');
    if (!u.password) errors.push('database password missing');
    target = { host: u.hostname, port, database: db, role: user, schema: u.searchParams.get('schema') || 'public' };
  } catch { errors.push('DATABASE_URL is not a valid URL'); }
}
if (errors.length) {
  console.error('ACADEMY DATABASE TARGET: BLOCKED');
  errors.forEach(e => console.error('- ' + e));
  process.exitCode = 1;
} else {
  console.log('ACADEMY DATABASE TARGET: VERIFIED (configuration only; no database connection)');
  console.log(JSON.stringify(target, null, 2));
}
