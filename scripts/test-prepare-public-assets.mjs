import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { prepareAssets } from './prepare-public-assets.mjs';

async function fixture(run) {
  const folder = await mkdtemp(join(tmpdir(), 'skilled-assets-'));
  const sourceRoot = join(folder, 'root');
  const targetRoot = join(folder, 'public', 'academy');
  await mkdir(join(sourceRoot, 'brand', 'cleaning'), { recursive: true });
  await mkdir(join(sourceRoot, 'library', 'photos'), { recursive: true });
  await writeFile(join(sourceRoot, 'brand', 'cleaning', 'logo.svg'), '<svg/>');
  await writeFile(join(sourceRoot, 'library', 'photos', 'photo.jpg'), 'test-image');
  try { await run({ folder, sourceRoot, targetRoot }); }
  finally { await rm(folder, { recursive: true, force: true }); }
}

test('copies files without altering canonical sources and is idempotent', async () => fixture(async ({ sourceRoot, targetRoot }) => {
  const first = await prepareAssets({ sourceRoot, targetRoot });
  assert.equal(first.sources, 2);
  assert.equal(first.copied, 2);
  const second = await prepareAssets({ sourceRoot, targetRoot });
  assert.equal(second.copied, 0);
  assert.equal(second.identical, 2);
  assert.equal((await readFile(join(sourceRoot, 'brand/cleaning/logo.svg'), 'utf8')), '<svg/>');
}));

test('check mode reports missing asset files without writing them', async () => fixture(async ({ sourceRoot, targetRoot }) => {
  const result = await prepareAssets({ sourceRoot, targetRoot, checkOnly: true });
  assert.equal(result.missing, 2);
  assert.equal(result.copied, 0);
}));

test('divergent generated public assets are never overwritten', async () => fixture(async ({ sourceRoot, targetRoot }) => {
  await mkdir(join(targetRoot, 'brand/cleaning'), { recursive: true });
  const destination = join(targetRoot, 'brand/cleaning/logo.svg');
  await writeFile(destination, 'different');
  await assert.rejects(prepareAssets({ sourceRoot, targetRoot }), /Divergent public assets/);
  assert.equal(await readFile(destination, 'utf8'), 'different');
}));

test('symlinks inside canonical source folders are rejected', async () => fixture(async ({ sourceRoot, targetRoot }) => {
  await symlink(join(sourceRoot, 'brand/cleaning/logo.svg'), join(sourceRoot, 'brand/cleaning/link.svg'));
  await assert.rejects(prepareAssets({ sourceRoot, targetRoot }), /Symlink not allowed/);
}));
