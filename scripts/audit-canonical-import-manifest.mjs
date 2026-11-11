#!/usr/bin/env node
/**
 * Read-only integrity audit of the historical pass42 canonical-import manifest.
 * It is a snapshot, not an instruction to import or overwrite published lessons.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const workspace = path.resolve(here, '..');
const DEFAULT_MANIFEST = path.join(workspace, 'curriculum/import/canonical-import-manifest.json');
const DEFAULT_CURRICULUM = path.join(workspace, 'curriculum');
const sha256 = data => crypto.createHash('sha256').update(data).digest('hex');
const isSha = s => typeof s === 'string' && /^[a-f0-9]{64}$/.test(s);
const isSafePath = s => typeof s === 'string' && s.length > 0 &&
  !path.isAbsolute(s) && !s.split(/[\\/]/).some(part => !part || part === '.' || part === '..');

export function auditManifest(manifest, { curriculumRoot = DEFAULT_CURRICULUM, read = p => fs.readFileSync(p) } = {}) {
  const result = { schemaVersion: 1, entries: 0, matches: 0, stale: 0, missing: 0,
    unsafePaths: 0, duplicateIds: 0, identityMismatch: 0, invalid: 0, evidence: [], importSafe: false };
  const problems = (code, entry, detail) => {
    result.evidence.push({ code, entry, detail });
    if (code === 'STALE_HASH') result.stale++;
    else if (code === 'MISSING_FILE') result.missing++;
    else if (code === 'UNSAFE_PATH') result.unsafePaths++;
    else if (code === 'DUPLICATE_ID') result.duplicateIds++;
    else if (code === 'IDENTITY_MISMATCH') result.identityMismatch++;
    else result.invalid++;
  };
  if (!manifest || typeof manifest !== 'object' || !Array.isArray(manifest.entries)) {
    problems('INVALID_MANIFEST', null, 'entries must be an array');
    return result;
  }
  result.entries = manifest.entries.length;
  const seen = new Set();
  for (let i = 0; i < manifest.entries.length; i++) {
    const item = manifest.entries[i];
    if (!item || typeof item !== 'object' || typeof item.sourceId !== 'string' || !item.sourceId) {
      problems('INVALID_ENTRY', i, 'sourceId missing');
      continue;
    }
    if (seen.has(item.sourceId)) problems('DUPLICATE_ID', i, item.sourceId);
    seen.add(item.sourceId);
    let matched = true;
    for (const [key, hashKey] of [
      ['canonicalFile', 'canonicalSha256'], ['readySourceFile', 'readySourceSha256']
    ]) {
      if (!isSafePath(item[key]) || !isSha(item[hashKey])) {
        problems('UNSAFE_PATH', i, key + ' or hash malformed');
        matched = false;
        continue;
      }
      const base = path.resolve(curriculumRoot);
      const name = path.resolve(base, item[key]);
      if (!name.startsWith(base + path.sep)) {
        problems('UNSAFE_PATH', i, key + ' escapes curriculum root');
        matched = false;
        continue;
      }
      let bytes;
      try { bytes = read(name); } catch (e) {
        problems('MISSING_FILE', i, item[key] + ': ' + (e.code ?? 'read error'));
        matched = false;
        continue;
      }
      if (sha256(bytes) !== item[hashKey]) {
        problems('STALE_HASH', i, item[key]);
        matched = false;
      }
      if (key === 'canonicalFile') {
        try {
          const lesson = JSON.parse(bytes.toString('utf8'));
          if (lesson.id !== item.sourceId) {
            problems('IDENTITY_MISMATCH', i, item.sourceId + ' vs ' + String(lesson.id));
            matched = false;
          }
        } catch {
          problems('INVALID_JSON', i, item[key]);
          matched = false;
        }
      }
    }
    if (matched) result.matches++;
  }
  if (manifest.lessonCount !== result.entries ||
      manifest.uniqueSourceIds !== seen.size ||
      manifest.duplicateSourceIds !== 0 ||
      manifest.databaseWritten !== false) {
    problems('INVALID_SUMMARY', null, 'manifest count or provenance invariant mismatch');
  }
  result.importSafe = result.evidence.length === 0 && result.entries > 0;
  return result;
}

export function runCli(argv = process.argv.slice(2)) {
  const known = new Set(['--manifest', '--report', '--strict']);
  for (let i = 0; i < argv.length; i++) {
    if (!known.has(argv[i])) throw new Error('Unknown argument: ' + argv[i]);
    if (argv[i] === '--manifest' || argv[i] === '--report') {
      if (!argv[i + 1] || argv[i + 1].startsWith('--')) throw new Error(argv[i] + ' needs a path');
      i++;
    }
  }
  const value = flag => argv.includes(flag) ? argv[argv.indexOf(flag) + 1] : undefined;
  const manifestPath = path.resolve(value('--manifest') ?? DEFAULT_MANIFEST);
  const reportPath = value('--report') && path.resolve(value('--report'));
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const report = { manifestPath, ...auditManifest(manifest) };
  if (reportPath) {
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
  }
  console.log(JSON.stringify({ ...report, evidence: report.evidence.slice(0, 10), omittedEvidence: Math.max(0, report.evidence.length - 10) }, null, 2));
  if (argv.includes('--strict') && !report.importSafe) process.exitCode = 1;
  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { runCli(); } catch (error) { console.error(error); process.exitCode = 2; }
}
