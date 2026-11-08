/**
 * Tests for the tutor curriculum retrieval store (src/tutor/rag). Uses the fixture curriculum in ./fixtures plus
 * temporary folders for edge cases. No network, no database.
 */
import { test } from 'vitest';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  chunkLesson,
  createCurriculumRetrievalStore,
  documentIdForLesson,
  MAX_CHUNK_CHARS,
  parseLesson,
  PLATFORM_CURRICULUM_COMPANY_ID,
} from '../../../src/tutor/rag/index.ts';
import { retrieveChunks } from '../../../src/ai-runtime/retrieval.ts';
import { AiRuntimeError } from '../../../src/ai-runtime/types.ts';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROOT = path.join(HERE, 'fixtures', 'curriculum');
const REAL_ROOT = path.resolve(HERE, '../../../../../curriculum');

function readJson(rel) {
  return JSON.parse(readFileSync(path.join(FIXTURE_ROOT, rel), 'utf8'));
}

function tempCurriculum(files) {
  const root = mkdtempSync(path.join(tmpdir(), 'rag-test-'));
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(root, rel);
    mkdirSync(path.dirname(full), { recursive: true });
    writeFileSync(full, typeof content === 'string' ? content : JSON.stringify(content));
  }
  return root;
}

function minimalLesson(id, status = 'READY', extra = {}) {
  return {
    id,
    title: `Lesson ${id}`,
    instruction: [{ heading: 'Body', body: `Text for ${id} about kitchens.` }],
    status,
    ...extra,
  };
}

const PLATFORM = PLATFORM_CURRICULUM_COMPANY_ID;

// ---------- parsing ----------

test('parseLesson reads id, title, status and blocks, and never reads knowledge checks', () => {
  const lesson = parseLesson(readJson('courses/demo-course/DEMO-01.json'), 'courses/demo-course/DEMO-01.json');
  assert.equal(lesson.lessonId, 'DEMO-01');
  assert.equal(lesson.title, 'Working safely at height basics');
  assert.equal(lesson.status, 'READY');
  assert.equal(lesson.retired, false);
  const headings = lesson.blocks.map((block) => block.heading);
  for (const expected of ['Learning outcomes', 'Setting up the work area', 'Inspecting the access equipment', 'Procedure', 'Worked examples', 'Common errors', 'Summary']) {
    assert.ok(headings.includes(expected), `missing block ${expected}`);
  }
  assert.equal(JSON.stringify(lesson.blocks).includes('FIXTURE-KNOWLEDGE-CHECK'), false);
});

test('parseLesson returns null for a course manifest and throws for a lesson with no title', () => {
  assert.equal(parseLesson(readJson('courses/demo-course/demo-course-course.json'), 'manifest'), null);
  assert.equal(parseLesson(null, 'x'), null);
  assert.throws(() => parseLesson({ id: 'X-1', instruction: [] }, 'x.json'), /has no title/);
});

test('parseLesson marks retired and superseded lessons', () => {
  assert.equal(parseLesson(readJson('courses/demo-course/DEMO-04.json'), 'x').retired, true);
  assert.equal(parseLesson(minimalLesson('S-1', 'READY', { superseded: true }), 'x').retired, true);
  assert.equal(parseLesson(minimalLesson('S-2', 'READY', { supersededBy: 'S-9' }), 'x').retired, true);
});

test('documentIdForLesson is stable, a safe positive integer, and differs between lesson ids', () => {
  const a = documentIdForLesson('DEMO-01');
  assert.equal(a, documentIdForLesson('DEMO-01'));
  assert.ok(Number.isSafeInteger(a) && a >= 0);
  assert.notEqual(a, documentIdForLesson('DEMO-02'));
});

// ---------- chunking ----------

