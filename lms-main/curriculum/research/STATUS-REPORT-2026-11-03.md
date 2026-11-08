# Status report: checkers, counts, checklist and tests (2026-11-03)

Read-only pass. No lesson, licence or code file was edited and nothing was committed. The repo at `/home/claude/p29m/lms-main` is not a git repository, so there is no commit state to report. The only file written in the repo is this report. The two checker scripts also refreshed their JSON outputs outside the repo (see "Side effects" below).

## Summary

| Area | Result | Status |
|---|---|---|
| Lesson quality checker (`/home/claude/work/check.py`) | 932 lessons scanned. 6 problems in 2 lessons (NEW-DEK-01, PVB-02). All 6 are check 4 (citation markers such as R3/R4 in learner text). Checks 1, 2, 3 and 5: 0 problems. | 2 lessons need fixing |
| Official references checker (`/home/claude/work/check_official_refs.py`) | 1,433 entries, 0 errors, 0 duplicate ids, 0 unresolved citations. 1 unresolved bare token, 1 lesson citing regulation with no reference entry, 50 null URLs. | Open items |
| Null `officialReferences` URLs | 50 entries with `url: null`, across 32 lessons | Open |
| Lessons citing regulation with no reference entry | 1 (F11-L01) | Open |
| Learner-visible UNCONFIRMED markers (current scan) | 0 in courses and shared. Old inventory had 227. | Clear by checker definition (see decisions) |
| Licence register (`curriculum/licence/lesson-licence.json`) | 445 entries: 41 required, 50 threshold, 354 not_checked | Consistent with `curriculum/licence/review-required.md` |
| Lesson/curriculum JSON parse failures | 0 of 2,616 JSON files under `curriculum/` | Clear |
| Business placeholders not on the approved list | 0 (2,813 placeholder occurrences checked) | Clear |
| FINISH-CHECKLIST items | 11 ticked, 37 unticked (48 total) | In progress |
| Backend unit tests (no database) | 385 passed, 0 failed, 75 skipped (7 database or Redis-gated files) | Pass |
| Backend plain-node test `tests/pass22-inactive-identity.test.cjs` | 11 source checks passed | Pass |
| Frontend typecheck (`tsc --noEmit`) | 0 errors, exit 0 | Pass |

## 1. Lesson quality checker

Command: `python3 -I /home/claude/work/check.py`. Scope: `curriculum/courses/**` and `curriculum/shared/**`, 932 lessons. 20 template lessons are exempt from check 5.

| Check | Lessons checked | Failing lessons | Problems |
|---|---:|---:|---:|
| 1 status and reviewStatus | 932 | 0 | 0 |
| 2 no correctIndex in learner file | 932 | 0 | 0 |
| 3 approved business placeholders | 932 | 0 | 0 |
| 4 no internal codes in learner text | 932 | 2 | 6 |
| 5 no empty required sections | 912 | 0 | 0 |

Main category: check 4 only, citation markers in learner-visible text.
- NEW-DEK-01 (`courses/deck-and-fence-maintenance/NEW-DEK-01.json`), path `/instruction[2]/body`: 1 citation marker.
- PVB-02 (`shared/pool/PVB-02.json`), 5 problem paths (`/instruction[0]` to `[3]` and `/safetyAndRegulatory[1]/point`): 9 citation markers in total.
- Together that is 10 citation-marker occurrences in 6 problem records.

## 2. Official references checker

Command: `python3 -I /home/claude/work/check_official_refs.py`. Scope: `courses/**` and `shared/**`, excluding `SHARED-REFERENCES.json`.

- Lessons scanned 932. Lessons with references 449. Lessons without references 483.
- Entries 1,433. All have the required fields in the schema. 0 invalid `checked` dates, 0 future dates, 0 duplicate ids, 0 errors.
- Null URLs: 50 entries across 32 lessons. The checker reports these as "missing url" (alias-aware). The raw data shows `url: null`, and no entry lacks the key.
- Bare citations only: 10. Unresolved bare tokens: 1 (NEW-DEK-01, body, token `R5`).
- Lessons citing regulation without a reference entry: 1 (F11-L01, `shared/starting-business/F11-L01.json`, matched on the term "SafeWork"). The checker matched on the keyword only. I did not judge whether it is a true regulation citation.

