#!/usr/bin/env node
// ACA-012: assessment coverage audit. Read-only: it changes no curriculum file, approves nothing and does not touch publication.
//
// Required items are the course placements in curriculum/levels/<slug>.csv (ALL-LESSON-LEVELS.csv is an index and is skipped),
// which are the same rows compiled into apps/backend/src/modules/levels/course-level-map.json. Each course has two tracks:
// the licensed track holds every placed lesson, and the non-licensed track leaves out lessons whose licence status is
// `required` (curriculum/licence/lesson-licence.json, with unknown statuses treated as required, as in licence-track.ts).
//
// Each required lesson is matched to curriculum/assessments/<lessonId>.assessment.json and given one state:
//   missing      no assessment file
//   invalid      the file breaks a hard rule (shape, answer index, duplicate IDs, no assessment content)
//   mismatch     reconcile-assessment-questions.mjs finds the answers and the lesson's knowledge checks disagree
//   draft        usable, but status is DRAFT or PROPOSED, or it carries a review flag
//   reconciled   usable, reconciled, no draft flags, not yet reviewed by a person
//   reviewed     reviewStatus is REVIEWED or APPROVED in the file (a person set it; this script never does)
//   publishable  reviewed, reconciled, and the pass rule and any required evidence are present
//
// Uncovered = missing, invalid, mismatch, or a practical lesson with no evidence type. Those are findings for human review.
// Output: build/assessment-coverage.json (ignored by git). With --markdown <path>, also a summary. Answer keys are never written out.
//
// Usage: node scripts/assessment-coverage.mjs [--json <path>] [--markdown <path>]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { audit as reconcileAudit } from './reconcile-assessment-questions.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argValue = (name) => { const i = process.argv.indexOf(name); return i === -1 ? null : process.argv[i + 1] ?? null; };
const jsonOut = path.resolve(argValue('--json') ?? path.join(root, 'build/assessment-coverage.json'));
const markdownOut = argValue('--markdown') ? path.resolve(argValue('--markdown')) : null;

const rel = (file) => path.relative(root, file).split(path.sep).join('/');
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

// RFC 4180 subset: quoted fields, doubled quotes, CRLF or LF line endings.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false; } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((v) => v !== ''));
}

// ---- Required items: course placements ------------------------------------------------------------------------
const levelsDir = path.join(root, 'curriculum/levels');
const placements = [];
const levelFiles = fs.readdirSync(levelsDir).filter((n) => n.endsWith('.csv') && n !== 'ALL-LESSON-LEVELS.csv').sort();
for (const name of levelFiles) {
  const [header, ...body] = parseCsv(fs.readFileSync(path.join(levelsDir, name), 'utf8'));
  const col = Object.fromEntries(header.map((h, i) => [h.trim(), i]));
  for (const r of body) {
    placements.push({ courseSlug: r[col.course_slug], lessonId: r[col.lesson_id], level: r[col.level], source: `curriculum/levels/${name}` });
  }
}

const courseMap = readJson(path.join(root, 'apps/backend/src/modules/levels/course-level-map.json')).courses;
const placementsBySlug = new Map();
for (const p of placements) {
  if (!placementsBySlug.has(p.courseSlug)) placementsBySlug.set(p.courseSlug, new Set());
  placementsBySlug.get(p.courseSlug).add(p.lessonId);
}
const duplicatePlacements = [];
{
  const seen = new Set();
  for (const p of placements) {
    const key = `${p.courseSlug}\u0000${p.lessonId}`;
    if (seen.has(key)) duplicatePlacements.push(`${p.courseSlug}/${p.lessonId}`);
    seen.add(key);
  }
}
const mapMismatches = [];
for (const slug of new Set([...placementsBySlug.keys(), ...Object.keys(courseMap)])) {
  const csv = placementsBySlug.get(slug) ?? new Set();
  const map = new Set(Object.keys(courseMap[slug] ?? {}));
  const onlyCsv = [...csv].filter((id) => !map.has(id));
  const onlyMap = [...map].filter((id) => !csv.has(id));
  if (onlyCsv.length || onlyMap.length) mapMismatches.push({ courseSlug: slug, onlyInCsv: onlyCsv.sort(), onlyInMap: onlyMap.sort() });
}

