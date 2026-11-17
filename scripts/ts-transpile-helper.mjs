// Transpiles TypeScript source to CommonJS for the contract scripts.
// TypeScript 7 no longer exposes the transpileModule JS API, so this runs the
// supported `tsc` CLI in emit-only mode (--noCheck). The emitted JavaScript is
// the same output the old transpileModule(...).outputText calls produced.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function resolveTscEntry() {
  const candidates = [
    'apps/backend/node_modules/typescript/bin/tsc',
    'node_modules/typescript/bin/tsc',
    'apps/frontend/node_modules/typescript/bin/tsc',
    'packages/shared/node_modules/typescript/bin/tsc',
  ].map((p) => join(root, p));
  const hit = candidates.find((p) => existsSync(p));
  if (!hit) throw new Error('TypeScript CLI not found; run pnpm install first');
  return hit;
}

/**
 * @param {string} source  TypeScript source text
 * @param {object} [opts]
 * @param {string} [opts.fileName]  file name used for the temp copy (default module.ts)
 * @param {boolean} [opts.esModuleInterop]
 * @param {boolean} [opts.jsx]  React JSX with the automatic runtime
 * @param {string} [opts.target]  ECMAScript target (default es2022)
 * @returns {string} emitted CommonJS JavaScript
 */
export function transpileToCommonJs(source, opts = {}) {
  const stem = basename(opts.fileName ?? 'module.ts').replace(/\.(tsx?|mts|cts)$/, '');
  const dir = mkdtempSync(join(tmpdir(), 'ts-transpile-'));
  try {
    const input = join(dir, `${stem}${opts.jsx ? '.tsx' : '.ts'}`);
    const outDir = join(dir, 'out');
    writeFileSync(input, source, 'utf8');
    const args = [
      resolveTscEntry(),
      '--module', 'commonjs',
      '--target', opts.target ?? 'es2022',
      '--noCheck',
      '--rootDir', dir,
      '--outDir', outDir,
    ];
    if (opts.esModuleInterop) args.push('--esModuleInterop');
    if (opts.jsx) args.push('--jsx', 'react-jsx');
    args.push(input);
    const run = spawnSync(process.execPath, args, { cwd: dir, encoding: 'utf8' });
    const outFile = join(outDir, `${stem}.js`);
    if (!existsSync(outFile)) {
      throw new Error(`tsc emitted nothing for ${stem}: ${run.stderr || run.stdout}`);
    }
    return readFileSync(outFile, 'utf8');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