test('chunkLesson keeps every chunk within MAX_CHUNK_CHARS, numbers chunks from 0, and starts each with its heading', () => {
  const lesson = parseLesson(readJson('courses/demo-course/DEMO-01.json'), 'x');
  const chunks = chunkLesson(lesson);
  assert.ok(chunks.length > 0);
  chunks.forEach((chunk, i) => {
    assert.equal(chunk.chunkIndex, i);
    assert.ok(chunk.text.length <= MAX_CHUNK_CHARS, `chunk ${i} is ${chunk.text.length} characters`);
    assert.ok(chunk.text.trim() !== '');
    if (chunk.heading) assert.ok(chunk.text.startsWith(`${chunk.heading}\n`));
  });
  // The first instruction section is long enough to need more than one chunk.
  const setup = chunks.filter((chunk) => chunk.heading === 'Setting up the work area');
  assert.ok(setup.length >= 2, 'long section should be split');
});

test('chunkLesson splits one oversize unit without losing or reordering words', () => {
  const sentences = Array.from({ length: 200 }, (_, i) => `Sentence number ${i} holds a few ordinary words.`);
  const lesson = { lessonId: 'BIG', title: 'Big', status: 'READY', retired: false, blocks: [{ heading: null, units: [sentences.join(' ')] }] };
  const chunks = chunkLesson(lesson);
  assert.ok(chunks.length > 1);
  assert.ok(chunks.every((chunk) => chunk.text.length <= MAX_CHUNK_CHARS));
  const rebuilt = chunks.map((chunk) => chunk.text).join(' ').split(/\s+/);
  assert.deepEqual(rebuilt, sentences.join(' ').split(/\s+/));
});

test('chunkLesson gives no chunk for a lesson with no text', () => {
  assert.deepEqual(chunkLesson({ lessonId: 'E', title: 'E', status: 'READY', retired: false, blocks: [] }), []);
});

// ---------- index build ----------

test('index build reports what was indexed and what was excluded, with drafts excluded by default', () => {
  const store = createCurriculumRetrievalStore({ allowRawFileIndex: true, curriculumRoot: FIXTURE_ROOT });
  const r = store.report;
  assert.equal(r.lessons_indexed, 2, 'DEMO-01 and SAF-01');
  assert.equal(r.lessons_excluded_draft, 1, 'DEMO-02');
  assert.equal(r.lessons_excluded_other_status, 1, 'DEMO-03 RETIRED');
  assert.equal(r.lessons_excluded_retired, 1, 'DEMO-04 retired marker');
  assert.equal(r.non_lesson_json_skipped, 1, 'course manifest');
  assert.equal(r.assessment_files_skipped, 1, 'SAF-01.assessment.json');
  assert.equal(r.folders_skipped, 1, 'retired/ subfolder inside courses/');
  assert.equal(r.json_files_seen, 6);
  assert.ok(r.chunks > 0);
});

test('includeDrafts adds DRAFT lessons and nothing else', () => {
  const r = createCurriculumRetrievalStore({ allowRawFileIndex: true, curriculumRoot: FIXTURE_ROOT, includeDrafts: true }).report;
  assert.equal(r.lessons_indexed, 3);
  assert.equal(r.lessons_excluded_draft, 0);
  assert.equal(r.lessons_excluded_retired, 1);
  assert.equal(r.lessons_excluded_other_status, 1);
});

test('retired folder, legacy lessons/ folder and assessment files are never indexed', async () => {
  const store = createCurriculumRetrievalStore({ allowRawFileIndex: true, curriculumRoot: FIXTURE_ROOT, includeDrafts: true });
  const all = await store.findCandidates({ companyId: PLATFORM, terms: ['ladder', 'isolation', 'assessor-only', 'retired-folder-text', 'in-scope-retired-text', 'legacy-folder-text'], limit: 1000 });
  const sources = all.map((c) => c.document.source);
  assert.ok(sources.every((s) => !s.includes('retired/') && !s.startsWith('lessons/')), sources.join(', '));
  assert.equal(all.some((c) => c.content.includes('ASSESSOR-ONLY')), false);
  assert.equal(all.some((c) => c.content.includes('IN-SCOPE-RETIRED-TEXT')), false);
  assert.equal(all.some((c) => c.content.includes('RETIRED-FOLDER-TEXT')), false);
  assert.equal(all.some((c) => c.content.includes('LEGACY-FOLDER-TEXT')), false);
});

