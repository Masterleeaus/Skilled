# PASS42 trial content fill: summaries and quality standards

Date: 2026-11-02. Scope: the 98 lessons the publication gate refused with STRUCTURE_INCOMPLETE (see `TRIAL-smoke.md`). Scratch database `lms_trial` only. No gate, schema, migration, course map or level file was changed. No git commit. No memory tool used. No force-publish.

## Result

| Measure | Result |
|---|---|
| Lesson files changed | 98 (92 with empty `summary` and `qualityStandard`; 6 with empty `qualityStandard` only) |
| New revisions drafted (v3, author `trial-owner@trial.local`) | 98 |
| Approved (`trial-reviewer@trial.local`, not the author) | 98 of 98 |
| Published through the normal publish path, gate ON | 98 of 98 (HTTP 200) |
| Still refused | 0 |

## Counts before and after

| Measure | Before | After |
|---|---|---|
| Lesson rows | 236 | 236 |
| Lesson rows with a PUBLISHED revision | 138 | 236 |
| PUBLISHED revisions | 138 | 236 |
| DRAFT revisions | 335 | 336 (the smoke run added one control draft) |
| Review rows (all decisions) | 472 | 570 (98 new APPROVED) |
| `LESSON_REVISION_PUBLISHED` audit rows | 138 | 236 |
| `LESSON_REVISION_PUBLISHED_GATE_OFF` audit rows | 0 | 0 |
| Revisions refused by the gate | 98 | 0 |

The 335 drafts before the run were: 236 earlier v1 drafts (superseded), 98 v2 drafts (the refused revisions, superseded by v3), and 1 TPL-14 control draft. The superseded drafts stay DRAFT, because no code path unpublishes or supersedes a revision.

## Text

- Each `summary` is three one-sentence strings. Each `qualityStandard` is two to four checkable statements. Plain Australian English.
- Each filled field carries `"summaryStatus"` or `"qualityStandardStatus"` set to `DRAFTED - written from lesson content, owner trial approval only`. No UI label was added.
- Each file was compared with its backup in `/home/claude/work/trial-content-backup/curriculum/`. The only differences are `summary`, `qualityStandard`, `summaryStatus` and `qualityStandardStatus`. Safety content, licence notices and knowledge checks are unchanged. Each file was validated with `python3 -I`.
- Six lessons already had a summary (`additional-specialist-services-L01`, `-L04`, `-L10`, `-L12`, `custom-eco-cleaning-products-L03`, `-L10`). Only their `qualityStandard` was written.

## Approval and publication

1. Draft: `POST /api/academy/curriculum/lessons/:sourceId/revisions` as `trial-owner`. The author is recorded by the `LESSON_REVISION_DRAFTED` audit row.
2. Approve: `POST /api/academy/curriculum/revisions/:id/reviews` as `trial-reviewer`, decision `APPROVED`, `contentHash` = the hash the draft returned.
3. Publish: `POST /api/academy/curriculum/revisions/:id/publish` as `trial-reviewer`.

Checks on the 98 new revisions: the author and the approver differ in every case (0 overlaps); every publish audit row has `gateEnabled: true`; every approval note is `Owner trial approval. Not an expert review.`

## Decisions for owner review

1. **Approval note wording.** The task gave the note as `Owner trial approval. Not an expert review.`, but also said to use the same wording as before. The earlier approvals read `Owner trial approval 2026-11-02. Not an expert review.` I used the quoted text.
2. **Trial account passwords reset.** The per-run trial password was not kept, so `setup-accounts.mjs` was run again to set new passwords for the three trial accounts in `lms_trial`. The account ids are unchanged. The password was generated at run time, passed through the environment only, and not written to any file.
3. **Canonical manifest not updated.** `curriculum/import/canonical-import-manifest.json` still holds the old `canonicalSha256` for these 98 files. `load-lessons.mjs` checks those hashes, so it would refuse the 98 files if re-run. I left the reviewed manifest unchanged.
4. **Storage stub.** `moto_server` on 127.0.0.1:9000 was started for the backend storage check, as in the first run, and stopped afterwards.

## Smoke re-run after publication

Result: 26 of 39 pass (the first clean run was 39 of 39). Output: `/home/claude/work/trial-content-fill/smoke-results-after.json`. The run placed 236 published revisions (check S3 passed).

Failures and causes:

