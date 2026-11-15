#!/usr/bin/env node
// Checks that the five draft-only verticals with lesson drafts are wired into every mapping file consistently.
// Dependency-free. Fails if a mapping file lists a lesson that has no draft, or omits one that does.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const readJson = (rel) => JSON.parse(read(rel));
const parseCsv = (text) => text.split(/\r?\n/).filter(Boolean).map((line) => {
  const out = []; let cur = ''; let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) { if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
    else if (c === '"') q = true; else if (c === ',') { out.push(cur); cur = ''; } else cur += c;
  }
  out.push(cur); return out;
});

// Verticals wired by this change, including tutoring (#152) shell lessons.
const COURSES = {
  'mobile-nails': 5, 'dog-training': 6, 'nutrition-consult': 5, 'shortstay-host': 4, 'makeup-artistry': 5, tutoring: 5,
};

const draftsBySlug = {};
for (const slug of Object.keys(COURSES)) {
  const dir = path.join(root, 'curriculum/courses', slug);
  draftsBySlug[slug] = fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => readJson(`curriculum/courses/${slug}/${f}`)).filter((d) => d.id);
  assert.equal(draftsBySlug[slug].length, COURSES[slug], `${slug} lesson draft count`);
}

const structure = readJson('curriculum/structure/COURSES-MODULES.json').courses;
const mapRows = parseCsv(read('curriculum/structure/COURSE-MODULE-LESSON-MAP.csv').replace(/^﻿/, ''));
const levelMap = readJson('apps/backend/src/modules/levels/course-level-map.json').courses;

for (const slug of Object.keys(COURSES)) {
  const drafts = draftsBySlug[slug];
  const ids = drafts.map((d) => d.id).sort();

  // Every draft belongs to its course and is unapproved.
  for (const d of drafts) {
    assert.deepEqual(d.courseSlugs, [slug], `${d.id} courseSlugs`);
    assert.equal(d.status, 'DRAFT', `${d.id} must stay DRAFT`);
    assert.equal(d.reviewStatus, 'NOT REVIEWED', `${d.id} must stay NOT REVIEWED`);
  }

  // COURSES-MODULES.json: one course entry, lesson IDs equal the drafts, each with status DRAFT.
  const entries = structure.filter((c) => c.slug === slug);
  assert.equal(entries.length, 1, `${slug} appears once in COURSES-MODULES.json`);
  const structIds = entries[0].modules.flatMap((m) => m.lessons.map((l) => l.id)).sort();
  assert.deepEqual(structIds, ids, `${slug} lessons in COURSES-MODULES.json`);
  for (const m of entries[0].modules) {
    for (const l of m.lessons) assert.equal(l.status, 'DRAFT', `${l.id} structure status`);
    const draftModules = drafts.filter((d) => m.lessons.some((l) => l.id === d.id)).map((d) => d.moduleTitle);
    assert.ok(draftModules.every((t) => t === m.module), `${m.module} module title matches lesson files`);
  }

  // COURSE-MODULE-LESSON-MAP.csv: rows for this course equal the drafts.
  const rows = mapRows.filter((r) => r[0] === entries[0].title);
  assert.deepEqual(rows.map((r) => r[3]).sort(), ids, `${slug} rows in COURSE-MODULE-LESSON-MAP.csv`);
  for (const r of rows) assert.equal(r[6], 'DRAFT', `${r[3]} map status`);

  // curriculum/levels/<slug>.csv: lesson IDs equal the drafts and levels follow the layer default.
  const levelRows = parseCsv(read(`curriculum/levels/${slug}.csv`)).slice(1);
  assert.deepEqual(levelRows.map((r) => r[1]).sort(), ids, `${slug} rows in levels CSV`);
  const expectedLevel = { base: 'base', group: 'group', business: 'specialised', 'high-risk': 'specialised' };
  for (const r of levelRows) {
    const draft = drafts.find((d) => d.id === r[1]);
    assert.equal(r[3], draft.layer, `${r[1]} layer`);
    assert.equal(r[4], expectedLevel[draft.layer], `${r[1]} level`);
  }

  // course-level-map.json: same lessons and levels as the levels CSV.
  const compiled = levelMap[slug];
  assert.ok(compiled, `${slug} in course-level-map.json`);
  assert.deepEqual(Object.keys(compiled).sort(), ids, `${slug} lessons in course-level-map.json`);
  for (const r of levelRows) assert.equal(compiled[r[1]], r[4], `${r[1]} level in course-level-map.json`);
}

console.log(`PASS: course mapping wiring for ${Object.keys(COURSES).length} draft verticals across 4 mapping files`);
