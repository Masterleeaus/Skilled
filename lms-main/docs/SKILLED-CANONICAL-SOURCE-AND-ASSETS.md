# SkilledAt.Work — canonical source and asset handling

This document records source ownership for issue #72. It supplements the detailed [consolidation inventory](CONSOLIDATION-INVENTORY-2026-11-08.md). It does not certify production deployment.

## Source-of-truth map

| Capability | Canonical tracked source | Status |
|---|---|---|
| Browser and learner/admin interfaces | `lms-main/apps/frontend/src/` | Active Next.js application |
| API and service authorization | `lms-main/apps/backend/src/` | Active Express application |
| Persistence and migrations | `lms-main/apps/backend/prisma/` | Active **until** Central #68 migration is agreed |
| Canonical authored curriculum | `lms-main/curriculum/courses/`, `shared/` | Requires lesson-level review/approval |
| Derived lesson index | `lms-main/curriculum/lesson-normalization-index.json` | Regenerate with `node scripts/reconcile-lesson-formats.mjs`; never edit manually |
| Training visuals | `brand/`, `library/` at repository root | Canonical tracked images |
| Frontend public visuals | `lms-main/apps/frontend/public/academy/` | **Generated copy**; gitignored, not canonical |
| Archived compressed imports | Root historical ZIPs | Source provenance only; do not build or install from them |
| Historical pass reports | `lms-main/PASS*`, `docs/legacy-bootstrap/` | Provenance/reference, not active executable setup |
| Inactive package placeholder | `lms-main/packages/shared/` | Do not remove until workspace/lockfile migrations are reviewed |

## Repeatable asset materialisation

Run from `lms-main/`:

```sh
node scripts/prepare-public-assets.mjs
node scripts/prepare-public-assets.mjs --check
node --test scripts/test-prepare-public-assets.mjs
```

The script copies both repository-root `brand/` and `library/` into `apps/frontend/public/academy/`, keeping paths unchanged. Frontend `predev` and `prebuild` scripts call it automatically. Missing source folders and symlinked source files fail closed. If an existing output file has different bytes, the script **fails instead of overwriting it**. Existing matching files are reused. Source images are never moved or deleted.

Run after cloning a full checkout that includes `brand/` and `library/`. Deploy the complete built Next public output, including the generated `academy/` directory; deployment packaging to an actual host is **not verified**. The public site URL remains environment-configured, not assumed.

## Consolidation constraints

- Keep license and source attribution. Old `Titan Academy` labels in provenance are not the current product name.
- Do not relocate migration history or rename Prisma tables, routes, role enums or `@lms/*` package keys without tested compatibility migrations.
- Root ZIPs may be redundant but have not been deleted; archive weight tracked by issue #42.
- Tutor chatbot, certificates and runbooks have potential overlapping implementations: see inventory sections 6–9. Their behavior must be compared before deduplication.
- Curriculum publication gates, identity scoping, assessor approvals and evidence records are not affected by this asset copy change.
- A successful asset unit test is **not** proof of image availability on a production server. Verify deployment artifacts separately.

## Active-code consolidation pass

- Canonical discussion thread UI: `apps/frontend/src/components/DiscussionThreadDetail.tsx`. Both `student/courses/[slug]/discussions/[threadId]/page.tsx` and `teacher/courses/[slug]/discussions/[threadId]/page.tsx` now wrap the same component, preserving both routes and their role-dependent pin UI.
- Canonical token signing and validation: `apps/backend/src/modules/auth/token.utils.ts`. The unreferenced `src/utils/token.ts` copy was removed; no public auth route or token algorithm was changed.
- Canonical permissions test: `apps/backend/src/tests/permissions.test.ts`. The byte-identical inactive `apps/backend/tests/permissions.ts` was removed.
- A source consolidation test (`scripts/test-active-source-consolidation.mjs`) verifies the remaining paths and shared discussion operations.
- Dedicated CI workflow `skilled-source-consolidation.yml` tests these contracts and validates backend/frontend TypeScript with a generated Prisma client. Production behavior and full browser flows still require separate verification.

**Not collapsed:** inherited quizzes versus Academy assessments, inherited certificates versus evidenced completions, and the two tutor stores. These are different active or persisted concepts, not demonstrated duplicate implementations; deleting one would risk functionality or data.

## Curriculum ingestion boundary (issue #72)

The repository retains **two non-interchangeable paths**:

1. `apps/backend/prisma/import-titan-curriculum.ts` imports **planning briefs** from `apps/backend/prisma/curriculum/titan-three-layer-lessons.json`. It writes `AcademyContentLesson` metadata and `DRAFT` revisions under the separate inventory marker `titan-three-layer-lessons`; it cannot publish a course, track or revision. The historical filename and marker remain for compatibility.
2. `apps/backend/src/modules/curriculum/file-lesson-loader.ts` indexes canonical authored lessons under `curriculum/courses/*/*.json` and `curriculum/shared/**/*.json`. Learner body routes still require authentication, enrolment, an eligible published course/track/placement/revision, matching knowledge checks and the revision content hash. A file alone grants no learner access.

**Safe database-free import preflight** (from `lms-main/`):

```sh
pnpm -C apps/backend exec tsx prisma/import-titan-curriculum.ts --validate-only
pnpm -C apps/backend exec tsx prisma/import-titan-curriculum.ts --validate-only --source path/to/other-inventory.json
```

Preflight checks inventory IDs and mandatory fields and prints counts per layer, with `databaseConnected:false`, `writes:0` and `publicationApproved:false`. This is **not** a database diff or approval workflow. Invoking the same CLI **without** `--validate-only` retains the existing transactional draft-import behaviour; do not run it against a production database without an approved change plan. Unknown flags are rejected.

The protected publication and evidence models remain separate. No database schema, migration or existing approvals were modified by this consolidation step.

## Historical canonical-import manifest: verified stale (pass 8)

The committed `curriculum/import/canonical-import-manifest.json` is a **pass42 snapshot of 216 lesson rows**, not the current canonical curriculum. GitHub Actions [run 42529487757](https://github.com/Masterleeaus/Skilled/actions/runs/42529487757) audited its two per-row file hashes and source IDs against the actual repository checkout:

| Observation | Count |
|---|---:|
| Entries | 216 |
| Fully matching entries | 0 |
| Canonical lesson hash mismatches | 93 |
| Missing `lessons/ready/` source files | 216 |
| Path traversal or duplicate identity violations | 0 |

**Do not use this snapshot for new imports.** It has no demonstrated current import compatibility, and its `ready` sources were not found in that checkout. It was intentionally **not** auto-regenerated because the old import generator assumes retired `lessons/ready/` files and could misrepresent current authoring and publication state. Neither the snapshot nor the authored lessons were changed.

Run the read-only check from `lms-main/`:

```sh
node scripts/audit-canonical-import-manifest.mjs --report build/legacy-import-manifest-audit.json
node scripts/audit-canonical-import-manifest.mjs --strict
node --test scripts/test-audit-canonical-import-manifest.mjs
```

Normal report mode exits successfully while reporting stale conditions; `--strict` fails on any stale/unsafe snapshot and is appropriate before any later migration/import proposal. The independent CI workflow uploads a JSON audit artifact and presents a warning. Its passing status reflects **scanner health**, not manifest freshness.

The separate 221-row planning-brief importer still uses `apps/backend/prisma/curriculum/titan-three-layer-lessons.json` and remains draft-only. Do not confuse the historical 216-row manifest with that inventory. A new manifest format, if required, must be explicitly designed around approved canonical source identity, current lesson revisions and publication gates.
