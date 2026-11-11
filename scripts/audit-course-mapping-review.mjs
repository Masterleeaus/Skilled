#!/usr/bin/env node
/**
 * #20: validate course-placement review evidence without changing curriculum.
 * This report is deliberately not an import, approval, or publishing mechanism.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const reviewDirectory = path.join(root, 'curriculum/reviews/course-mapping');
const reportArgument = process.argv.indexOf('--report');
if (reportArgument >= 0 && !process.argv[reportArgument + 1]) {
  console.error('--report requires a destination');
  process.exit(2);
}
export const expectedIds = Array.from({ length: 16 }, (_, index) => 'SFS-' + String(index + 1).padStart(2, '0'));
export function gitBlobSha(bytes) {
  return crypto.createHash('sha1').update('blob ' + bytes.length + '\0').update(bytes).digest('hex');
}
export function verifyRecord(record, sourceBytes, expectedId) {
  const errors = [];
  let source = null;
  try { source = JSON.parse(sourceBytes.toString('utf8')); }
  catch { errors.push('source_json_invalid'); return errors; }
  if (record.schemaVersion !== 1) errors.push('unsupported_review_schema');
  if (record.lessonId !== expectedId || source.id !== expectedId) errors.push('lesson_identity_mismatch');
  if (record.sourceFile !== 'curriculum/shared/app/' + expectedId + '.json') errors.push('source_path_mismatch');
  if (record.sourceBlobSha !== gitBlobSha(sourceBytes)) errors.push('source_changed_review_required');
  const observed = [
    ['sourceTitle', 'title'],
    ['observedModuleTitle', 'moduleTitle'],
    ['observedStatus', 'status'],
    ['observedLayer', 'layer'],
    ['observedLessonType', 'lessonType'],
    ['observedAudience', 'audience'],
  ];
  for (const [recordField, sourceField] of observed) {
    if (record[recordField] !== source[sourceField]) errors.push('evidence_drift_' + recordField);
  }
  if (!Array.isArray(record.observedPrerequisites) || JSON.stringify(record.observedPrerequisites) !== JSON.stringify(source.prerequisites ?? [])) errors.push('prerequisites_changed');
  if (JSON.stringify(record.observedCourseSlugs) !== JSON.stringify(source.courseSlugs)) errors.push('course_slugs_changed');
  if (JSON.stringify(record.observedLearningOutcomes) !== JSON.stringify(source.learningOutcomes)) errors.push('learning_outcomes_changed');
  if (record.observedInstructionSectionCount !== source.instruction?.length) errors.push('instruction_count_changed');
  if (record.observedSourceReferenceCount !== source.sourceReferences?.length) errors.push('source_reference_count_changed');
  if (!Array.isArray(source.courseSlugs)) errors.push('invalid_source_course_slugs');
  if (record.issue !== 'course mapping requires review') errors.push('unrecognized_issue');
  if (record.publicationApproved !== false) errors.push('review_cannot_publish');
  if (!['unresolved', 'approved', 'excluded'].includes(record.decision)) errors.push('unknown_decision');
  if (record.decision === 'unresolved') {
    if (record.reviewer !== null || record.reviewedAt !== null || record.rationale !== null) errors.push('unresolved_record_has_decision_metadata');
    if (!Array.isArray(record.proposedCourseSlugs) || record.proposedCourseSlugs.length) errors.push('unresolved_record_has_placement');
  } else {
    if (typeof record.reviewer !== 'string' || record.reviewer.trim().length < 3) errors.push('missing_reviewer');
    if (!Number.isFinite(Date.parse(record.reviewedAt)) || Date.parse(record.reviewedAt) > Date.now()) errors.push('invalid_review_date');
    if (typeof record.rationale !== 'string' || record.rationale.trim().length < 20) errors.push('missing_review_rationale');
    if (!Array.isArray(record.proposedCourseSlugs)) errors.push('invalid_proposed_courses');
    if (record.decision === 'approved' && record.proposedCourseSlugs.length === 0) errors.push('approved_without_course');
    if (record.decision === 'approved' && record.proposedCourseSlugs.some(slug => typeof slug !== 'string' || slug.length < 2 || slug !== slug.trim())) errors.push('invalid_course_slug');
    if (record.decision === 'excluded' && record.proposedCourseSlugs.length !== 0) errors.push('excluded_but_placed');
    // This report cannot approve a curriculum placement into the publisher.
  }
  return [...new Set(errors)];
}
export function audit(base = root) {
  const directory = path.join(base, 'curriculum/reviews/course-mapping');
  const files = fs.existsSync(directory) ? fs.readdirSync(directory).filter(x => x.endsWith('.json')).sort() : [];
  const expected = new Set(expectedIds.map(id => id + '.json'));
  const records = [];
  for (const unexpected of files.filter(filename => !expected.has(filename))) {
    records.push({ filename: unexpected, status: 'invalid', errors: ['unexpected_review_record'] });
  }
  for (const id of expectedIds) {
    const filename = id + '.json';
    const recordFile = path.join(directory, filename);
    if (!fs.existsSync(recordFile)) {
      records.push({ lessonId: id, filename, status: 'invalid', errors: ['missing_review_record'] });
      continue;
    }
    try {
      const record = JSON.parse(fs.readFileSync(recordFile, 'utf8'));
      const sourceFile = path.join(base, 'curriculum/shared/app', filename);
      const sourceBytes = fs.readFileSync(sourceFile);
      const errors = verifyRecord(record, sourceBytes, id);
      records.push({ lessonId: id, filename, status: errors.length ? 'invalid' : record.decision, errors });
    } catch (error) {
      records.push({ lessonId: id, filename, status: 'invalid', errors: ['unreadable_record_or_source: ' + error.message] });
    }
  }
  return {
    schemaVersion: 1,
    policy: 'Read-only review evidence, never lesson approval, placement import, or publication',
    expected: expectedIds.length,
    checked: records.length,
    unresolved: records.filter(x => x.status === 'unresolved').length,
    approvedForProposal: records.filter(x => x.status === 'approved').length,
    excludedByReviewer: records.filter(x => x.status === 'excluded').length,
    invalid: records.filter(x => x.status === 'invalid').length,
    records,
  };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = audit();
  if (reportArgument >= 0) {
    const destination = path.resolve(process.argv[reportArgument + 1]);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, JSON.stringify(result, null, 2) + '\n');
  }
  console.log(JSON.stringify({ expected: result.expected, checked: result.checked, unresolved: result.unresolved, approvedForProposal: result.approvedForProposal, excludedByReviewer: result.excludedByReviewer, invalid: result.invalid }));
  if (result.invalid) process.exitCode = 1;
  if (process.argv.includes('--fail-on-unresolved') && result.unresolved) process.exitCode = 1;
}
