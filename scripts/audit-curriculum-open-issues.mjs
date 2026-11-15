#!/usr/bin/env node
/**
 * Code-only, read-only audit for the curriculum review issues #17, #19, #20, #21 and #24.
 *
 * Usage:
 *   node scripts/audit-curriculum-open-issues.mjs                 # print a summary
 *   node scripts/audit-curriculum-open-issues.mjs --report <path> # also write the JSON item-level report
 *
 * This script decides nothing. It lists items that need human review. It does not approve
 * classifications, change course membership, or edit any curriculum file.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const reportIndex = args.indexOf('--report');
const reportPath = reportIndex >= 0 ? path.resolve(args[reportIndex + 1] ?? '') : null;
if (reportIndex >= 0 && !args[reportIndex + 1]) {
  console.error('--report requires a path');
  process.exit(2);
}

const rel = (p) => path.relative(root, p).split(path.sep).join('/');

/** Walk the same source set as the publisher loader: curriculum/courses and curriculum/shared. */
function listJson(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) listJson(p, out);
    else if (entry.name.endsWith('.json')) out.push(p);
  }
  return out;
}

const drafts = [];
for (const dir of ['curriculum/courses', 'curriculum/shared']) {
  for (const file of listJson(path.join(root, dir))) {
    let json;
    try {
      json = JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
      continue;
    }
    if (json && typeof json.id === 'string' && typeof json.title === 'string') {
      drafts.push({ file: rel(file), json });
    }
  }
}
const draftIds = new Set(drafts.map((d) => d.json.id));

/** Minimal RFC 4180 parser: quoted fields may contain commas. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      field = '';
    } else field += c;
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  const [header, ...body] = rows.filter((r) => r.length > 1 || r[0] !== '');
  return { header, rows: body };
}

// #20: lessons with no course placement (courseSlugs empty). Item-level only; membership unchanged.
const unmapped = drafts
  .filter((d) => !Array.isArray(d.json.courseSlugs) || d.json.courseSlugs.length === 0)
  .map((d) => ({ id: d.json.id, file: d.file, title: d.json.title, moduleTitle: d.json.moduleTitle ?? null }));

// #19: drafts without measurable learning outcomes (missing, empty, or a very short outcome).
const outcomeGaps = drafts
  .map((d) => {
    const outcomes = Array.isArray(d.json.learningOutcomes) ? d.json.learningOutcomes : [];
    const reasons = [];
    if (outcomes.length === 0) reasons.push('no learningOutcomes');
    if (outcomes.some((o) => String(o).trim().length < 20)) reasons.push('outcome shorter than 20 characters');
    return { id: d.json.id, file: d.file, reasons };
  })
  .filter((g) => g.reasons.length > 0);

// #17: drafts without usable instructional sections (no section body, or under 400 characters in total).
const sectionGaps = drafts
  .map((d) => {
    const sections = Array.isArray(d.json.instruction) ? d.json.instruction : [];
    const total = sections.reduce((n, s) => n + String(s?.body ?? '').trim().length, 0);
    const reasons = [];
    if (sections.every((s) => String(s?.body ?? '').trim() === '')) reasons.push('no instruction body');
    else if (total < 400) reasons.push(`instruction text only ${total} characters`);
    return { id: d.json.id, file: d.file, reasons };
  })
  .filter((g) => g.reasons.length > 0);

// #24: reuse classifications. Count rows, decisions and ids that do not match a current draft.
const classificationPath = path.join(root, 'curriculum/planning/LESSON-REUSE-CLASSIFICATION.csv');
const cls = parseCsv(fs.readFileSync(classificationPath, 'utf8'));
const clsIdx = Object.fromEntries(cls.header.map((h, i) => [h, i]));
const decisions = {};
for (const r of cls.rows) decisions[r[clsIdx.decision]] = (decisions[r[clsIdx.decision]] ?? 0) + 1;
const clsRows = cls.rows.map((r) => ({ id: r[clsIdx.id], decision: r[clsIdx.decision], target: r[clsIdx.target] }));
const clsNotInDrafts = clsRows.filter((r) => !draftIds.has(r.id)).map((r) => r.id);
const classification = {
  source: rel(classificationPath),
  columns: cls.header,
  rows: cls.rows.length,
  fieldCountMismatches: cls.rows.filter((r) => r.length !== cls.header.length).length,
  columnsWithReviewerOrRationale: cls.header.filter((h) => /review|rational|approv/i.test(h)),
  reviewedRows: 0,
  decisions,
  idsNotInCurrentDrafts: clsNotInDrafts,
};

// #21: brief to draft reconciliation. Every brief and draft must be accounted for.
const recPath = path.join(root, 'curriculum/planning/BRIEF-DRAFT-RECONCILIATION.csv');
const rec = parseCsv(fs.readFileSync(recPath, 'utf8'));
const rIdx = Object.fromEntries(rec.header.map((h, i) => [h, i]));
const recTypes = {};
const briefSeen = new Set();
const draftSeen = new Set();
for (const r of rec.rows) {
  recTypes[r[rIdx.record_type]] = (recTypes[r[rIdx.record_type]] ?? 0) + 1;
  if (r[rIdx.brief_id]) briefSeen.add(r[rIdx.brief_id]);
  if (r[rIdx.draft_id]) draftSeen.add(r[rIdx.draft_id]);
}
const reconciliation = {
  source: rel(recPath),
  rows: rec.rows.length,
  recordTypes: recTypes,
  uniqueBriefIdsListed: briefSeen.size,
  uniqueDraftIdsListed: draftSeen.size,
  confirmedMatches: rec.rows.filter((r) => r[rIdx.record_type] === 'MATCH').length,
  note: 'Rows marked POSSIBLE are not counted as matches. Brief-side and draft-side totals are reported, not merged.',
};

const report = {
  schemaVersion: 1,
  generatedFor: ['#17', '#19', '#20', '#21', '#24'],
  sourceDrafts: drafts.length,
  issue20UnmappedLessons: { count: unmapped.length, items: unmapped },
  issue19OutcomeGaps: { count: outcomeGaps.length, items: outcomeGaps },
  issue17SectionGaps: { count: sectionGaps.length, items: sectionGaps },
  issue24Classifications: classification,
  issue21Reconciliation: reconciliation,
  humanReviewRequired: true,
};

console.log(`#20 unmapped lessons: ${unmapped.length}`);
console.log(`#19 outcome gaps: ${outcomeGaps.length}`);
console.log(`#17 instruction gaps: ${sectionGaps.length}`);
console.log(`#24 classification rows: ${classification.rows}, reviewed: ${classification.reviewedRows}, ids not in drafts: ${clsNotInDrafts.length}, field mismatches: ${classification.fieldCountMismatches}`);
console.log(`#21 reconciliation rows: ${reconciliation.rows}, confirmed matches: ${reconciliation.confirmedMatches}, briefs listed: ${briefSeen.size}, drafts listed: ${draftSeen.size}`);

if (reportPath) {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`report written: ${rel(reportPath)}`);
}
