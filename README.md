# SkilledAt.Work — training, curriculum, assessment and workforce competency

**Repository:** `Masterleeaus/Skilled` · **Default branch:** case-sensitive `Main` · **Documentation review:** 18 November 2026

Skilled is Titan Zero's training and verified competency application for service businesses. It combines an inherited LMS, versioned curriculum content, enrolment/progress, assessments, practical evidence, instructor and assessor workflows, organisation-scoped training and integrations for dispatch eligibility.

**Repository status:** source and targeted CI functionality are evidenced; the **complete integrated production deployment is not certified**. Do not confuse passing backend or curriculum checks with approved content, correct real-company permissions, configured billing and staging cutover.

## Roles, workflows and capability boundaries

| Area | Intended functionality | Source/evidence caveat |
| --- | --- | --- |
| Curriculum | Vertical-specific lessons, tracks, revisions, review, publication and quality checks | Unmapped drafts and regulated-topic review remain open ([#17](https://github.com/Masterleeaus/Skilled/issues/17), [#20](https://github.com/Masterleeaus/Skilled/issues/20), [#34](https://github.com/Masterleeaus/Skilled/issues/34)) |
| Learning | Courses, modules, progress, quizzes, assignments, class participation, certificates | Full learner/browser/assessor acceptance remains open ([#9](https://github.com/Masterleeaus/Skilled/issues/9), [#298](https://github.com/Masterleeaus/Skilled/issues/298)) |
| Verified skills | Evidence, assessor review, approved/expiring competencies, training eligibility | Competency dispatch crosswalk is an interface requirement, **not** a fully deployed integration ([#311](https://github.com/Masterleeaus/Skilled/issues/311)) |
| Organisation learning | Tenant-scoped enrolments, staff assignments, manager reports and coaching recommendations | Cross-company and revocation tests required ([#297](https://github.com/Masterleeaus/Skilled/issues/297), [#312](https://github.com/Masterleeaus/Skilled/issues/312)) |
| Front Desk knowledge | Published revision access, service-vertical FAQs and scoped competency results | [#310](https://github.com/Masterleeaus/Skilled/issues/310), [#314](https://github.com/Masterleeaus/Skilled/issues/314) |

Skilled **owns learning outcomes and competencies**. Sorted owns jobs and determines authorized assignment using the verified competence contract; Scheduled owns bookings; Supercharged owns communications; Central owns shared identity, company and release coordination. An AI answer or course acknowledgement **never automatically becomes an assessed competency**.

## Source and project layout

| Path | Contents |
| --- | --- |
| `apps/frontend/` | Next.js 16 frontend, learner/manager UI, browser tests and prepared brand assets |
| `apps/backend/` | Express 5/TypeScript service, Prisma 6, REST APIs, auth, learning/assessment and worker logic |
| `packages/eslint-config/`, `packages/shared/` | ESLint 10 baseline and shared workspace code |
| `curriculum/` | Drafts, verified lesson sources, mappings, quality reports and licence/reuse evidence |
| `brand/`, `library/` | Canonical source media; build copies belong to frontend public assets |
| `docs/`, `scripts/` | Integration/runbooks, curriculum audits and source verification |
| `docker-compose.local-dev.yml` | **Local-only** dependencies; not a DirectAdmin/production installer |

The inherited LMS and legacy Titan Academy names may remain in internal identifiers or source history. Customer-visible product identity is SkilledAt.Work; **do not break storage keys and API compatibility to achieve cosmetic naming**.

## Development environment

The root `package.json` pins **pnpm 10.0.0**, requires **Node.js 22+**, and coordinates frontend/backend work. Use a disposable PostgreSQL, Redis and MinIO environment:

```bash
corepack enable
pnpm install --frozen-lockfile
# Local development only, never on an existing DirectAdmin production server:
docker compose -f docker-compose.local-dev.yml up -d
cp apps/backend/.env.example apps/backend/.env
cd apps/backend
pnpm exec prisma generate
pnpm exec prisma migrate deploy
pnpm dev
```

Configure the backend-local `.env` securely for development. In another terminal, run `pnpm --filter @lms/frontend dev` from the repository root. For real deployment consult [docs/INSTALL.md](docs/INSTALL.md), [production preflight](docs/ACADEMY-PASS43-DEPLOYMENT-PREFLIGHT.md) and [secrets runbook](docs/runbooks/secrets-handling.md). **Never execute `prisma migrate dev`, `db push`, local Compose bootstrap or `prisma migrate reset` against a customer database.**

### Required quality gates

```bash
pnpm run lint
pnpm run build
pnpm test:academy:backend
pnpm test:source
pnpm curriculum:ci
pnpm --filter @lms/backend exec vitest run
node --test scripts/test-eslint-workspace-contract.mjs
```

The [required Skilled CI gates](.github/workflows/skilled-ci-gates.yml) install from the frozen lockfile, run **both application lints**, ESLint major-drift regression tests, auth/publication contracts, backend tests/test typecheck and real disposable PostgreSQL-backed Vitest. The narrow ESLint drift issue [#303](https://github.com/Masterleeaus/Skilled/issues/303) was closed with exact-head passing CI; this does **not** close tenant-staging or curriculum-approval work.

## Shared Titan deployment target

[Central ADR-009](https://github.com/Masterleeaus/Central/blob/main/TITAN_ARCHITECTURE_DECISIONS.md) specifies a single physical shared PostgreSQL database, `company_id` membership, centrally ordered migrations, distinct least-privilege product credentials and Logto-backed Central OIDC in **integrated mode**. Legacy separate Prisma database/locally minted JWT flows may be necessary for development or compatibility but are not an approved second unified production login. Full migration and Central integration remain tracked in [#68](https://github.com/Masterleeaus/Skilled/issues/68), [#71](https://github.com/Masterleeaus/Skilled/issues/71), [#210](https://github.com/Masterleeaus/Skilled/issues/210).

## Current issue-driven acceptance priorities

- **Security and authorization:** [#300](https://github.com/Masterleeaus/Skilled/issues/300) discussion routes and [#301](https://github.com/Masterleeaus/Skilled/issues/301) live-class join/recording disclosures have source-level protections and focused HTTP tests; complete deployed real-company/tenancy review before closure.
- **Migration and release:** [#302](https://github.com/Masterleeaus/Skilled/issues/302) reversible migration review; [#299](https://github.com/Masterleeaus/Skilled/issues/299) conflicting PR reconciliation; [#35](https://github.com/Masterleeaus/Skilled/issues/35) disaster recovery/runbooks.
- **Curriculum:** new draft courses [#194–#199](https://github.com/Masterleeaus/Skilled/issues?q=is%3Aissue+is%3Aopen+label%3Acurriculum) and course mappings/reviews must remain **unpublished** until outcomes, safety, accessibility, licence and specialist reviews are complete.
- **Governance:** [all open issues](https://github.com/Masterleeaus/Skilled/issues?q=is%3Aissue+is%3Aopen) and [legacy closure review #320](https://github.com/Masterleeaus/Skilled/issues/320).

Never infer the status of a course from its title alone. Approvals and checked tasks must have verifiable lesson/source/test evidence. Preserve inherited LMS licence and curriculum attribution; see [curriculum/licence/README.md](curriculum/licence/README.md).
