#!/usr/bin/env node
/**
 * Issue #86: inventory legacy product naming in canonical curriculum.
 * Read-only by design: modifying approved lessons requires a new content hash
 * and a separate human editorial/publication review.
 */
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, relative, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const LEGACY_BRAND = /titan[\s-]+academy/gi;
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceDirs = ['curriculum/courses', 'curriculum/shared', 'curriculum/structure'];
const outputDefault = 'build/issue-86-brand-inventory.json';
const nonLearnerKeys = new Set([
  'source', 'sourceId', 'sourcePath', 'sourceFile', 'sourceNotes',
  'provenance', 'attribution', 'licence', 'license', 'reviewNotes',
  'editorialNotes', 'internalNotes', 'migrationNotes', 'history',
  'createdBy', 'updatedBy', 'contentHash', 'sourceHash'
]);
const learnerKeys = new Set([
  'title', 'subtitle', 'description', 'summary', 'audience',
  'moduleTitle', 'heading', 'body', 'text', 'instruction',
  'procedure', 'learningOutcomes', 'workedExamples', 'situation',
  'explanation', 'question', 'feedback', 'answer', 'objectives',
  'introduction', 'conclusion', 'checklist', 'steps', 'notes',
  'referencesAtStart', 'prerequisitesText'
]);
const escapePointer = segment => String(segment).replace(/~/g, '~0').replace(/\//g, '~1');

export function classify(pointer) {
  const parts = pointer.split('/').filter(Boolean).map(x => x.replace(/~1/g, '/').replace(/~0/g, '~'));
  if (parts.some(part => nonLearnerKeys.has(part))) return 'retain-review-provenance';
  if (parts.some(part => learnerKeys.has(part))) return 'learner-visible-review';
  return 'unclassified-manual-review';
}

export function scanValue(value, path = '') {
  if (typeof value === 'string') {
    return [...value.matchAll(LEGACY_BRAND)].map(match => ({
      pointer: path || '/', offset: match.index,
      match: match[0], classification: classify(path),
      excerpt: value.slice(Math.max(0, match.index - 75), Math.min(value.length, match.index + match[0].length + 75))
    }));
  }
  if (Array.isArray(value)) return value.flatMap((entry, i) => scanValue(entry, path + '/' + i));
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, entry]) => scanValue(entry, path + '/' + escapePointer(key)));
  }
  return [];
}

async function filesUnder(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(entries.map(entry => {
    const full = resolve(dir, entry.name);
    return entry.isDirectory() ? filesUnder(full) : Promise.resolve(entry.isFile() && extname(full) === '.json' ? [full] : []);
  }));
  return nested.flat().sort();
}

function lineNumber(text, offset) {
  return text.slice(0, offset).split('\n').length;
}

function scanText(text) {
  return [...text.matchAll(LEGACY_BRAND)].map(match => ({
    line: lineNumber(text, match.index), match: match[0],
    classification: 'structural-or-documentation-review',
    excerpt: text.slice(Math.max(0, match.index - 75), match.index + match[0].length + 75)
  }));
}

export async function audit(base = root) {
  const findings = [];
  let examined = 0;
  for (const source of sourceDirs) {
    const files = await filesUnder(resolve(base, source));
    for (const file of files) {
      examined++;
      const raw = await readFile(file, 'utf8');
      const relativePath = relative(base, file).replaceAll('\\', '/');
      let parsed;
      try { parsed = JSON.parse(raw); }
      catch (error) {
        findings.push({ file: relativePath, classification: 'invalid-json', error: error.message });
        continue;
      }
      const matches = scanValue(parsed);
      if (matches.length) findings.push(...matches.map(match => ({ file: relativePath, ...match })));
    }
  }
  // Index is derived and must be reconciled after approved source edits.
  const indexFile = resolve(base, 'curriculum/lesson-normalization-index.json');
  const indexText = await readFile(indexFile, 'utf8');
  const indexHits = scanText(indexText).map(match => ({
    file: 'curriculum/lesson-normalization-index.json', ...match,
    classification: 'derived-index-reconcile'
  }));
  const counts = {};
  for (const entry of findings) counts[entry.classification] = (counts[entry.classification] || 0) + 1;
  return {
    issue: 86, generatedAt: new Date().toISOString(), examinedCanonicalJsonFiles: examined,
    findings, derivedIndexMatchCount: indexHits.length, derivedIndexMatches: indexHits,
    counts, policy: 'Inventory only; no content auto-edited or approved. Learner text requires editorial review, refreshed hashes and republishing through gated workflow.'
  };
}

async function main() {
  const args = process.argv.slice(2);
  const output = args.includes('--report') ? args[args.indexOf('--report') + 1] : outputDefault;
  if (!output || output.startsWith('--')) throw new Error('Missing --report destination');
  const result = await audit();
  const destination = resolve(root, output);
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({
    report: output, canonicalFiles: result.examinedCanonicalJsonFiles,
    matches: result.findings.length, byClassification: result.counts,
    derivedIndexMatches: result.derivedIndexMatchCount
  }, null, 2));
  if (args.includes('--fail-on-learner') && result.findings.some(f => f.classification === 'learner-visible-review')) process.exitCode = 1;
  if (result.findings.some(f => f.classification === 'invalid-json')) process.exitCode = 2;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error); process.exitCode = 2; });
}
