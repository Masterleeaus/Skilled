# Completion rule for courses without a licence rule: proposal

Date: 2026-11-09. Status: proposal only. Nothing has been applied to the register, the courses, or the publication gate.

## Why this is needed

- The register now has 825 lesson entries: 161 threshold, 40 required, 624 not_checked, 0 not_required.
- No course has a fully confirmed licence picture. Every one of the 44 course entries in `structure/COURSES-MODULES.json` has at least one not_checked lesson.
- The `high-risk` course has 84 placed lessons and none has a licence rule checked yet.
- The old rule made `not_required` the same as `not_checked` for track purposes, so the status did not say what was known. In this pass, 94 `not_required` entries had no official URL and were moved to `not_checked` (see `prior_status` in `lesson-licence.json`).

## Proposed rule

1. A lesson is `licence_complete` only if its status is `required`, `threshold` or `not_required`, and it has at least one official URL and a page date. `not_required` needs the same source as the other two. A status with no source is not accepted.
2. A course is `licence_complete` only if every placed lesson is `licence_complete`. Otherwise it is `licence_incomplete`, and the course page lists how many lessons are still not_checked.
3. Lessons that are not_checked stay in the non-licensed track only under this label: "licence not yet confirmed for this work". They are not presented as checked.
4. A course with no licence-relevant lessons still needs one dated official source per state it is sold in, saying that no licence applies to its work. Until that source exists, it is `licence_incomplete`.
5. Re-checks follow the existing monthly source-monitoring review (SOURCE-MONITORING.md). A page date older than 12 months is shown as `verified_page_old` and triggers a re-check.

## Options for the owner

- Option A: keep the current rule. Not_checked lessons are in both tracks until reviewed. This keeps content available but may show unlicensed work as allowed.
- Option B (recommended for publication): only `licence_complete` courses go to the non-licensed track. The 44 courses would all be held until their lessons are checked. This is the safe default, but it holds everything.
- Option C: hold only courses whose lessons touch licensed work (for example the `high-risk` course and courses with threshold entries), and use option A for the rest. This needs a list of licensed-work lessons, which does not exist yet.

## What I recommend

Option C with a short, dated list of licensed-work lessons, then option B for those. The rule for courses with no licence rule (point 4) applies to both.

## Decisions a human must make

1. Which option (A, B or C) applies to publication.
2. Whether the 94 demoted `not_required` lessons should be restored only if an official page is found, or kept as not_checked.
3. Whether the `high-risk` course (44th course in the structure file; the checklist says 43) is in scope.