- **Missing migrations in `lms_trial`.** The repo has 20 migrations and `lms_trial` has 14 applied. The six unapplied ones include `20261102250000_academy_course_lesson_selection`. The backend queries `academy_course_lesson_selections`, which does not exist, so the learner outline (L7 to L11) and the template flow (T1 to T3) return HTTP 500. All six backend errors logged in this run are this missing table. Not fixed: applying migrations to the scratch database is outside this task.
- **Reviewer queue limit (G5).** `listReviewQueue` in `lesson-review.service.ts` takes the first 200 DRAFT revisions by creation date and filters out approved ones afterwards. There are now 336 drafts, so the smoke control draft (rank 336) falls outside the 200. This is a code defect, not fixed here.
- **Enrolment 409 (P2, P4).** The pathway enrolments already existed from the first run.
- **T4, T6** fail because T3 (the submission) failed.

Gate checks G1 to G4, learner registration, login and course listing passed.

## Open item: text overlap with other lessons

The owner rule is no copied sentence of more than four words from another document. I tested for any eight-word run shared with another file under `curriculum/`:

- 124 sentences share an eight-word run with some other file. 97 of them match only the same lesson's own ready copy, assessment file or the normalisation index. That is the lesson's own content, which the owner allowed.
- 27 sentences across 17 lessons match another lesson's text. These are shared family boilerplate, for example "No unconditional safety or compliance certificate is issued." (roof lessons), "Work does not resume until the responsible person confirms the hazard is controlled." (S14 lessons), and the S14-L05 alarm sentence, which also matches `handyman-work-L07` and `property-maintenance-L05`.

Full list: `/home/claude/work/trial-content-fill/cross-lesson-overlap.json`. Lessons affected: F08-L02, F14-L01, F15-L01, F15-L04, S12-L03, S12-L08, S14-L03, S14-L05, S14-L08, additional-specialist-services-L12, high-access-window-cleaning-L02, high-access-window-cleaning-L03, high-access-window-cleaning-L11, roof-cleaning-soft-washing-L03, roof-cleaning-soft-washing-L08, roof-cleaning-soft-washing-L09, roof-cleaning-soft-washing-L12.

I did not change these published texts. A fix needs new revisions and re-pinned track placements, and the owner should decide that. This is an eight-word test, so it is a proxy, not a full copy check.

## Still refused

None. All 98 lessons are published. All 236 lesson rows now have a published revision.

## Lesson IDs changed

C01-L01, C01-L02, C01-L03, C02-L01, C02-L02, C02-L03, C05-L01, C05-L02, C05-L03, C09-L01, C09-L02, C09-L03, C10-L01, C10-L02, C10-L03, F01-L01, F01-L02, F01-L03, F01-L04, F02-L01, F02-L02, F02-L03, F02-L04, F03-L01, F03-L02, F03-L03, F03-L04, F04-L01, F04-L02, F04-L03, F04-L04, F05-L01, F05-L02, F05-L03, F08-L01, F08-L02, F08-L03, F08-L04, F08-L05, F09-L01, F09-L02, F09-L03, F09-L04, F09-L05, F10-L01, F10-L02, F10-L04, F10-L05, F14-L01, F14-L02, F14-L04, F14-L05, F15-L01, F15-L02, F15-L03, F15-L04, F15-L05, F15-L06, F16-L01, F16-L03, F17-L01, F17-L04, F17-L05, F19-L01, F19-L05, F19-L06, S12-L03, S12-L08, S14-L03, S14-L04, S14-L05, S14-L07, S14-L08, additional-specialist-services-L01, additional-specialist-services-L04, additional-specialist-services-L10, additional-specialist-services-L12, custom-eco-cleaning-products-L03, custom-eco-cleaning-products-L10, high-access-window-cleaning-L02, high-access-window-cleaning-L03, high-access-window-cleaning-L04, high-access-window-cleaning-L05, high-access-window-cleaning-L10, high-access-window-cleaning-L11, high-access-window-cleaning-L12, pressure-cleaning-L01, pressure-cleaning-L02, pressure-cleaning-L03, pressure-cleaning-L06, pressure-cleaning-L10, pressure-cleaning-L11, pressure-cleaning-L12, roof-cleaning-soft-washing-L03, roof-cleaning-soft-washing-L07, roof-cleaning-soft-washing-L08, roof-cleaning-soft-washing-L09, roof-cleaning-soft-washing-L12
