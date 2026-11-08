#!/usr/bin/env node
/**
 * Read-only inventory of preserved historical material and application entrypoints.
 * This is a conservative source-reference check, not full bundler reachability analysis.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const workspace = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = path.resolve(workspace, '..');
const rules = [
  { label: 'retired-converted-lessons', dir: 'curriculum/lessons/converted', category: 'retired-data' },
  { label: 'retired-ready-lessons', dir: 'curriculum/lessons/ready', category: 'retired-data' },
  { label: 'legacy-bootstrap', dir: 'docs/legacy-bootstrap', category: 'historical-tooling' },
  { label: 'legacy-architecture', dir: 'architecture', category: 'historical-reference' },
  { label: 'legacy-pass42', dir: 'PASS42', category: 'historical-evidence' },
  { label: 'inactive-tutor-chatbot', dir: 'apps/backend/src/tutor/chatbot', category: 'unmounted-prototype' },
  { label: 'inactive-root-tests', dir: 'tests', category: 'historical-tests' },
];
const isSource = name => /\.(?:ts|tsx|js|jsx|mjs|cjs)$/.test(name);
const ignoredFolders = new Set(['node_modules', 'dist', '.next', 'build', '.git', 'coverage']);
function walk(root) {
  if (!fs.existsSync(root)) return [];
  const results = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) throw new Error('Symlink in workspace: ' + path.join(root, entry.name));
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) {
      if (!ignoredFolders.has(entry.name)) results.push(...walk(full));
    } else if (entry.isFile()) results.push(full);
  }
  return results.sort();
}
function rel(root, file) { return path.relative(root, file).split(path.sep).join('/'); }
function read(root, name) { return fs.readFileSync(path.join(root, name), 'utf8'); }
function importSpecifiers(text) {
  const found = [];
  // Only syntactic ES imports/exports and CJS require/dynamic import string arguments; comments are not interpreted.
  const pattern = /\b(?:import\s*(?:[^"'\n;]*?\sfrom\s*)?|export\s+[^"'\n;]*?\sfrom\s*|require\s*\(|import\s*\()\s*['"]([^'"]+)['"]/g;
  for (const match of text.matchAll(pattern)) found.push(match[1]);
  return found;
}
export function inventory({ root = workspace, repo = repoRoot } = {}) {
  const activePaths = ['apps/backend/src', 'apps/frontend/src'];
  const files = activePaths.flatMap(dir => walk(path.join(root, dir))).filter(isSource);
  const archived = rules.map(rule => {
    const entries = walk(path.join(root, rule.dir));
    return { ...rule, fileCount: entries.length, sourceFiles: entries.filter(isSource).length };
  });
  const imports = [];
  for (const file of files) {
    const from = rel(root, file);
    const source = fs.readFileSync(file, 'utf8');
    for (const specifier of importSpecifiers(source)) {
      const resolved = specifier.startsWith('.') ? path.resolve(path.dirname(file), specifier) : null;
      const normalized = resolved && rel(root, resolved);
      const matches = rules.filter(rule => normalized && (normalized === rule.dir || normalized.startsWith(rule.dir + '/')));
      if (matches.length) imports.push({ file: from, specifier, targets: matches.map(x => x.label) });
    }
  }
  // Mount inspection is narrowly scoped to the actual Express application entrypoint.
  const appFile = 'apps/backend/src/app.ts';
  const app = read(root, appFile);
  const mounted = [...app.matchAll(/app\.use\(\s*["']([^"']+)["']/g)].map(m => m[1]);
  const tutorGate = /process\.env\.TUTOR_ENABLED\s*===\s*["']true["']/.test(app);
  const chatbotMounted = /(?:app\.use|mount\w*Route)\s*\([^)]*(?:tutor\/chatbot|chatbot)/.test(app);
  const archives = fs.readdirSync(repo, { withFileTypes: true })
    .filter(item => item.isFile() && /\.zip$/i.test(item.name)).map(item => ({ filename: item.name, size: fs.statSync(path.join(repo, item.name)).size }));
  const report = {
    schemaVersion: 1, activeSourceFilesChecked: files.length,
    mountedApiPrefixes: [...new Set(mounted)].sort(), tutorFeatureFlagGuard: tutorGate, chatbotDirectlyMounted: chatbotMounted,
    archived, rootArchives: archives, archivedSourceImports: imports,
    violations: [],
  };
  if (imports.length) report.violations.push({ code: 'ACTIVE_IMPORTS_ARCHIVED', count: imports.length });
  if (!tutorGate) report.violations.push({ code: 'TUTOR_GUARD_MISSING' });
  if (chatbotMounted) report.violations.push({ code: 'UNREVIEWED_CHATBOT_MOUNT' });
  return report;
}

export function runCli(args = process.argv.slice(2)) {
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--report') {
      if (!args[i + 1] || args[i + 1].startsWith('--')) throw new Error('--report requires a filename');
      i++;
    } else if (args[i] !== '--strict') throw new Error('Unknown argument: ' + args[i]);
  }
  const report = inventory();
  const reportArg = args.indexOf('--report');
  if (reportArg >= 0) {
    const target = path.resolve(args[reportArg + 1]);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, JSON.stringify(report, null, 2) + '\n');
  }
  console.log(JSON.stringify(report, null, 2));
  if (args.includes('--strict') && report.violations.length) process.exitCode = 1;
  return report;
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { runCli(); } catch (err) { console.error(err); process.exitCode = 2; }
}
