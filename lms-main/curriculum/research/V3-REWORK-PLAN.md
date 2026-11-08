# V3.0 rework plan: split $2,000-removed courses, licence statuses, publication stages

Status: planning only. No lesson, structure, licence, approval, answer-key or code file was edited. Nothing was committed or pushed. No checklist item was ticked.

Scope item (FINISH-CHECKLIST.md, section 9 and the last open item in the governance list): "Rework to V3.0: split courses that the $2,000 rule removed instead of dropping them; replace binary passed/held with the five licence statuses and the seven publication stages."

## 0. Findings that change the scope

1. **The $2,000 rule is dropped under V3.0.** The owner decision of 2026-11-04 in `curriculum/research/OWNER-DECISIONS.md` (the V3.0 conflict entry, item (b)) reads: "The $2,000 individual-Skill removal rule is dropped." Licensed specialist content is split instead into general knowledge, permitted activities and regulated specialist Skills. Essential safety or mandatory prerequisite content is never removed to meet a budget.
2. **The $2,000 rule was applied to lessons, not courses.** The 2026-11-04 entries say "A lesson whose total licence and check cost is $2,000 or more is removed; a course stays if it still functions." No record in the repo lists any course removed by the rule.
3. **The only recorded removals were restored.** The owner ordered five lessons returned to their courses (OWNER-DECISIONS.md, "$2,000-removed lessons"). The result entry says all five were already in their courses as DRAFT and NOT REVIEWED, so nothing was restored or duplicated.
4. **The source of the course verdicts is missing from the repo.** `apps/backend/src/modules/curriculum/unverified-courses-hold-list.ts` cites `/home/claude/work/cost-rule/passed.json` (43 entries, 31 UNCLEAR). That directory does not exist in this environment, so the 43 and 31 counts cannot be re-checked here.
5. **Course slugs do not match between folders and structure.** `curriculum/structure/COURSES-MODULES.json` uses `portfolio` and `deck`. The folders and the hold list use `real-estate-portfolio-management` and `deck-and-fence-maintenance`. Item H of the checklist already records 23 folder names that do not match slugs.

## 1. Courses affected by the $2,000 rule

Only two course folders hold the lessons the rule touched. Costs for these lessons are not recorded in the repo, so the rule cannot be re-run from the repo.

| Current course (folder) | Structure slug | Affected lesson | Licence status (lesson-licence.json) | Notes |
|---|---|---|---|---|
| real-estate-portfolio-management | portfolio | C19-L01 Portfolio intake | required | Owner kept "required" |
| real-estate-portfolio-management | portfolio | C19-L02 Condition evidence | not_checked | Owner counts all states for C19 costs |
| real-estate-portfolio-management | portfolio | C19-L03 Vacate and tenancy scope | required | Owner kept "required" |
| real-estate-portfolio-management | portfolio | NEW-REP-04 Leasing and tenancy boundaries | required | Victorian property position noted as not confirmed |
| deck-and-fence-maintenance | deck | NEW-DEK-03 Footings, post setting and levels | threshold | Total $1,942.29 on lowest fees; owner kept it, so it is below the $2,000 line |

### 1a. real-estate-portfolio-management (proposed split)

The parent course keeps the lessons the rule did not touch: C19-L05, C19-L06, NEW-REP-01, NEW-REP-02 and NEW-REP-03. The four affected lessons move as follows.

| Proposed course slug | Type under V3.0 | Lessons that move | Reason |
|---|---|---|---|
| portfolio-condition-evidence | General knowledge | C19-L02 | Licence status not_checked, so it can stay in both tracks |
| portfolio-intake-and-scope | Regulated specialist Skill | C19-L01 | Licence status required |
| portfolio-tenancy-and-leasing | Regulated specialist Skill | C19-L03, NEW-REP-04 | Both required; same subject (tenancy and leasing scope) |

The split of each lesson's text into general knowledge, permitted activities and regulated content is a later edit. It needs writing, not moving, and is not part of this plan.

### 1b. deck-and-fence-maintenance (proposed split)

No split is proposed. NEW-DEK-03 stays in `deck-and-fence-maintenance` because the owner kept it under the $2,000 line.

