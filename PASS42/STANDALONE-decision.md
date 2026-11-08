# STANDALONE decision: "High-risk cleaning (standalone module)" rows

Status: decision NOT applied. The map, levels and lesson files are unchanged.

## Why the decision was not applied

The recorded default assumed each standalone lesson's own lesson file lists a real course in `courseSlugs`. That is false for all 84 lessons.

- The 84 rows are the 12 sub-lessons of each of the seven high-risk courses: `biohazard-trauma-cleaning`, `crime-scene-cleaning`, `drug-contamination-remediation`, `mould-remediation`, `fire-smoke-restoration`, `flood-water-restoration`, `hoarding-squalor` (L01 to L12 each).
- Their lesson files, `curriculum/courses/high-risk/HR01` to `HR07`, all have `"courseSlugs": []`. Each sub-lesson's `sourceLessonId` is listed inside those files.
- `curriculum/structure/COURSES-MODULES.json` stores them under `highRiskModule` (module "High-risk cleaning", status "TITLE ONLY (needs writing or editing)"), not inside any of the 43 courses.
- No level file (`curriculum/levels/*.csv`) references these lessons.

Removing the rows would leave 84 lessons in no course. The add rule cannot apply, because there is no course the lesson files list to add them under.

## Counts

| Measure | Before | After (if applied) |
|---|---|---|
| Map rows | 5,556 | 5,472 |
| Standalone rows | 84 | 0 |
| Standalone rows already mapped to a real course | 0 | n/a |
| Standalone rows not mapped to a real course | 84 | n/a |
| Map pairs (non-standalone) equal to lesson-file pairs | 5,472 of 5,472 | 5,472 of 5,472 |
| Lesson-file (course, lesson) pairs | 5,472 | 5,472 |
| Map-only pairs | 0 | 0 |
| File-only pairs | 0 | 0 |
| Level rows changed | 0 | 0 |

Checks behind the counts: the map's non-standalone rows and the lesson-file pairs (resolved through `COURSES-MODULES.json` course titles) match exactly, with no duplicate map pairs. The 36 lesson files without `courseSlugs` include the seven HR files.

## Options for the owner

1. Remove the 84 rows, as the default said. The map then equals the lesson-file pairs exactly, and the 84 title-only lessons appear in no course. Their `highRiskModule` entry remains in `COURSES-MODULES.json`.
2. Keep the 84 rows as a standalone module. Update the decision and record a documented exception, since the map then differs from the lesson-file pairs by 84 pairs.
3. Assign the seven high-risk courses to courses by editing `courseSlugs` in the HR files. This needs a human decision on the course and the layer. It was out of scope here (lesson files are not to be edited).

## CI result

- `npm run curriculum:ci` (root `package.json`, script `scripts/ci-curriculum-audit.mjs`) on the unchanged state: PASS. 216 drafts; audit codes MISSING_OUTCOMES 16, MISSING_LEARNER 119, LEARNER_ID_MISMATCH 119, LEARNER_TITLE_MISMATCH 119; blockers "no explicit learning outcomes" 21, "course mapping requires review" 42, "no usable instructional sections" 15. Assessment gate 0 approved of 894 blocked. Four self-tests passed.
- Log: `/home/claude/work/standalone-ci-before.log`. The run also wrote `build/curriculum-ci-report.json` in the repo root, as the script's `--report` option does.

## Backup

`/home/claude/work/standalone-backup/`: `COURSE-MODULE-LESSON-MAP.csv` (sha256 435b0acf...7354, matches the live file), `COURSES-MODULES.json`, and `levels/` (43 level CSVs).

## Changed rows

None. No pairs added.
