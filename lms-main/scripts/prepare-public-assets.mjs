#!/usr/bin/env node
/**
 * Materialise repository-owned brand/library assets into Next public/academy.
 * Never move/delete canonical assets or silently overwrite divergent output.
 */
import { readdir, lstat, mkdir, copyFile, readFile } from 'node:fs/promises';
import { resolve, relative, join, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const workspace = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const repoRoot = resolve(workspace, '..');
const destinations = ['brand', 'library'];
const publicRoot = resolve(workspace, 'apps/frontend/public/academy');

function inside(base, path) {
  const rel = relative(base, path);
  return rel === '' || (rel !== '..' && !rel.startsWith('..' + sep) && !rel.startsWith(sep));
}

async function listFiles(directory) {
  const output = [];
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, item.name);
    if (item.isSymbolicLink()) throw new Error('Symlink not allowed in asset tree: ' + path);
    if (item.isDirectory()) output.push(...await listFiles(path));
    else if (item.isFile()) output.push(path);
    else throw new Error('Unsupported asset type: ' + path);
  }
  return output.sort();
}

const sha = content => createHash('sha256').update(content).digest('hex');

export async function prepareAssets({ sourceRoot = repoRoot, targetRoot = publicRoot, checkOnly = false } = {}) {
  const metrics = { sources: 0, copied: 0, identical: 0, missing: 0, conflicts: [], destination: targetRoot };
  for (const section of destinations) {
    const root = resolve(sourceRoot, section);
    const stat = await lstat(root);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('Invalid canonical asset folder: ' + root);
    for (const source of await listFiles(root)) {
      const destination = resolve(targetRoot, section, relative(root, source));
      if (!inside(resolve(targetRoot), destination)) throw new Error('Unsafe asset path: ' + source);
      metrics.sources++;
      let present = false;
      try {
        const stat = await lstat(destination);
        if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('Unsafe existing destination: ' + destination);
        present = true;
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
      if (present) {
        const [a, b] = await Promise.all([readFile(source), readFile(destination)]);
        if (sha(a) !== sha(b)) metrics.conflicts.push(relative(targetRoot, destination));
        else metrics.identical++;
      } else if (checkOnly) metrics.missing++;
      else {
        await mkdir(dirname(destination), { recursive: true });
        await copyFile(source, destination);
        metrics.copied++;
      }
    }
  }
  if (metrics.conflicts.length) throw new Error('Divergent public assets: ' + metrics.conflicts.slice(0, 10).join(', '));
  return metrics;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  prepareAssets({ checkOnly: process.argv.includes('--check') })
    .then(result => {
      console.log(JSON.stringify(result, null, 2));
      if (result.missing) process.exitCode = 1;
    })
    .catch(error => { console.error(error); process.exitCode = 1; });
}