// ---- Track placements: licence status per lesson --------------------------------------------------------------
const licenceLessons = readJson(path.join(root, 'curriculum/licence/lesson-licence.json')).lessons;
const licenceStatus = new Map(licenceLessons.map((l) => [l.lessonId, l.status]));
const KNOWN_LICENCE = new Set(['required', 'threshold', 'not_required', 'not_checked']);
const licenceOf = (id) => {
  const raw = licenceStatus.get(id) ?? 'not_checked';
  return KNOWN_LICENCE.has(raw) ? raw : 'required';
};

// ---- Assessment evidence -------------------------------------------------------------------------------------
const assessmentDir = path.join(root, 'curriculum/assessments');
const reconciliation = reconcileAudit(root);
const reconById = new Map(reconciliation.records.map((r) => [r.lessonId, r]));
const APPROVED = new Set(['REVIEWED', 'APPROVED']);

function describeAssessment(lessonId) {
  const file = path.join(assessmentDir, `${lessonId}.assessment.json`);
  if (!fs.existsSync(file)) return { state: 'missing', file: null };
  const hard = [];
  const review = [];
  let data;
  try { data = readJson(file); } catch { return { state: 'invalid', file: rel(file), hard: ['invalid_json'], review: [], reconcile: [] }; }

  if (data.lessonId !== lessonId) hard.push('lesson_id_mismatch');
  const answers = Array.isArray(data.knowledgeAnswers) ? data.knowledgeAnswers : null;
  if (!answers) hard.push('knowledge_answers_not_array');
  else {
    const ids = new Set();
    for (const a of answers) {
      if (typeof a?.id !== 'string' || !a.id.trim()) hard.push('answer_missing_id');
      else if (ids.has(a.id)) hard.push('duplicate_answer_id');
      ids.add(a?.id);
      if (!Number.isInteger(a?.correctIndex) || a.correctIndex < 0) hard.push('invalid_correct_index');
      if (typeof a?.rationale !== 'string' || !a.rationale.trim()) review.push('missing_rationale');
    }
  }
  const criteria = Array.isArray(data.practicalCriteria) ? data.practicalCriteria.filter((s) => typeof s === 'string' && s.trim()) : null;
  if (!criteria) hard.push('practical_criteria_not_array');
  const evidenceRaw = Array.isArray(data.evidenceRequired) ? data.evidenceRequired.map((s) => String(s).trim()).filter(Boolean) : null;
  if (!evidenceRaw) hard.push('evidence_required_not_array');
  if (!Array.isArray(data.stopWorkCriteria)) hard.push('stop_work_criteria_not_array');
  const knowledgeChecks = answers ? answers.length : 0;
  const practicalCount = criteria ? criteria.length : 0;
  const evidenceCount = evidenceRaw ? evidenceRaw.length : 0;
  if (!knowledgeChecks && !practicalCount && !evidenceCount) hard.push('no_assessment_content');

  const passRuleOk = typeof data.passRule === 'string' && data.passRule.trim() !== '';
  if (!passRuleOk) review.push('missing_pass_rule');
  const draftStatus = typeof data.status === 'string' && /^(DRAFT|PROPOSED)/i.test(data.status.trim());
  if (draftStatus) review.push('draft_status');

  const evidenceTypes = new Set((evidenceRaw ?? []).map((label) => label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')).filter(Boolean));
  const requiresPractical = practicalCount > 0 || evidenceCount > 0;
  const evidenceGap = requiresPractical && evidenceTypes.size === 0;

  const reconcile = (reconById.get(lessonId)?.findings ?? []).map((f) => f.code);
  const reviewStatus = typeof data.reviewStatus === 'string' ? data.reviewStatus.trim().toUpperCase() : null;
  const reviewed = reviewStatus !== null && APPROVED.has(reviewStatus);

  let state;
  if (hard.length) state = 'invalid';
  else if (reconcile.length) state = 'mismatch';
  else if (review.length) state = 'draft';
  else if (!reviewed) state = 'reconciled';
  else if (!evidenceGap && passRuleOk) state = 'publishable';
  else state = 'reviewed';

  return {
    state,
    file: rel(file),
    knowledgeChecks,
    practicalCriteria: practicalCount,
    evidenceTypes: evidenceTypes.size,
    requiresPractical,
    evidenceGap,
    passRuleOk,
    hard: [...new Set(hard)].sort(),
    review: [...new Set(review)].sort(),
    reconcile: [...new Set(reconcile)].sort(),
  };
}

// ---- Build per-lesson and per-placement records ---------------------------------------------------------------
const lessonIds = [...new Set(placements.map((p) => p.lessonId))].sort();
const assessmentByLesson = new Map(lessonIds.map((id) => [id, describeAssessment(id)]));
const UNCOVERED = new Set(['missing', 'invalid', 'mismatch']);

const requirements = placements.map((p) => {
  const a = assessmentByLesson.get(p.lessonId);
  const licence = licenceOf(p.lessonId);
  const uncoveredReason = a.state === 'missing' || a.state === 'invalid' || a.state === 'mismatch'
    ? a.state
    : a.evidenceGap ? 'evidence_gap' : null;
  return {
    courseSlug: p.courseSlug,
    lessonId: p.lessonId,
    level: p.level,
    tracks: { licensed: true, nonLicensed: licence !== 'required' },
    licenceStatus: licence,
    assessmentState: a.state,
    assessmentFile: a.file,
    uncoveredReason,
  };
});

const courses = [...placementsBySlug.keys()].sort().map((slug) => {
  const rows = requirements.filter((r) => r.courseSlug === slug);
  const states = {};
  for (const r of rows) states[r.assessmentState] = (states[r.assessmentState] ?? 0) + 1;
  const uncovered = rows.filter((r) => r.uncoveredReason).map((r) => ({ lessonId: r.lessonId, reason: r.uncoveredReason }));
  return {
    courseSlug: slug,
    requiredLessons: rows.length,
    nonLicensedTrackLessons: rows.filter((r) => r.tracks.nonLicensed).length,
    licensedTrackLessons: rows.length,
    assessmentStates: states,
    uncoveredCount: uncovered.length,
    uncovered,
    complete: uncovered.length === 0,
    publishable: rows.every((r) => assessmentByLesson.get(r.lessonId).state === 'publishable'),
  };
});

const stateCounts = {};
for (const a of assessmentByLesson.values()) stateCounts[a.state] = (stateCounts[a.state] ?? 0) + 1;
// Per-code counts over the required lessons only, so reviewers see why each lesson is in draft or mismatch.
const findingCounts = { hard: {}, review: {}, reconcile: {} };
for (const id of lessonIds) {
  const a = assessmentByLesson.get(id);
  for (const kind of Object.keys(findingCounts)) {
    for (const code of a[kind] ?? []) findingCounts[kind][code] = (findingCounts[kind][code] ?? 0) + 1;
  }
}
const referenced = new Set(lessonIds);
const assessmentFiles = fs.readdirSync(assessmentDir).filter((n) => n.endsWith('.assessment.json')).map((n) => n.slice(0, -'.assessment.json'.length)).sort();
const orphanAssessments = assessmentFiles.filter((id) => !referenced.has(id));
const uncoveredRequirements = requirements.filter((r) => r.uncoveredReason);

const result = {
  schemaVersion: 1,
  generatedBy: 'scripts/assessment-coverage.mjs',
  inputs: {
    levelFiles: levelFiles.length,
    coursePlacements: placements.length,
    courses: placementsBySlug.size,
    uniqueRequiredLessons: lessonIds.length,
    assessmentFiles: assessmentFiles.length,
    licenceLessons: licenceLessons.length,
  },
  summary: {
    requirements: placements.length,
    requirementsCovered: placements.length - uncoveredRequirements.length,
    requirementsUncovered: uncoveredRequirements.length,
    uncoveredByReason: uncoveredRequirements.reduce((acc, r) => ((acc[r.uncoveredReason] = (acc[r.uncoveredReason] ?? 0) + 1), acc), {}),
    lessonAssessmentStates: stateCounts,
    coursesComplete: courses.filter((c) => c.complete).length,
    coursesPublishable: courses.filter((c) => c.publishable).length,
    publishableLessons: stateCounts.publishable ?? 0,
    reviewedLessons: stateCounts.reviewed ?? 0,
    findingCounts,
    orphanAssessmentFiles: orphanAssessments.length,
    duplicatePlacements: duplicatePlacements.length,
    courseMapMismatches: mapMismatches.length,
    licensedTrackRequirements: requirements.length,
    nonLicensedTrackRequirements: requirements.filter((r) => r.tracks.nonLicensed).length,
  },
  courses,
  requirements,
  uncoveredRequirements,
  orphanAssessmentFiles: orphanAssessments,
  duplicatePlacements,
  courseMapMismatches: mapMismatches,
  notes: [
    'No assessment is approved by this script. Reviewed and publishable states need a person to set reviewStatus in the assessment file.',
    'Answer keys are not written to this output.',
    'Publication behaviour is unchanged. This audit is read-only.',
  ],
};

fs.mkdirSync(path.dirname(jsonOut), { recursive: true });
fs.writeFileSync(jsonOut, JSON.stringify(result, null, 2) + '\n');

if (markdownOut) {
  const lines = [];
  const s = result.summary;
  lines.push('# Assessment coverage: required lessons and courses', '');
  lines.push('Generated by `scripts/assessment-coverage.mjs` on 2026-11-08 (read-only audit). Closes ACA-012 as a repeatable audit. Coverage gaps are findings for human review, not defects fixed here.', '');
  lines.push('Re-run with `node scripts/assessment-coverage.mjs --markdown docs/ASSESSMENT-COVERAGE-2026-11-08.md`. The full record, with every requirement, is in `build/assessment-coverage.json` (git-ignored).', '');
  lines.push('## Counts', '');
  lines.push('| Item | Count |', '|---|---:|');
  lines.push(`| Courses | ${result.inputs.courses} |`);
  lines.push(`| Required course placements (licensed track) | ${s.requirements} |`);
  lines.push(`| Required placements, non-licensed track | ${s.nonLicensedTrackRequirements} |`);
  lines.push(`| Unique required lessons | ${result.inputs.uniqueRequiredLessons} |`);
  lines.push(`| Assessment files | ${result.inputs.assessmentFiles} |`);
  lines.push(`| Placements covered | ${s.requirementsCovered} |`);
  lines.push(`| Placements uncovered | ${s.requirementsUncovered} |`);
  lines.push(`| Courses complete (no uncovered placement) | ${s.coursesComplete} of ${result.inputs.courses} |`);
  lines.push(`| Courses publishable | ${s.coursesPublishable} |`, '');
  lines.push('Uncovered placements by reason: ' + Object.entries(s.uncoveredByReason).map(([k, v]) => `${k} ${v}`).join(', ') + '.', '');
  lines.push('## Lesson assessment states', '', '| State | Lessons |', '|---|---:|');
  for (const state of ['missing', 'invalid', 'mismatch', 'draft', 'reconciled', 'reviewed', 'publishable']) lines.push(`| ${state} | ${stateCounts[state] ?? 0} |`);
  lines.push('', 'No assessment is marked reviewed or publishable: no file sets reviewStatus to REVIEWED or APPROVED.', '');
  lines.push('Finding codes across the required lessons (a lesson can carry more than one):', '');
  for (const [kind, label] of [['hard', 'hard checks'], ['review', 'review flags'], ['reconcile', 'reconciliation']]) {
    const entries = Object.entries(s.findingCounts[kind]).sort();
    lines.push(`- ${label}: ${entries.length ? entries.map(([k, v]) => `${k} ${v}`).join(', ') : 'none'}.`);
  }
  lines.push('');
  lines.push('## Data checks', '');
  lines.push(`- Duplicate course placements: ${s.duplicatePlacements}.`);
  lines.push(`- Level CSV and course-level-map.json disagree for ${s.courseMapMismatches} course(s).`);
  lines.push(`- Assessment files not used by any placement: ${s.orphanAssessmentFiles}.`, '');
  lines.push('## Limits of this audit', '');
  lines.push('- Presence and shape only for pass rules: a non-empty `passRule` is required, its thresholds are not parsed.');
  lines.push('- Answer keys are checked for integer index and duplicate IDs. Index-to-option correctness is checked only by the reconciliation step, which covers lessons with a converted source.');
  lines.push('- `curriculum/assessment-question-reconciliation-pass41.json` covers 511 files and is out of date. This audit reads the current files directly.');
  lines.push('- Publication behaviour is unchanged. The publication gate is a separate control and is not tested here.', '');
  lines.push('## Courses', '', '| Course | Placements | Uncovered | Complete |', '|---|---:|---:|:---:|');
  for (const c of courses) lines.push(`| ${c.courseSlug} | ${c.requiredLessons} | ${c.uncoveredCount} | ${c.complete ? 'yes' : 'no'} |`);
  lines.push('', '## Uncovered required items', '', 'Each line is one course placement that has no usable assessment or lacks evidence types. A reviewer signs off each one.', '');
  for (const c of courses.filter((x) => x.uncoveredCount)) {
    lines.push(`### ${c.courseSlug} (${c.uncoveredCount})`, '');
    for (const u of c.uncovered) lines.push(`- ${u.lessonId}: ${u.reason}`);
    lines.push('');
  }
  fs.mkdirSync(path.dirname(markdownOut), { recursive: true });
  fs.writeFileSync(markdownOut, lines.join('\n') + '\n');
}

console.log(JSON.stringify({ inputs: result.inputs, summary: result.summary }, null, 2));
