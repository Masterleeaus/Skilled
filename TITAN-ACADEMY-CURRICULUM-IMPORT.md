# Titan Academy curriculum import

This TypeScript LMS includes the **221 original three-layer lesson briefs** (77 universal, 54 service-group, 90 vertical). They are **not completed lessons**, and the importer intentionally does not publish them as learner-ready course content.

## Import into PostgreSQL

From `apps/backend`, with `DATABASE_URL` configured and dependencies installed:

```bash
npx prisma migrate deploy
npm run prisma:generate
npm run curriculum:import
```

The additive migration creates `academy_content_lessons`. Import is idempotent by `sourceId`, preserves all existing LMS tables and records, and will not overwrite rows whose `contentStatus` has been changed from `BRIEF` (e.g. trainer-edited or published content). Inspect the resulting import counts before exposing content to learners.

## Next integration

Implement canonical lesson revisions, lesson placements and shared competency credit; reconcile 121 earlier cleaning lesson drafts against the 221 briefs. These records are a staging content library, not yet course/module placements or student lessons. No live database was available for this build.
