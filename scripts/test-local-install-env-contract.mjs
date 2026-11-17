import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = path => readFileSync(resolve(root, path), 'utf8');

test('both independently runnable Skilled applications have tracked local env templates', () => {
  assert.ok(existsSync(resolve(root, 'apps/backend/.env.example')));
  assert.ok(existsSync(resolve(root, 'apps/frontend/.env.example')));
  assert.equal(existsSync(resolve(root, 'lms-main/README.md')), false, 'do not reintroduce old duplicate app root');
});

test('backend template includes every required boot variable and never hardcodes a production database', () => {
  const source = read('apps/backend/.env.example');
  for (const key of ['CLIENT_URL', 'DATABASE_URL', 'REDIS_URL',
    'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET',
    'MINIO_ACCESS_KEY', 'MINIO_SECRET_KEY']) {
    assert.match(source, new RegExp('^' + key + '=.+$', 'm'), key);
  }
  assert.match(source, /127\.0\.0\.1|localhost/);
  assert.doesNotMatch(source, /DATABASE_URL=.*(?:production|prod\.internal)/i);
  assert.match(read('apps/backend/src/config/env.ts'), /dotenv\.config\(\)/);
});

test('frontend template exposes its own API configuration and targets .env.local', () => {
  const source = read('apps/frontend/.env.example');
  assert.match(source, /^NEXT_PUBLIC_API_URL=/m);
  assert.match(source, /apps\/frontend\/\.env\.local/);
});

test('current README points to actual local env file locations and documents nonproduction scope', () => {
  const source = read('README.md');
  assert.match(source, /cp apps\/backend\/\.env\.example apps\/backend\/\.env/);
  assert.match(source, /cd apps\/frontend[\s\S]*?\.env\.local/);
  assert.doesNotMatch(source, /cp \.env\.example \.env(?!\.)/);
  assert.match(source, /LOCAL DEVELOPMENT ONLY/);
  assert.match(source, /NOT production verified|not suitable for production/i);
});