## 3. Learner-visible UNCONFIRMED markers

Count from the current scan, using the checker's learner-visible definition (all lesson text except `officialReferences` and `sourceReferences`):
- Courses and shared: 0.

For context, these are the raw UNCONFIRMED strings in all lesson JSON, by location:

| Location | Strings |
|---|---:|
| `shared` `sourceReferences` | 935 |
| `courses` `sourceReferences` | 640 |
| `shared` `officialReferences` | 63 |
| `courses` `officialReferences` | 22 |
| `lessons/` `knowledgeChecks` (outside checker scope) | 41 |
| Total | 1,701 |

The old inventory (`curriculum/research/UNCONFIRMED-INVENTORY.md`) reports 227 learner-visible markers (1,915 total). I did not reconcile the difference. Checklist item 5 says most licence positions are still UNCONFIRMED in the lessons, which the current scan does not show.

## 4. Licence register

`curriculum/licence/lesson-licence.json` (generated 2026-11-03), 445 entries:
- required: 41
- threshold: 50
- not_checked: 354

These match the totals in `curriculum/licence/review-required.md` ("required 41, threshold 50, not_checked 354").

## 5. JSON parsing and placeholders

- JSON files under `curriculum/`: 2,616. Parse failures: 0.
- Business placeholders across all lesson JSON (`courses`, `shared`, `lessons`): 2,813 occurrences. Not on `curriculum/business-lesson-fields.json`: 0. The approved list has 13 groups.

## 6. FINISH-CHECKLIST status

File: `curriculum/research/FINISH-CHECKLIST.md`. Ticked 11, unticked 37.

Ticked: lines 44, 50 (sections 6 and 7), and items A, B, C, F, I, K, L, M, O (section 8 and 9).

Unticked, by section:

**1. Get lessons live (blocking), 4**
- Confirm how lessons are published into the database (owner).
- Confirm the production server has `curriculum/` or set `CURRICULUM_DIR` (owner).
- After publishing, run load-knowledge-answer-keys (409 risk).
- Rebuild the import manifest after the latest edits.

**2. Server and infrastructure, 6**
- Paste the PostgreSQL 16 setup output and install Redis and Node 22 (owner).
- Deploy and confirm the lesson endpoint returns text only to enrolled, paying learners.
- Provide the test database password (owner).
- Check the eight backend test files that fail to load (see note in section 7 below).
- Browser-check the lesson page, outline and images on the live site.
- Remove or keep hidden the gallery section on the course page.

**3. Access decisions, 2**
- Enrolment: "ACTIVE only" or also "COMPLETED" (owner).
- Outline still sends each lesson's database copy: remove or accept (owner).

**4. Images, 4**
- Make the 28 remaining images (3 logo roundels, 25 icons across 13 courses) (owner).
- Slice and add each new sheet to the library, then update the catalogue.
- Clean up the timber icon set.
- Check five uncertain sheet mappings visually.

**5. Content review, 8**
- Review every lesson (all DRAFT and NOT REVIEWED).
- Check licence positions (UNCONFIRMED state-level rules).
- Check official references (summaries, not verbatim text).
- Verify gas emergency numbers for NSW and Queensland.
- Review the proposed painting and business model pass rules.
- Check the business model canvas replacement (SHR-PLN-03) and sources.
- Check roof lessons' licence and solar points.
- Check the car-detailing L09 timestamp.

**6. Car detailing decisions still open, 3**
- Paint correction: keep or drop (owner).
- Heat-assisted conditioning and heat lamps: excluded until a risk assessment exists (owner).
- Headlight restoration appears only in the Spanish manual and has no lesson.

