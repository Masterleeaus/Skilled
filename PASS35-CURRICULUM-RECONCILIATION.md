# Pass 35 — Curriculum source format reconciliation

The Pass 34 audit treated the absence of `content.learner` as missing lesson content. 119 drafts instead store original content in `content.courseLessons[].lesson`. This pass adds a **read-only derived normalization index** without modifying any original draft or granting publication approval.

Run `node scripts/reconcile-lesson-formats.mjs` to regenerate `curriculum/lesson-normalization-index.json`. Run `node scripts/test-reconcile-lesson-formats.mjs` for dependency-free regression checks. `--strict` exits nonzero while review blockers remain.

The index records original status, a deterministic source hash, format, explicit learning outcomes, recognized instructional sections and source identifiers. It does not invent missing course mappings or educational text. Remaining blockers must be reviewed by a curriculum editor; the derived index is not a publishing system.

The prior Pass 34 audit is retained as a historical record, not rewritten. Its structural findings should be interpreted in light of the heterogeneous source formats.
