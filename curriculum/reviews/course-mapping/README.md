# Course mapping review inventory — issue #20

**Status: awaiting qualified curriculum-owner decisions.** This directory holds separate evidence records for all 16 currently unmapped `SFS-01`–`SFS-16` drafts. It does **not** contain approved placements. It does not alter lesson source or make any lesson publishable.

## Source evidence and scope

Each `SFS-XX.json` record captures the exact Git blob SHA of its canonical source under `curriculum/shared/app/`, the source's title, proposed module title, exact prerequisites, audience, status, learning outcomes, instruction section count, source reference count and observed course slugs. These fields are checked against the canonical source on every CI run. Every observed `courseSlugs` field was empty when this review inventory was created. The records represent 16 distinct lessons, not duplicates, and all remain `DRAFT`.

They collectively describe a service-business field-operations curriculum: job lifecycles, service areas, hours, job templates and tasks, equipment, visits, scheduling conflicts, dispatch, worker capacity, crews, time sheets, stock, offline work and customer sign-off. Their thematic similarity is *not* evidence of an approved course or track. A `moduleTitle` containing “proposed module” is not an approved `courseSlug`, and reviewers must not silently turn it into one.

## Review procedure

1. Confirm the exact canonical source and compare it to the evidence snapshot; the CI audit fails when any source blob or material field changes.
2. Inspect the authoritative course and track registry, curriculum objectives, exclusions, jurisdiction, prerequisites, licensing and learner audience. Identify whether the source should be assigned to a reviewed course or explicitly excluded.
3. For each record, set `decision` to `approved` or `excluded` only after a qualified curriculum-owner decision. Record a named `reviewer`, ISO timestamp `reviewedAt`, substantive `rationale`, and explicit `proposedCourseSlugs` (empty for exclusion).
4. Reconcile any approved proposal against canonical source and the publisher/import paths. Refresh content hashes and submit any changed lesson through the existing human review and publication gates. **A decision recorded here cannot approve or publish a lesson.**
5. Rebuild the derived normalization index and review queues from the current authoritative lesson source; never manually update only the generated copies. Keep unresolved items blocked until approval.

## Local checks

From `lms-main/`:

```sh
node --test scripts/test-audit-course-mapping-review.mjs
node scripts/audit-course-mapping-review.mjs --report build/course-mapping-review-audit.json
node scripts/audit-course-mapping-review.mjs --fail-on-unresolved
```

The first two commands should pass when every evidence snapshot is valid, even though 16 decisions are pending. The last command is expected to **fail closed** until every mapping decision is reviewed. CI uploads the item-level report and never writes approvals. A passing evidence-audit CI job does **not** mean issue #20 or curriculum publication is complete.

This inventory is separate from `curriculum/lesson-review-queue.json` and `curriculum/lesson-normalization-index.json`. Both generated files may currently be stale and must be reconciled after source changes; this inventory cannot be used to bypass their gate.

## Derived-file reconciliation (9 November 2026)

The dedicated GitHub Actions reconciliation job regenerated `curriculum/lesson-normalization-index.json`, `curriculum/lesson-review-queue.json` and `curriculum/lesson-review-queue.csv` directly from the canonical authoring source and committed only these three derived files to this review branch. The generation job ran the existing normalization and queue self-tests before committing. Editorial decisions remain unresolved, all source lessons are unchanged, and the assessment approval gate remains blocked until qualified review. The generated commit is not an editorial approval; after merge, CI must revalidate against the final source tip.