**7. Smaller clean-up, 4**
- Remove or mark the stale `converted/` and `ready/` drafts.
- Confirm estimated minutes raised across many lessons.
- Check lessons that list two courses, where images came only from the first.
- Decide whether procurement lessons appear in all 43 courses.

**8. Parallel agent tasks, 2**
- D. Every officialReferences entry has id, title, url, pageDate and checked, and every citation id resolves.
- E. Every lesson is DRAFT and NOT REVIEWED, has no correctIndex, uses approved business fields, and has no internal codes in learner text.

**9. Second parallel team, 4**
- G. Re-run the full backend test suite and record every remaining failure.
- H. Dry-run the publish planner (database count pending).
- J. Verify every library file in the catalogue exists, and image paths match.
- N. Check licence and regulator claims for conflicts and list them. Open: no conflict report was found in the repository.

Checklist items that conflict with the current data (not edited):
- Item D says all 60 files with `officialReferences` have the five fields on every entry. The current scan finds 50 entries with null URLs across 32 lessons, and 449 lessons with references. Item D should stay open.
- Item E: the checks it lists are now 2 lessons failing (check 4). It stays open until NEW-DEK-01 and PVB-02 are fixed.
- Item 5 wording on UNCONFIRMED (see section 3 above).
- A file named `licence-conflicts-report.json` exists in `/home/claude/work/` (outside the repo). I did not read it. Item N may be closable if it covers the same scope.

## 7. Tests and typecheck

Backend, run from `apps/backend` with `DATABASE_URL` and `REDIS_URL` unset (`npx vitest run`):
- Test files: 28. Passed: 21. Skipped: 7. Failed: 0.
- Tests: 385 passed, 75 skipped.
- Skipped files: `auth.test.ts` (10), `health.test.ts` (1), `integration/contract.test.ts` (21), `integration/credential-lifecycle.test.ts` (10), `integration/cross-tenant.test.ts` (13), `integration/identity-linking.test.ts` (14), `integration/learner-status.test.ts` (6). Their skipping is consistent with the placeholder database and Redis settings in `src/tests/support/test-env.ts` and `src/tests/integration/harness.ts`.
- No test file failed to load in this run. Checklist item C names eight files that did fail to load earlier. That is not reproduced now.
- `tests/pass22-inactive-identity.test.cjs` (plain node, source checks): 11 passed.

Frontend (`apps/frontend`, `npx tsc --noEmit` with `tsconfig.json`): exit 0, 0 errors. The frontend has no typecheck script, so this is the closest equivalent.

## Decisions made in this pass

1. Learner-visible UNCONFIRMED: I used the checker's own definition (excludes `officialReferences` and `sourceReferences`). Result 0. If the 85 UNCONFIRMED strings inside `officialReferences` are shown to learners, the figure would be 85. Owner to confirm.
2. Lesson scope: courses and shared (932), as in the checker. `lessons/converted` and `lessons/ready` are outside it. The 41 UNCONFIRMED strings in `lessons/knowledgeChecks` are noted, not counted.
3. Parse failures: counted across all curriculum JSON (2,616), wider than the checker's scope.
4. Backend tests: ran the full suite with database variables unset, rather than hand-picking files. DB-gated files skipped themselves. Also ran the `.cjs` file because vitest does not pick it up.
5. Frontend typecheck: no script exists, so I used `npx tsc --noEmit`.
6. F11-L01 is counted as a regulation citation with no reference entry because the checker matched "SafeWork". I did not judge whether that is a true regulation.
7. Check-4 problem count is the checker's 6 problem records, with 10 citation-marker occurrences.

## Side effects

- `/home/claude/work/lesson-quality-check.json` and `/home/claude/work/official-refs-check.json` were overwritten by the two checkers. Both are normal outputs of those scripts.
- Scratch files were written to `/tmp/status/` (outside the repo).
- No repo file other than this report was written by me.
