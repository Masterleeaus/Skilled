#!/usr/bin/env node
/**
 * Validate every URL in the authored course-art manifest resolves to a
 * repository-owned source file. Read-only: does not edit manifest, artwork or
 * the generated Next public/academy copy.
 */
import { readFileSync, lstatSync, realpathSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, relative, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspace = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = workspace;
const manifestFile = resolve(workspace, 'apps/frontend/src/lib/academy-brand.manifest.json');

function within(parent, child) {
  const rel = relative(parent, child);
  return rel !== '..' && !rel.startsWith('..' + sep) && !rel.startsWith(sep);
}

export function validateArtManifest({ manifest, sourceRoot = repoRoot } = {}) {
  if (manifest === undefined) manifest = JSON.parse(readFileSync(manifestFile, 'utf8'));
  const issues = [];
  let checked = 0;
  const record = (course, field, kind, value) => issues.push({course, field, kind, value});
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    return {schemaVersion: 1, courses: 0, referencedAssets: 0,
      issues: [{course: '*', field: '*', kind: 'invalid-manifest', value: null}], passed: false};
  }
  for (const [course, entry] of Object.entries(manifest)) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      record(course,'*','invalid-entry',null); continue;
    }
    const fields = ['icon','iconSvg','logo','thumb','banner'].map(field => [field, entry[field]]);
    if (entry.topics !== undefined && (!entry.topics || typeof entry.topics !== 'object' || Array.isArray(entry.topics))) {
      record(course, 'topics', 'invalid-map', null);
    } else for (const [topic, value] of Object.entries(entry.topics || {})) fields.push(['topics.' + topic, value]);
    if (entry.hero !== undefined && !Array.isArray(entry.hero)) record(course,'hero','invalid-list',null);
    else for (const [index,value] of (entry.hero || []).entries()) fields.push(['hero.' + index, value]);
    for (const [field,value] of fields) {
      if (value === null || value === undefined) continue;
      checked++;
      if (typeof value !== 'string' || !/^\/academy\/(brand|library)\/[a-zA-Z0-9_./-]+$/.test(value)) {
        record(course, field, 'unsafe-url', value); continue;
      }
      const rel = value.slice('/academy/'.length);
      const target = resolve(sourceRoot, rel);
      const sourceSection = resolve(sourceRoot, rel.split('/')[0]);
      if (!within(sourceSection,target) || !within(sourceRoot,target)) {
        record(course,field,'path-traversal',value); continue;
      }
      if (!existsSync(target)) { record(course,field,'missing-file',value); continue; }
      let file;
      try {
        file = lstatSync(target);
        const canonical = realpathSync(target);
        if (!within(sourceSection, canonical)) {
          record(course,field,'symlink-escape',value); continue;
        }
      } catch {
        record(course,field,'unreadable-file',value); continue;
      }
      if (!file.isFile() || file.isSymbolicLink()) record(course,field,'not-regular-file',value);
    }
  }
  return {schemaVersion: 1, courses: Object.keys(manifest).length, referencedAssets: checked,
    issues, passed: issues.length === 0,
    note: 'Tracked source-path audit, not proof of deployed HTTP asset availability'};
}

export function main(args=process.argv.slice(2)) {
  let report;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--report') {
      if (!args[i+1] || args[i+1].startsWith('--')) throw Error('Missing --report path');
      report = resolve(args[++i]);
    } else if (args[i] !== '--strict') throw Error('Unknown option: '+args[i]);
  }
  const result = validateArtManifest();
  if (report) { mkdirSync(dirname(report),{recursive:true}); writeFileSync(report,JSON.stringify(result,null,2)+'\n'); }
  console.log(JSON.stringify(result,null,2));
  if (args.includes('--strict') && !result.passed) process.exitCode=1;
}
if (process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try { main(); } catch(error) { console.error(error); process.exitCode=2; }
}
