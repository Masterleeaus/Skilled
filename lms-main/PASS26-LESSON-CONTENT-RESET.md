# Pass 26 — Lesson content reset and context configuration status

The 221 unpublished Titan Academy curriculum briefs and their import command have been removed at the owner's request. The team will author replacement lessons. This does not delete any data previously imported into an existing PostgreSQL database: database cleanup requires an explicit, reviewed migration with a backup.

The LMS course, lesson, canonical revision, placement, assessment, enrolment, competency, and practical evidence engines remain. No migrations were removed to preserve existing database history.

## Context-aware lesson configuration

- Implemented in source: 56 business-field keys across 13 groups; organisation-scoped draft, approval and retirement endpoints; placeholder resolution; authenticated learner context endpoint; immutable snapshots and snapshot retrieval/verification.
- Not implemented or verified end-to-end: automatic Field Services synchronisation, business-manager/learner UI, live PostgreSQL integration, complete TypeScript compilation.
- Authoring convention: `{{business:equipment.primary_tool}}` placeholders are optional; only approved values resolve. Keep sensitive data out of lesson templates and validate tenant permissions.

## Team handoff

Write new canonical lessons using the LMS revision and placement models. Do not restore the deleted briefs or import script. Add a deliberate content import/publishing workflow only after the team supplies approved lesson material.
