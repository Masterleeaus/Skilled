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
- Tutor chatbot and certificates have overlapping concepts that must be compared before deduplication. Deployment documents now have an [authoritative navigation and release entrypoint](DEPLOYMENT.md); the original host-specific checklist remains preserved as unverified history.
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

## Current-tree inactive-source boundary (pass 9)

A new reproducible read-only checker, `scripts/audit-inactive-source-boundaries.mjs`, scans imports in both active applications, the actual API mounts, and the preserved historical folders. It prevents **active-to-archived relative imports** and unexpected direct chatbot mounting without deleting anything.

Latest strict GitHub Actions scan (run [42530226066](https://github.com/Masterleeaus/Skilled/actions/runs/42530226066)):

| Checked category | Current tracked checkout |
|---|---:|
| JavaScript/TypeScript files inspected inside active app source trees, including the dormant chatbot subtree | 303 |
| Retired `curriculum/lessons/converted` files | 8 |
| Retired `curriculum/lessons/ready` files | 1 |
| Historical bootstrap scripts and files | 4 |
| Historical `PASS42/` evidence files | 34 |
| Inactive chatbot subtree files (11 executable source) | 13 |
| Inactive root `tests/` files | 2 |
| Root ZIP archives present in this checkout | 0 |
| Imports from active code across into classified historical folders | 0 |
| Direct chatbot route mount | Not found |
| Tutor route feature flag | Present |

**These counts supersede the older inventory's historical 511 converted / 216 ready and six ZIP claims for this specific checkout.** They describe *files currently present*, not the original archive content or deleted Git history. In particular, the historical 216-entry import snapshot still refers to 216 absent ready files (pass 8 above). The current default source remains `curriculum/courses/` and `curriculum/shared/`; no retired lesson content was restored.

Run:

```sh
node scripts/audit-inactive-source-boundaries.mjs --strict --report build/inactive-source-boundaries.json
node --test scripts/test-audit-inactive-source-boundaries.mjs
```

Caveat: this is a static import/mount boundary scan, not a full proof of runtime reachability, API authentication, or deployment safety. Imports *within* the retained unmounted chatbot prototype are intentionally not counted as active-app violations. Its migration tables and code are preserved pending an explicit product and migration decision.

## Deployment documentation reconciliation (pass 10)

Issue #72's three competing deployment guides now have explicit roles. [DEPLOYMENT.md](DEPLOYMENT.md) is the canonical release entrypoint and blocking preflight; [INSTALL.md](INSTALL.md) is the dependency and host setup reference; [runbooks/deployment.md](runbooks/deployment.md) is the release/rollback operator checklist. The older [server proposal](../curriculum/research/DEPLOY-RUNBOOK.md) remains in place with an explicit warning that its port and server assumptions were **not verified**.

The consolidation does **not** execute host provisioning, change migrations, alter secret handling or infer that production is ready. CI validates links and required safeguards through `scripts/test-deployment-doc-contract.mjs` and `skilled-deployment-doc-contract.yml`. Any actual release still requires an approved staging rehearsal, curriculum approval gates and live operational verification.

## Active runtime and persisted compatibility baseline (pass 12)

The read-only `scripts/audit-active-compatibility.mjs` inspects current backend source, key models and SQL migration directories. As checked by [GitHub Actions run 42532013054](https://github.com/Masterleeaus/Skilled/actions/runs/42532013054):

- **31 nonempty Prisma migration scripts exist**, not 21 as stated in the older 2026-11-03 host proposal. Two migration names intentionally share prefix `20261102000100`; their complete names are distinct and preserved.
- The canonical schema contains all 18 named compatibility-critical model anchors, including `User`, `Company`, `CompanyMember`, lesson/review/competency/evidence tables and both persisted tutor-store families.
- The Express source retains active auth, curriculum, integration, quizzes, courses and certificate mounts. Core account routes remain authenticated and login/reset rate-limited; access JWT verification remains HS256-pinned.
- Integration requests still require hashed, revocable credentials, explicit per-service company-reference allowlists, mapping external references to local companies and active company membership.
- Learner body serving retains enrolment, published revisions, file/revision knowledge-check alignment, revision hash integrity and the approved-revision body as the response; the reviewer publishing service still evaluates the publication gate.
- Tutor routing stays feature-gated and the learner lesson loader still indexes only `courses/` and `shared/` authored sources.

Run from `lms-main/`:

```sh
node --test scripts/test-audit-active-compatibility.mjs
node scripts/audit-active-compatibility.mjs --strict --report build/active-compatibility-audit.json
```

The six regression tests also mutate temporary fixtures to check that removal of a migration, schema model, JWT algorithm pin, tenant allowlist, company association, enrolment gate or revision-only serving is detected. The workflow publishes the audit JSON.

**Limits:** The audit examines source contracts and migration file presence, not live authorization, migration checksums stored in PostgreSQL, transaction behavior or fully compiled call-graph reachability. A passing static audit does not satisfy issue #35 staging rehearsal or issue #34 high-risk expert review. Deleting or renaming persisted tables and migration directories remains prohibited absent a tested compatibility migration coordinated with #68 and #71.

## Demo seed safety and product naming (pass 13)

`apps/backend/prisma/seed.ts` is a **destructive inherited demo fixture**, not the SkilledAt.Work curriculum importer. It starts with `wipeDatabase()` and is not a production setup step. Its demo course now explicitly says it is **not approved SkilledAt.Work curriculum**, rather than presenting a legacy product name to learners.

A separate pure preflight module, `apps/backend/prisma/local-demo-seed-guard.ts`, now refuses a wipe unless **all** conditions hold before the Prisma client is instantiated:

- `NODE_ENV` is explicitly `development` or `test` (blank, staging and production are rejected).
- A `--confirm-wipe` flag or `SEED_CONFIRM_WIPE=1` confirms the destructive operation; unknown command-line flags are refused.
- `DATABASE_URL` is a PostgreSQL URL with nonempty credentials and a **loopback** host (`localhost`, `127.0.0.1` or `::1`).
- The selected database has an explicit non-system name and cannot be `titan_academy`, `postgres`, `template0` or `template1`.
- Target logging prints host and database name only; credentials are never printed.

The `local-demo-seed-guard.test.ts` test suite uses pure inputs without a PostgreSQL connection. A loopback host could still conceal a forwarded production port, so the operator must independently verify the target is a disposable local database. **Never run demo seeding against staging/production or other shared services.** No actual demo seed was executed in this pass.