test('a READY lesson with a retired marker, a RETIRED status, and a DRAFT lesson are kept out of default results', async () => {
  const store = createCurriculumRetrievalStore({ allowRawFileIndex: true, curriculumRoot: FIXTURE_ROOT });
  const hits = await store.findCandidates({ companyId: PLATFORM, terms: ['ladder'], limit: 1000 });
  const sources = new Set(hits.map((c) => c.document.source));
  assert.equal(sources.has('courses/demo-course/DEMO-02.json'), false, 'draft');
  assert.equal(sources.has('courses/demo-course/DEMO-03.json'), false, 'RETIRED status');
  assert.equal(sources.has('courses/demo-course/DEMO-04.json'), false, 'retired marker');
  assert.ok(sources.has('courses/demo-course/DEMO-01.json'));

  const withDrafts = createCurriculumRetrievalStore({ allowRawFileIndex: true, curriculumRoot: FIXTURE_ROOT, includeDrafts: true });
  const draftHits = await withDrafts.findCandidates({ companyId: PLATFORM, terms: ['ladder'], limit: 1000 });
  assert.ok(draftHits.some((c) => c.document.source === 'courses/demo-course/DEMO-02.json'));
});

test('index build fails loudly on invalid JSON, a missing scan folder, duplicate ids, and a missing root', () => {
  assert.throws(() => createCurriculumRetrievalStore({ allowRawFileIndex: true, curriculumRoot: path.join(HERE, 'no-such-folder') }), (e) => e instanceof AiRuntimeError && e.code === 'config_invalid');
  assert.throws(() => createCurriculumRetrievalStore({ allowRawFileIndex: true, curriculumRoot: '  ' }), (e) => e instanceof AiRuntimeError && e.code === 'config_invalid');

  const noShared = tempCurriculum({ 'courses/x/A-1.json': minimalLesson('A-1') });
  try {
    assert.throws(() => createCurriculumRetrievalStore({ allowRawFileIndex: true, curriculumRoot: noShared }), /shared/);
  } finally {
    rmSync(noShared, { recursive: true, force: true });
  }

  const badJson = tempCurriculum({ 'courses/x/A-1.json': '{ not json', 'shared/s/B-1.json': minimalLesson('B-1') });
  try {
    assert.throws(() => createCurriculumRetrievalStore({ allowRawFileIndex: true, curriculumRoot: badJson }), (e) => e instanceof AiRuntimeError && /not valid JSON/.test(e.message));
  } finally {
    rmSync(badJson, { recursive: true, force: true });
  }

  const dupes = tempCurriculum({ 'courses/x/A-1.json': minimalLesson('A-1'), 'shared/s/A-1.json': minimalLesson('A-1') });
  try {
    assert.throws(() => createCurriculumRetrievalStore({ allowRawFileIndex: true, curriculumRoot: dupes }), /duplicate lesson id A-1/);
  } finally {
    rmSync(dupes, { recursive: true, force: true });
  }
});

test('symlinks inside the curriculum are skipped, so nothing outside the folder is read', () => {
  const root = tempCurriculum({ 'courses/x/A-1.json': minimalLesson('A-1'), 'shared/s/.keep': '' });
  const outside = mkdtempSync(path.join(tmpdir(), 'rag-outside-'));
  try {
    const target = path.join(outside, 'OUT-1.json');
    writeFileSync(target, JSON.stringify(minimalLesson('OUT-1')));
    symlinkSync(target, path.join(root, 'courses', 'x', 'OUT-1.json'));
    const r = createCurriculumRetrievalStore({ allowRawFileIndex: true, curriculumRoot: root }).report;
    assert.equal(r.symlinks_skipped, 1);
    assert.equal(r.lessons_indexed, 1);
  } finally {
    rmSync(root, { recursive: true, force: true });
    rmSync(outside, { recursive: true, force: true });
  }
});

