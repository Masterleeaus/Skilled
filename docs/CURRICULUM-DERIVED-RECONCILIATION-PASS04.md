# Skilled — Curriculum derived source reconciliation (Pass 4)

## Source integrity and artifacts

The canonical curriculum authoring files are the only inputs for normalization. The reconciliation command regenerates:

- `curriculum/lesson-normalization-index.json`
- `curriculum/lesson-review-queue.json`
- `curriculum/lesson-review-queue.csv`

`node scripts/rebuild-curriculum-derived.mjs --check` is read-only and fails if any generated artifact is stale. `--write` updates only those three derived files. Input lesson SHA-256 fingerprints are compared before and after regeneration. Duplicate lesson IDs, missing source references, lost source-review statuses and automatic publication approvals are rejected.

The review queue remains explicitly non-publishing. Its priority categories distinguish missing instruction, missing outcomes and missing course mapping; nothing automatically approves a blocked lesson.

## Regression tests

`node scripts/test-rebuild-curriculum-derived.mjs` validates exact serialized artifacts, source coverage, all review-status holds and unchanged source material.

`node scripts/test-lesson-normalization-fixtures.mjs` checks 20 synthetic fixture cases. The cases cover missing, blank and malformed identity, instruction, learning outcome and course mapping fields; one case confirms that a source status of APPROVED does not itself grant derived publication approval. Synthetic fixtures are stored outside the canonical authoring tree and cannot be published accidentally.

The independent GitHub reconciliation workflow runs these checks and updates the three generated outputs on the pull request branch. The full curriculum quality gate is separate and remains deliberately strict.

## Observed GitHub verification

After regeneration, the existing CI checks for source audit, normalizer, review queue and assessment reconciliation passed; the synthetic normalization test passed too. The full gate still fails because 1,267 assessment files lack qualifying human approval. Those approvals must be conducted through the prescribed editorial review procedure and cannot be inferred from a CI run.

## Boundaries

No source lessons, assessment answer keys, assessment approval records, learner publication status, curriculum ownership decisions or mapping decisions are changed by this pass. Maintain the unresolved mapping list and high-risk expert review requirements. Do not close issue #26 or content-review issues on the basis of generated-index consistency alone.