Optional, only if the owner wants licence-limited lessons separated: move NEW-DEK-03 to `deck-footings-and-levels` (Regulated specialist Skill, threshold status).

### 1c. Possible container for regulated content

`curriculum/courses/high-risk-licence-addon/` (seven DRAFT lessons, not yet in the course registry) was drafted under an owner decision for high-risk licence material. It could hold the regulated specialist Skills above, but the owner has not decided this.

## 2. Binary passed/held: where it is used and the proposed mapping

### 2a. Course-level hold (binary: held or passed)

| Location | What it does | Proposed mapping |
|---|---|---|
| apps/backend/src/modules/curriculum/unverified-courses-hold-list.ts | `UNVERIFIED_COURSES_HOLD_LIST`, 31 slugs | Each held course sits at publication stage "jurisdiction review" or earlier. Owner to choose the stage (decision 3). |
| apps/backend/src/modules/curriculum/curriculum-publisher.ts (about line 115 to 116) | `planPlacements()` skips listed courses and warns | Replace the boolean skip with a stage check. A course may place only at "approved and published". |

### 2b. Lesson-level held (publisher)

| Location | What it does | Proposed mapping |
|---|---|---|
| curriculum-publisher.ts (about lines 434 to 496) | Counts `held` lessons: no approval, hash mismatch, answer keys held | Not a course verdict. Map to "assessment review" or "approved and published", depending on which gate failed. |

### 2c. Licence status (four values in code, five wanted)

Current values, in `apps/backend/src/modules/curriculum/licence-track.ts` (lines 11 to 12, 32, 74 to 76, 144 to 145, 188 to 195): `required`, `threshold`, `not_required`, `not_checked`. An unknown value is treated as `required`. `not_checked` and no entry both stay in both tracks.

Counts in `curriculum/licence/lesson-licence.json` (447 entries): threshold 161, not_checked 152, not_required 94, required 40.

Proposed mapping to the V3.0 five values:

| Current value | Proposed V3.0 value | Condition |
|---|---|---|
| required | licence required | none |
| threshold | other conditions apply | the limit text stays on the lesson (decision 6) |
| not_required | no identified licence requirement | only where an official source was checked. Otherwise use "unclear or under review". V3.0 forbids turning "no source found" into "no licence required". |
| not_checked | unclear or under review | none |
| (none today) | source expired or rule changed | needs a trigger from the page date or from SOURCE-MONITORING.md (decision 8) |

The owner's 2026-11-04 answer asks for a fifth value, "under review", added to the four current values. V3.0 has its own five values, which include "unclear or under review" and "source expired or rule changed", and no "not_checked". These two lists conflict (decision 4).

Code and test locations that read the status: `apps/backend/src/modules/curriculum/curriculum.routes.ts` (lines 114, 155, 175, 194), `apps/backend/src/tutor/access/accessible-lessons.ts` (line 112), `apps/backend/src/tests/academy-licence-track.test.ts` (lines 53 and 246). The frontend has no licence-status reference (searched).

### 2d. Not the same concept: learner knowledge-check "passed"

These match "passed" but are learner quiz results, not course verdicts. They must not be mapped to licence or publication values (V3.0 item (f) keeps credentials separate):

- apps/backend/prisma/schema.prisma (model `AcademyKnowledgeAttempt`, `passed Boolean`)
- apps/backend/src/modules/curriculum/curriculum.routes.ts (line 266: passed at 0.8 or above)
- apps/backend/src/modules/levels/level-rules.ts and level.service.ts (gate on passed checks)
- apps/backend/src/modules/curriculum/completion-report.service.ts
- apps/backend/src/modules/certificates/certificate-eligibility.service.ts

### 2e. Lesson status fields (DRAFT, NOT REVIEWED)

`curriculum/SCHEMA.md` (lines 36 to 39 and 53) defines `status` as DRAFT or READY and `reviewStatus` as NOT REVIEWED. These are the nearest current fields to a publication stage. Every lesson is DRAFT (1,527 lesson objects checked on 2026-11-04).

## 3. The seven publication stages

Defined only in `curriculum/research/OWNER-DECISIONS.md` (V3.0 conflict entry, item (d)), and confirmed by the 2026-11-04 owner answer ("use the seven stage names in V3.0 as written, in their order, without new definitions"):