test('a scan folder that is itself a symlink is refused', () => {
  const root = tempCurriculum({ 'real/courses/x/A-1.json': minimalLesson('A-1'), 'shared/s/.keep': '' });
  try {
    symlinkSync(path.join(root, 'real', 'courses'), path.join(root, 'courses'));
    assert.throws(() => createCurriculumRetrievalStore({ allowRawFileIndex: true, curriculumRoot: root }), /courses/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

// ---------- term matching and limit ----------

test('findCandidates matches terms case-insensitively and returns only chunks that contain a term', async () => {
  const store = createCurriculumRetrievalStore({ allowRawFileIndex: true, curriculumRoot: FIXTURE_ROOT });
  const lower = await store.findCandidates({ companyId: PLATFORM, terms: ['ladder'], limit: 1000 });
  const upper = await store.findCandidates({ companyId: PLATFORM, terms: ['LaDdEr'], limit: 1000 });
  assert.ok(lower.length > 0);
  assert.deepEqual(upper, lower);
  for (const c of lower) assert.ok(c.content.toLowerCase().includes('ladder'));
});

test('terms shorter than MIN_TERM_LENGTH are ignored, and a query of only short terms returns nothing', async () => {
  const store = createCurriculumRetrievalStore({ allowRawFileIndex: true, curriculumRoot: FIXTURE_ROOT });
  assert.deepEqual(await store.findCandidates({ companyId: PLATFORM, terms: ['to', 'ab'], limit: 100 }), []);
  const withShort = await store.findCandidates({ companyId: PLATFORM, terms: ['to', 'ladder'], limit: 1000 });
  const without = await store.findCandidates({ companyId: PLATFORM, terms: ['ladder'], limit: 1000 });
  assert.deepEqual(withShort, without);
  assert.deepEqual(await store.findCandidates({ companyId: PLATFORM, terms: [], limit: 100 }), []);
});

test('a chunk matches when any term is present', async () => {
  const store = createCurriculumRetrievalStore({ allowRawFileIndex: true, curriculumRoot: FIXTURE_ROOT });
  const hits = await store.findCandidates({ companyId: PLATFORM, terms: ['isolation', 'zzzzzz'], limit: 100 });
  assert.ok(hits.length > 0);
  assert.ok(hits.every((c) => c.document.source === 'shared/safety/SAF-01.json'));
});

test('the limit is applied after the term filter, so earlier non-matching chunks do not use up the limit', async () => {
  const store = createCurriculumRetrievalStore({ allowRawFileIndex: true, curriculumRoot: FIXTURE_ROOT });
  const all = await store.findCandidates({ companyId: PLATFORM, terms: ['ladder'], limit: 1000 });
  // The first chunk of the index (DEMO-01, chunk 0) is about the set-up area and has no "ladder", so it must be skipped.
  assert.equal(all[0].document.source, 'courses/demo-course/DEMO-01.json');
  assert.ok(all[0].chunk_index > 0);
  const first = await store.findCandidates({ companyId: PLATFORM, terms: ['ladder'], limit: 1 });
  assert.equal(first.length, 1);
  assert.deepEqual(first[0], all[0]);
  assert.ok(first[0].content.toLowerCase().includes('ladder'));
  const two = await store.findCandidates({ companyId: PLATFORM, terms: ['ladder'], limit: 2 });
  assert.deepEqual(two, all.slice(0, 2));
});

test('results come back in corpus order (source, then chunk index), not by recency', async () => {
  const store = createCurriculumRetrievalStore({ allowRawFileIndex: true, curriculumRoot: FIXTURE_ROOT, includeDrafts: true });
  const all = await store.findCandidates({ companyId: PLATFORM, terms: ['ladder', 'isolation'], limit: 1000 });
  const keys = all.map((c) => [c.document.source, c.chunk_index]);
  const sorted = [...keys].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] - b[1]));
  assert.deepEqual(keys, sorted);
});

test('limit below 1 or not a number returns an empty list', async () => {
  const store = createCurriculumRetrievalStore({ allowRawFileIndex: true, curriculumRoot: FIXTURE_ROOT });
  assert.deepEqual(await store.findCandidates({ companyId: PLATFORM, terms: ['ladder'], limit: 0 }), []);
  assert.deepEqual(await store.findCandidates({ companyId: PLATFORM, terms: ['ladder'], limit: Number.NaN }), []);
  assert.equal((await store.findCandidates({ companyId: PLATFORM, terms: ['ladder'], limit: 1.9 })).length, 1);
});

// ---------- tenant guard ----------

test('findCandidates rejects a learner company id, in number or string form, and a missing id', async () => {
  const store = createCurriculumRetrievalStore({ allowRawFileIndex: true, curriculumRoot: FIXTURE_ROOT });
  for (const companyId of [7, '7', 'acme-learner']) {
    await assert.rejects(store.findCandidates({ companyId, terms: ['ladder'], limit: 10 }), (e) => e instanceof AiRuntimeError && e.code === 'input_invalid', String(companyId));
  }
  await assert.rejects(store.findCandidates({ companyId: undefined, terms: ['ladder'], limit: 10 }), (e) => e.code === 'company_id_required');
  await assert.rejects(store.findCandidates({ companyId: 'platform-curriculum ', terms: ['ladder'], limit: 10 }), (e) => e.code === 'company_id_invalid');
});

test('findCandidates accepts the platform id and every chunk it returns is owned by the platform', async () => {
  const store = createCurriculumRetrievalStore({ allowRawFileIndex: true, curriculumRoot: FIXTURE_ROOT });
  const hits = await store.findCandidates({ companyId: PLATFORM, terms: ['ladder'], limit: 100 });
  assert.ok(hits.length > 0);
  assert.ok(hits.every((c) => c.company_id === PLATFORM && c.document.doc_type === 'lesson'));
});

test('retrieveChunks with a learner company id is rejected before any result is returned', async () => {
  const store = createCurriculumRetrievalStore({ allowRawFileIndex: true, curriculumRoot: FIXTURE_ROOT });
  await assert.rejects(retrieveChunks({ companyId: 7, query: 'ladder inspection', store }), (e) => e instanceof AiRuntimeError);
});

test('retrieveChunks with the platform id returns ranked curriculum passages end to end', async () => {
  const store = createCurriculumRetrievalStore({ allowRawFileIndex: true, curriculumRoot: FIXTURE_ROOT });
  const results = await retrieveChunks({ companyId: PLATFORM, query: 'ladder inspection', store });
  assert.ok(results.length > 0 && results.length <= 5);
  for (const r of results) {
    assert.equal(r.metadata.company_id, PLATFORM);
    assert.equal(r.metadata.doc_type, 'lesson');
    assert.ok(r.text.toLowerCase().includes('ladder') || r.text.toLowerCase().includes('inspection'));
  }
});

// ---------- real curriculum (skipped when the folder is not present) ----------

test('real curriculum builds with the same rules (skipped when the curriculum folder is absent)', { skip: !existsSync(path.join(REAL_ROOT, 'courses')) }, async () => {
  const strict = createCurriculumRetrievalStore({ allowRawFileIndex: true, curriculumRoot: REAL_ROOT });
  const withDrafts = createCurriculumRetrievalStore({ allowRawFileIndex: true, curriculumRoot: REAL_ROOT, includeDrafts: true });
  assert.equal(strict.report.lessons_indexed + strict.report.lessons_excluded_draft, withDrafts.report.lessons_indexed);
  assert.ok(withDrafts.report.lessons_indexed > 0);
  const hits = await withDrafts.findCandidates({ companyId: PLATFORM, terms: ['hygiene'], limit: 1000 });
  assert.ok(hits.length > 0);
  assert.ok(hits.every((c) => !c.document.source.includes('retired/') && !c.document.source.startsWith('lessons/')));
});
