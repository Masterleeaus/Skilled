# Pass 40 — assessment publication gate

`node scripts/validate-assessment-publication.mjs curriculum/assessment-publication-report.json` audits all canonical assessments. Add `--fail-on-blocked` for CI; exit code 1 means publication must stop. The command does **not** publish content.

Approval records are keyed by `lessonId` in `curriculum/assessment-publication-approvals.json` (or the `ACADEMY_ASSESSMENT_APPROVALS` path). Each must contain `status: "approved"`, `sha256` matching the exact assessment file bytes, a nonempty `reviewer`, and ISO `reviewedAt`. A change to the assessment invalidates approval automatically.

**Editorial requirements:** independently check that each answer index points to the correct answer in the actual question set, verify jurisdiction-specific safety guidance, establish a real pass rule, inspect practical criteria and stop-work conditions, and only then record approval. This validator checks structural validity and approval provenance; it cannot establish answer correctness, clinical/safety accuracy or real reviewer identity. No approvals are supplied by default.

The nine assessment JSON files outside `curriculum/assessments` remain outside this gate and require separate reconciliation. The 141 source-mapping findings from Pass 39 also remain unresolved. This is a conservative additional publication safeguard, not a claim of complete assessment integration.
