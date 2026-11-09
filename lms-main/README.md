# Titan Academy

> **Titan Academy production safety (Pass 43):** This repository contains a separately staged, unverified production candidate. **Do not run** `docker compose up` or inherited bootstrap scripts on an existing DirectAdmin server. The original developer Compose configuration is saved as `docker-compose.local-dev.yml` and is not suitable for production. See [Academy production preflight](docs/ACADEMY-PASS43-DEPLOYMENT-PREFLIGHT.md).

Titan Academy is a training platform for field and home-service businesses. It combines a course and learner base with curriculum composition, knowledge checks, practical evidence and assessor review, organisation-scoped training, and business-specific lesson context with immutable presentation snapshots.

The codebase was started from an inherited full-stack LMS (see [Origin and licence](#origin-and-licence)). Inherited modules are kept where Titan Academy still uses them. Their behaviour is not re-verified for Titan Academy. Verification status for every open item is tracked in [`TITAN-ACADEMY-MASTER-IMPROVEMENT-REGISTER.md`](TITAN-ACADEMY-MASTER-IMPROVEMENT-REGISTER.md).

> **Status (2026-11-08): not production-verified.** The fresh install check verified:
> - Frozen-lockfile install passes (`pnpm install --frozen-lockfile`).
> - `prisma validate` and `prisma generate` pass.
> - Backend `tsc` and frontend `next build` pass. Frontend lint passes.
> - Migrations apply to an empty PostgreSQL 16 database with no drift.
> - Backend unit tests pass, with 9 test files skipped (see [Testing and Quality Gates](#testing-and-quality-gates)).
> - Repository source verification passes 26/26.
>
> Not verified: the full stack with MinIO, the browser suite, and live API flows. See the register (ACA-001 to ACA-004, ACA-018).

![Node](https://img.shields.io/badge/node-%3E%3D20-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-lightgrey)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Folder Structure](#folder-structure)
- [Getting Started](#getting-started)
- [Demo Accounts](#demo-accounts)
- [API Overview](#api-overview)
- [Testing and Quality Gates](#testing-and-quality-gates)
- [Documentation](#documentation)
- [Origin and licence](#origin-and-licence)

---

## Overview

Titan Academy delivers training that a business can configure without changing the canonical lesson content:

- **Canonical lessons and revisions.** Lesson content is versioned. Only published revisions reach learners. Curriculum drafts stay in review until a human approves them.
- **Tracks and course composition.** Published tracks are attached to courses. Each placement is marked required or optional.
- **Knowledge checks.** Learners answer questions, and the server grades them. Answer keys are never sent to learners.
- **Practical evidence.** Learners submit evidence. An assessor in the organisation approves or rejects it. Approval creates a verified competency that can expire. Acknowledging a lesson never creates a competency.
- **Organisation training.** Managers assign courses to members of their organisation.
- **Business-specific context.** Managers set field values. Only approved values appear in learner lessons. Each presentation is saved as an immutable snapshot with a content hash, and the hash is re-verified when the snapshot is read.
- **Integration.** Service credentials and external identities are provisioned per organisation. Integration routes are tenant-scoped and audited.
- **Completion reports.** Managers and assessors can read evidence-backed completion reports for a learner or an organisation (see [API Overview](#api-overview)).

---

## Features

### Academy additions
- Curriculum tracks, lesson revisions and placements, with publication gates
- Learner acknowledgements, separate from practical competency
- Server-graded knowledge checks (80% pass threshold)
- Practical evidence submission, assessor review and expiring competencies
- Organisation membership, roles (owner, manager, assessor, learner) and training assignments
- Business lesson fields with draft, approve and retire states
- Organisation-scoped lesson context snapshots with history paging and integrity checks
- Evidence-backed learner and organisation completion reports

### Inherited LMS base (retained where used)
- Course, module and lesson management, with video upload
- Enrolment and per-lesson progress tracking
- Quizzes with auto-grading for single-choice questions
- Assignments, live classes, attendance and certificates
- Payments with Stripe provider abstraction and coupons
- Discussion threads, reviews and an admin analytics and audit view
- JWT access tokens with revocable refresh tokens, role-based access control, rate limiting, soft delete, centralised error handling and structured logging

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15 (App Router), TypeScript, Tailwind CSS v4, Zustand, TanStack Query, React Hook Form + Zod |
| **Backend** | Node.js, Express 5, TypeScript, Prisma ORM |
| **Database** | PostgreSQL 16 (Prisma migrations under `apps/backend/prisma/migrations`) |
| **Cache / Queue** | Redis, BullMQ (email and certificate workers) |
| **Object storage** | MinIO (S3-compatible) |
| **Auth** | JWT (access and refresh), bcrypt, per-device session revocation |
| **Payments** | Stripe (test mode), provider-abstracted |
| **Testing** | Vitest, Supertest, Playwright (Chromium), axe-core |
| **Infrastructure** | Docker Compose (Postgres, Redis, MinIO, Mailhog), pnpm workspaces |

---

## Folder Structure

```
lms-main/
├── apps/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── modules/          # feature slices: auth, courses, quizzes, curriculum (Academy), ...
│   │   │   ├── middleware/       # authentication, RBAC, centralised error handler
│   │   │   ├── jobs/             # BullMQ processors (email, certificates)
│   │   │   ├── config/           # env validation, logger, Prisma, Redis, MinIO clients
│   │   │   └── tests/            # Vitest and Supertest suites (Academy suites use an in-memory Prisma double)
│   │   ├── prisma/               # schema, migrations, seed and curriculum import scripts
│   │   └── scripts/              # verification scripts
│   └── frontend/
│       ├── src/                  # App Router pages, typed API clients, stores, components
│       ├── scripts/              # source-level UI checks
│       └── tests/browser/        # Playwright browser suite for the lesson player (mocked API)
├── curriculum/                   # lesson drafts, normalisation index, assessment files, CI baseline
├── scripts/                      # curriculum audits, reconciliation and the curriculum CI gate
├── docs/runbooks/                # deployment, secrets and recovery runbooks
├── packages/shared/              # cross-app shared code (reserved)
└── docker-compose.local-dev.yml  # Historical LOCAL development services only
```

---

## Getting Started

### Prerequisites
- Node.js 20 or later
- pnpm 10 or later
- Docker (for Postgres, Redis, MinIO and Mailhog)

### Setup

```bash
git clone <repository-url> titan-academy
cd titan-academy

pnpm install

cp apps/backend/.env.example apps/backend/.env   # then set every secret; see docs/runbooks/secrets-handling.md

# start infrastructure
docker compose -f docker-compose.local-dev.yml up -d  # LOCAL DEVELOPMENT ONLY; NOT PRODUCTION

cd apps/backend
pnpm prisma:generate
pnpm prisma:deploy           # applies the existing migrations; creates none
pnpm prisma:seed
pnpm dev
```

The backend reads `.env` from its own directory, `apps/backend/`. The dotenv loader reads it from the directory the process starts in, so start the backend from `apps/backend`, as above. `.env` is git-ignored. Set at least these variables:

| Variable | Purpose |
|---|---|
| `CLIENT_URL` | Public URL of the frontend. `http://localhost:3000` locally; must be `https://` in production |
| `DATABASE_URL` | PostgreSQL connection string. Use a local development database; production requires the dedicated `titan_academy` database and role |
| `REDIS_URL` | Redis, used by the BullMQ email and certificate workers |
| `JWT_ACCESS_SECRET` | Signs access tokens. At least 10 characters; at least 32 in production |
| `JWT_REFRESH_SECRET` | Signs refresh tokens. Must differ from `JWT_ACCESS_SECRET` in production |
| `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY` | Credentials for MinIO object storage (uploads) |

Other variables (server port, MinIO endpoint and bucket, SMTP, token lifetimes, Stripe keys, curriculum directory) have defaults. They are defined in `apps/backend/src/config/env.ts`.

For a production or staging environment, start from the placeholder map in `.env.production.example` and follow [docs/INSTALL.md](docs/INSTALL.md). Do not use `apps/backend/.env.example` or `apps/frontend/.env.example` on a server.

> **Developer note:** `pnpm prisma:migrate` runs `prisma migrate dev`. It is interactive, can reset the database, and is only for creating a new migration after you change `schema.prisma`. Do not use it to install or upgrade.

In a second terminal:

```bash
cd apps/frontend
echo 'NEXT_PUBLIC_API_URL="http://localhost:5000/api"' > .env.local
pnpm dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| Mailhog (local email) | http://localhost:8025 |
| MinIO console | http://localhost:9001 (local development credentials only) |

### Existing databases

Before running `pnpm prisma:deploy` against a database that already contains data:

1. Read [`apps/backend/prisma/PREFLIGHT-ORDER.md`](apps/backend/prisma/PREFLIGHT-ORDER.md) for the order of steps.
2. Review the four preflight scripts in `apps/backend/prisma/` before migrating: `preflight-20261108090000-company-rename.sql`, `preflight-20261108100000-external-identity-scope.sql`, `preflight-20261108100100-course-tracks-fk.sql` and `preflight-20261108100200-training-assignment-index-name.sql`.

Environment-specific guidance is in [`docs/runbooks/`](docs/runbooks/).

---

## Demo Accounts

These accounts are created by the local seed script (`pnpm prisma:seed`). They are for local development only. Do not seed them into a shared or production environment. All accounts share one password, which must never be reused.

| Role | Email | Password |
|---|---|---|
| Admin | admin@skilled.local | Password123! |
| Teacher | teacher@skilled.local | Password123! |
| Student | student@skilled.local | Password123! |

The `@skilled.local` domain is a seed identifier. Databases seeded before this change still hold the old `@lms.local` accounts and must be re-seeded to get the new addresses.

---

## API Overview

Route modules live in `apps/backend/src/modules/*/*.routes.ts`. Every response uses the envelope `{ "success": true, "message": "...", "data": {} }`.

| Base path | Purpose |
|---|---|
| `/api/auth` | Register, login, refresh, logout, email verification, password reset |
| `/api/courses` | Course, module and lesson management, video upload |
| `/api/enrollments` | Enrolment, progress tracking, course roster |
| `/api/quizzes` | Quiz builder, attempts, auto-grading |
| `/api/assignments` | Assignments, submissions, grading |
| `/api/classes` | Live class scheduling and attendance |
| `/api/certificates` | Certificate issuance and public verification |
| `/api/payments` | Stripe checkout and coupons |
| `/api/discussions` | Course Q&A threads and replies |
| `/api/admin` | User management and platform analytics |
| `/api/audit-logs` | Platform audit trail |
| `/api/academy/curriculum` | Academy tracks, lessons, outlines, completions, knowledge checks, practical evidence, organisations, business fields, lesson context snapshots, and completion reports |
| `/api/titan/integration` | Service-to-service skill verification (credential-scoped) |

Completion reports (ACA-025):

| Route | Access |
|---|---|
| `GET /api/academy/curriculum/companies/:companyId/completion-reports/learners/:learnerId` | The learner, or an owner, manager or assessor of the same organisation |
| `GET /api/academy/curriculum/companies/:companyId/completion-reports` | Owners and managers of the organisation |

A lesson acknowledgement in these reports is a learning record. It is not a verified competency or a certificate.

---

## Testing and Quality Gates

The figures in this section are from the 2026-11-08 fresh install check, except the Vitest counts, which are from the 2026-11-09 run. The older results in [`PASS42/QUALITY-ops.md`](PASS42/QUALITY-ops.md) are historical and do not describe the current state.

```bash
# Backend unit tests (Vitest). Integration suites skip unless real services are configured (see below)
cd apps/backend && pnpm exec vitest run

# Academy backend suites (no database required; uses an in-memory Prisma double)
pnpm test:academy:backend

# Repository source verification
pnpm test:source

# Lesson player browser suite (starts next dev on port 3100 with a mocked API)
cd apps/frontend && node tests/browser/academy-browser-suite.mjs --report ../../build/browser-report.json

# Curriculum structure and normalisation gate (fails on structural breaks and on regressions)
pnpm curriculum:ci
```

The Academy backend suites run against an in-memory Prisma double. They exercise the real services and routers, but they do not replace testing against PostgreSQL (register ACA-003). The browser suite verifies the lesson player UI against a mocked API. It does not verify the live API (register ACA-019).

A fresh `vitest run` in `apps/backend` reports **61 test files passed, 9 skipped** (70 files) and **928 tests passed, 114 skipped** (2026-11-09, after `prisma generate`). Without the generated Prisma client, 27 files fail to load with `Cannot find module '.prisma/client/default'`, and the run reports 502 tests passed, 103 skipped.

### Backend tests that skip by default

A bare run has no PostgreSQL or Redis. The nine skipped files are gated by `describeWithServices` in [`apps/backend/src/tests/integration/harness.ts`](apps/backend/src/tests/integration/harness.ts). That helper skips a suite unless `DATABASE_URL` and `REDIS_URL` both point at real services. The default placeholders point at `127.0.0.1:1`, where nothing listens.

| Skipped file | Group | Needs |
|---|---|---|
| `src/tests/auth.test.ts` | Auth flow | PostgreSQL and Redis |
| `src/tests/health.test.ts` | `GET /api/health` | PostgreSQL and Redis |
| `src/tests/integration/contract.test.ts` | Consumer contracts for `field-services` and `ai-workforce`, and documented-shape drift checks | PostgreSQL and Redis. One case is an explicit `it.skip` (the business-fields push route is not implemented) |
| `src/tests/integration/cross-tenant.test.ts` | ACA-004 cross-tenant access to the skills API | PostgreSQL and Redis |
| `src/tests/integration/identity-linking.test.ts` | ACA-028 identity linking | PostgreSQL and Redis |
| `src/tests/integration/credential-lifecycle.test.ts` | ACA-017 credential rotation, revocation and expiry | PostgreSQL and Redis |
| `src/tests/integration/learner-status.test.ts` | ACA-016 inactive and deleted learner rejection | PostgreSQL and Redis |
| `src/tests/integration/curriculum-tenant-isolation.test.ts` | ACA-004 curriculum APIs and service credentials (38 tests) | PostgreSQL and Redis |
| `src/tests/integration/payment-checkout-concurrency.test.ts` | Checkout claims under concurrent requests | PostgreSQL and Redis |

To run them, set `DATABASE_URL` to a disposable local PostgreSQL database with the migrations applied, and set `REDIS_URL` to a local Redis. The harness refuses to run unless the database host is `localhost` or `127.0.0.1` and the database name contains `test`, because these suites delete rows. Never point them at a shared or production database.

The skip count is not evidence of integration coverage. A run with skips shows that the enabled tests passed. It does not show that the contract, cross-tenant, credential, identity or learner-status checks ran.

The inherited `pass22` check (`apps/backend/tests/pass22-inactive-identity.test.cjs`) is a source-level Node script. Vitest does not pick it up, because its include pattern matches only `.test.ts` files. `pnpm test` in `apps/backend` runs it with `tsx --test` after Vitest. Its result is not part of the 2026-11-08 install check.

---

## Documentation

- [`TITAN-ACADEMY-MASTER-IMPROVEMENT-REGISTER.md`](TITAN-ACADEMY-MASTER-IMPROVEMENT-REGISTER.md): open items and acceptance criteria
- [`TITAN-ACADEMY-PASS1.md`](TITAN-ACADEMY-PASS1.md), [`TITAN-ACADEMY-PASS2.md`](TITAN-ACADEMY-PASS2.md): curriculum composition passes
- [`TITAN-ACADEMY-CURRICULUM-IMPORT.md`](TITAN-ACADEMY-CURRICULUM-IMPORT.md): curriculum import behaviour
- [`TITAN-ACADEMY-CLEANING-LESSONS.md`](TITAN-ACADEMY-CLEANING-LESSONS.md): cleaning vertical lesson notes
- [`docs/runbooks/`](docs/runbooks/): deployment, secrets handling and recovery
- [`docs/FIELD_SERVICES_CONTEXT_SYNC.md`](docs/FIELD_SERVICES_CONTEXT_SYNC.md): Field Services context synchronisation contract

---

## Origin and licence

Titan Academy began from an inherited MIT-licensed full-stack LMS. Its original author is Farrukh Ali Khan. The copyright notice is retained in [`LICENSE`](LICENSE), as the MIT licence requires.

Released under the [MIT License](LICENSE).