1. content draft
2. technical review
3. safety review
4. jurisdiction review
5. assessment review
6. approved and published
7. monitored

The repo has no definition of any stage. Definitions are for the owner to add later. No definition is proposed here.

Where each stage would be recorded (proposal, not built):

| Stage | Current closest state in repo | Proposed record |
|---|---|---|
| content draft | status DRAFT, reviewStatus NOT REVIEWED (lesson JSON) | `publicationStage` field on each lesson JSON |
| technical review | none | same field; review record in the approval records the publisher already reads (path in curriculum-publisher.ts) |
| safety review | none | same |
| jurisdiction review | none; licence-track status is the closest data | same; tied to licence status (section 2c) |
| assessment review | answer-key approvals in the publisher | same; answer keys stay in curriculum/assessments/ |
| approved and published | DB revision status PUBLISHED (curriculum.routes.ts line 114) | the publisher writes this stage only with an approval record; affordability passes never set it (V3.0 item (e)) |
| monitored | SOURCE-MONITORING.md (monthly review, report only) | a flag set by the monitoring process, not by a person |

Course-level stage for the 31 held courses: none set yet. Proposed to be "jurisdiction review" until the owner verifies each one (decision 3).

## 4. Decisions a human must make before any edit

1. **Do any courses still need a split?** The $2,000 rule is dropped under V3.0, and the repo lists no course it removed. Confirm either that no course split is needed (only the optional split in 1b), or send the list of courses to split.
2. **Provide the missing passed.json.** The 43 and 31 counts come from `/home/claude/work/cost-rule/passed.json`, which is not in this environment. Supply it, or accept the 31-slug list in the hold file as the record.
3. **Stage for held courses.** Choose the publication stage the 31 held courses sit at (proposed: "jurisdiction review").
4. **Five licence values.** Choose one set: the V3.0 five (no identified licence requirement, licence required, other conditions apply, unclear or under review, source expired or rule changed), or the owner's four current values plus "under review".
5. **Meaning of not_required.** Confirm that "no identified licence requirement" applies only where an official source was checked.
6. **Meaning of threshold.** Confirm that threshold maps to "other conditions apply".
7. **Unknown-value default.** Today an unknown status is treated as required (licence-track.ts). Confirm whether it should become "unclear or under review" instead.
8. **Trigger for "source expired or rule changed".** Choose the rule, such as a page-date age limit or a SOURCE-MONITORING.md result. None is in the repo.
9. **Where stages are stored.** Choose a lesson JSON field, a database column, the approval records, or a mix.
10. **Stage definitions.** The owner said definitions would come later. Confirm this is still the plan.
11. **$1,500 course-total rule.** OWNER-DECISIONS.md says it is "unchanged in principle, pending re-run", but V3.0 makes it an affordability filter only. Confirm it no longer blocks publication.
12. **Scope of the split.** Split only the four portfolio lessons, or all licensed specialist content (for example NEW-REP-01 and NEW-REP-03, both required)?
13. **Container for regulated Skills.** Use the high-risk-licence-addon course, or new course folders?
14. **Canonical course slug.** Use the structure slug (`portfolio`, `deck`) or the folder slug (`real-estate-portfolio-management`, `deck-and-fence-maintenance`)? Item H of the checklist is open on this.
15. **Cost basis for C19 lessons.** Send the licence and check cost totals for C19-L01, C19-L02, C19-L03 and NEW-REP-04. The repo does not record them, so the $2,000 test cannot be repeated.

## 5. Counts

- Courses removed by the $2,000 rule that the repo records: 0. Affected course folders: 2 (real-estate-portfolio-management, deck-and-fence-maintenance). Affected lessons: 5, of which 4 move under the proposal.
- Course slugs in COURSES-MODULES.json: 43. Held slugs: 31 (repo list; source file missing).
- Code locations for the binary hold and licence status: 7 files (hold list, publisher, licence-track, curriculum.routes, accessible-lessons, academy-licence-track test, curriculum-publisher test). Learner "passed" locations, not to be mapped: 6 files (curriculum.routes.ts is in both groups).
- Licence status counts: 447 entries.
- Publication stages: 7 named, 0 defined, 0 recorded in code or data.
