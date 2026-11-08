# Pass 34 — curriculum source integrity

This pass adds a dependency-free executable audit of all 216 expanded cleaning lesson drafts. Run `node scripts/audit-curriculum.mjs --strict` from `lms-main`, or `node scripts/test-audit-curriculum.mjs`. Use `--json` for machine-readable lesson hashes, issue details and course distribution.

The audit reports pre-existing content completeness issues in the expanded lesson drafts; consult `PASS34-CURRICULUM-AUDIT.json` for exact findings. All 216 drafts remain **READY FOR REVIEW**. This validation is structural only; it does not approve technical accuracy, training suitability, or publication. No lessons are automatically published.

Baseline is the Pass 33 reconciled cumulative archive, which already contains the Pass 32 learner progress changes and the Pass 29 merged specialist curriculum.
